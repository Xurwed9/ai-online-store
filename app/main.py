import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from app.api.router import router as auth_router
from app.api.category import router as categories_router
from app.api.product import router as products_router
from app.api.cart import router as cart_router
from app.api.order import router as order_router
from app.api.payment import router as payment_router
from app.api.chat import router as chat_router
from app.api.review import router as review_router
from app.api.favorite import router as favorites_router
from app.mcp.client import mcp_manager

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await mcp_manager.connect()
    except Exception as e:
        logger.warning(f"MCP server connection failed: {e}. AI chat will be unavailable.")
    yield
    try:
        await mcp_manager.disconnect()
    except Exception:
        pass


app = FastAPI(title="AI Assistant Store", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://ai-online-store-frontend.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(payment_router)
app.include_router(chat_router)
app.include_router(review_router)
app.include_router(favorites_router)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")
