from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Annotated, Dict
from uuid import uuid4
from datetime import datetime, timedelta

app = FastAPI()

# --- CORS ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Фейковые пользователи ---
USERS_DB = {
    "admin": {"username": "admin", "password": "adminpass", "role": "admin"},
    "user": {"username": "user", "password": "userpass", "role": "user"},
}

# --- Активные токены: token -> {username, role, created_at} ---
active_tokens: Dict[str, Dict] = {}

# --- Модель токена ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

# --- Зависимость: Проверка токена ---
async def get_current_user(authorization: Annotated[str, Header()]):
    print("Authorization header:", authorization)
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ")[1]
    user_data = active_tokens.get(token)

    print("User data from token:", user_data)  # 👈 Debug

    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    created_at: datetime = user_data["created_at"]
    if datetime.utcnow() - created_at > timedelta(hours=1):
        del active_tokens[token]
        raise HTTPException(status_code=401, detail="Token expired")

    return user_data

# --- Текущий юзер + проверка роли ---
async def get_admin_user(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# --- Авторизация ---
@app.post("/api/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = USERS_DB.get(form_data.username)
    if not user or user["password"] != form_data.password:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = str(uuid4())
    active_tokens[token] = {
        "username": user["username"],
        "role": user["role"],
        "created_at": datetime.utcnow(),
    }

    return {"access_token": token, "token_type": "Bearer", "role": user["role"]}

# --- Защищенный эндпоинт ---
@app.get("/api/secret-data")  # ✅ Мұнда атауын өзгерт
async def secret_data(user=Depends(get_current_user)):
    return {"message": f"Hello, {user['username']}! You are a {user['role']}."}

# --- Деректер тек әкімшіге ---
@app.get("/api/admin-data")
async def admin_data(admin=Depends(get_admin_user)):
    return {"secret": "This is admin-only information."}

# --- Логаут ---
@app.post("/api/logout")
async def logout(authorization: Annotated[str, Header()]):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.split(" ")[1]
    if token in active_tokens:
        del active_tokens[token]
    return {"message": "Logged out successfully"}
