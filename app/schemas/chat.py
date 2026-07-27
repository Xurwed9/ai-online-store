from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ToolCallInfo(BaseModel):
    tool: str
    result: dict | list | None = None


class ChatResponse(BaseModel):
    reply: str
    tool_called: str | None = None
    tool_result: dict | list | None = None
    all_tool_calls: list[ToolCallInfo] | None = None
