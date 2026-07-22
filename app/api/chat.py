from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.core.dependencies import get_current_user
from app.models.models import User
from app.services.ai import chat_with_ai

router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.post("/", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    messages = [{"role": m.role, "content": m.content} for m in data.messages]
    result = await chat_with_ai(messages=messages, user_id=user.id, db=db)
    return ChatResponse(
        reply=result["reply"],
        tool_called=result.get("tool_called"),
        tool_result=result.get("tool_result"),
    )
