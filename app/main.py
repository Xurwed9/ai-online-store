from fastapi import FastAPI
from app.api.router import router as auth_router
from app.api.category import router as categories_router
from app.api.product import router as products_router

app = FastAPI(title="AI Assistant Store")

app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Assistant Store API!"}