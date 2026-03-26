import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from exceptions import register_exception_handlers
from routers import auth, products

app = FastAPI(title="Vendora API", version="1.0.0")

os.makedirs("uploads/products", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(products.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
