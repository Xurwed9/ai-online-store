import asyncio
import os
import sys
import json
import logging
import httpx

from dotenv import load_dotenv

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

load_dotenv(override=True)

logger = logging.getLogger(__name__)

SERVER_PATH = os.path.join(os.path.dirname(__file__), "server.py")

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"


# ============================================================
# MCPManager — persistent connection for FastAPI app
# ============================================================


class MCPManager:
    """Manages a persistent connection to the MCP server (stdio transport)."""

    def __init__(self):
        self._session: ClientSession | None = None
        self._cm = None
        self._tools: list[dict] = []
        self._lock = asyncio.Lock()

    async def connect(self):
        if self._session:
            return

        async with self._lock:
            if self._session:
                return

            server_params = StdioServerParameters(
                command=sys.executable,
                args=[SERVER_PATH],
            )

            self._cm = stdio_client(server_params)
            read, write = await self._cm.__aenter__()

            self._session = ClientSession(read, write)
            await self._session.__aenter__()
            await self._session.initialize()

            tools_result = await self._session.list_tools()
            self._tools = []
            for tool in tools_result.tools:
                self._tools.append({
                    "name": tool.name,
                    "description": tool.description or "",
                    "parameters": tool.inputSchema,
                })

            logger.info(f"MCP connected: {len(self._tools)} tools available")

    async def disconnect(self):
        if self._session:
            try:
                await self._session.__aexit__(None, None, None)
            except Exception:
                pass
            self._session = None

        if self._cm:
            try:
                await self._cm.__aexit__(None, None, None)
            except Exception:
                pass
            self._cm = None

        self._tools = []

    def get_tools_for_ai(self) -> str:
        """Get tool descriptions formatted for AI system prompt."""
        lines = []
        for tool in self._tools:
            params = list(tool["parameters"].get("properties", {}).keys())
            params_str = ", ".join(params) if params else "no parameters"
            lines.append(f"- {tool['name']}({params_str}): {tool['description']}")
        return "\n".join(lines)

    def get_tools_for_openai(self) -> list[dict]:
        """Get tools in OpenAI function-calling format."""
        openai_tools = []
        for tool in self._tools:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["parameters"],
                },
            })
        return openai_tools

    async def call_tool(self, tool_name: str, arguments: dict) -> dict:
        if not self._session:
            await self.connect()

        result = await self._session.call_tool(tool_name, arguments)

        text = ""
        if result.content:
            texts = []
            for item in result.content:
                if hasattr(item, "text"):
                    texts.append(item.text)
            text = "\n".join(texts) if texts else str(result.content)

        try:
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            return {"result": text}


mcp_manager = MCPManager()


# ============================================================
# Standalone test client (like mcp_test/client.py)
# ============================================================

SYSTEM_PROMPT = """Ты — AI-ассистент магазина. Помогаешь найти товары и оформить заказ.

АЛГОРИТМ:
1. Пользователь ищет товар → ОДИН вызов search_products.
2. Покажи товары. НЕ вызывай check_stock — stock уже в ответе!
3. Пользователь выбрал → add_to_cart.
4. get_cart_total → спроси "Оформить?"
5. Согласие → create_order.

ПРАВИЛА:
- ОДИН tool call за раз. НЕ вызывай search_products дважды!
- Если пусто → recommend_products.
- НЕ подтверждай заказ без согласия."""


async def _groq_chat(messages: list[dict], tools: list[dict] = None) -> dict:
    """Call Groq chat completions API via httpx."""
    api_key = os.getenv("GROQ_API_KEY", "")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1500,
    }
    if tools:
        payload["tools"] = tools

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
        )
    resp.raise_for_status()
    return resp.json()


async def test_client(user_message: str = "Find cheapest products in the store"):
    """Standalone test client — like mcp_test/client.py."""

    server_params = StdioServerParameters(
        command=sys.executable,
        args=[SERVER_PATH],
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools = await session.list_tools()

            print("\nMCP Tools:")
            for tool in tools.tools:
                print(f"- {tool.name}")

            openai_tools = []
            for tool in tools.tools:
                openai_tools.append({
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.inputSchema,
                    },
                })

            print(f"\nUser: {user_message}")

            data = await _groq_chat(
                [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                openai_tools,
            )

            message = data["choices"][0]["message"]
            tool_calls_raw = message.get("tool_calls")

            if tool_calls_raw:
                for tc in tool_calls_raw:
                    function_name = tc["function"]["name"]
                    arguments = json.loads(tc["function"]["arguments"])

                    print(f"\nGroq selected tool: {function_name}")
                    print(f"Arguments: {arguments}")

                    result = await session.call_tool(function_name, arguments)
                    print(f"\nMCP Result: {result}")

                    final_response = await _groq_chat([
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                        {"role": "assistant", "content": message.get("content"), "tool_calls": tool_calls_raw},
                        {"role": "tool", "tool_call_id": tc["id"], "content": str(result.content)},
                    ])

                    print(f"\nGroq final answer:\n{final_response['choices'][0]['message']['content']}")
            else:
                print(f"\nGroq answer (no tool call):\n{message.get('content')}")


if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "Find cheapest products in the store"
    asyncio.run(test_client(msg))
