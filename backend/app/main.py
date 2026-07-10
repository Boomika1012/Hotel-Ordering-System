from contextlib import asynccontextmanager
from app.database import create_table

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  
from app.routes.auth import auth_router
from app.routes.profile import profile_router
from app.routes.wallet import wallet_router

# --- SPRINT 2 IMPORTS ---
from app.routes.menu import router as menu_router
from app.routes.order import router as order_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Table getting created")
    create_table()
    yield

app = FastAPI(lifespan=lifespan)

# --- CORS BLOCK ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)
#---------------------------

# Existing Routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(wallet_router)

# --- NEW SPRINT 2 ROUTERS ---
app.include_router(menu_router)
app.include_router(order_router)