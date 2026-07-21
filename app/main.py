from fastapi import FastAPI
from app.api.router import router as auth_router

app = FastAPI(title="AI Assistant Store")

app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Assistant Store API!"}