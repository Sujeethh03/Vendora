import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from exceptions import register_exception_handlers
from routers import auth, products, cart, order

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Vendora API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

os.makedirs("uploads/products", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(order.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
