from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models
from database import SessionLocal, engine, Base
from pydantic import BaseModel
from uuid import uuid4

# --- Инициализация ---
app = FastAPI()
Base.metadata.create_all(bind=engine)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DB сессия ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Фейк қолданушылар ---
fake_users = {
    "user1": {"username": "user1", "password": "password1"},
    "user2": {"username": "user2", "password": "password2"},
}

# --- Pydantic модельдер ---
class LoginRequest(BaseModel):
    username: str
    password: str

class PostCreate(BaseModel):
    text: str

class PostOut(BaseModel):
    id: int
    text: str
    timestamp: datetime
    owner_id: int
    owner_username: str
    like_count: int

    class Config:
        orm_mode = True

# --- Авторизация ---
@app.post("/api/login")
def login(data: LoginRequest):
    user = fake_users.get(data.username)
    if not user or user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    token = data.username  # Токен ретінде username-ді қолданамыз
    return {"access_token": token, "user": {"username": data.username}}

# --- Токен тексеру ---
def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token missing")
    token = authorization.split(" ")[1]
    user = fake_users.get(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token  # user_id ретінде username қайтарылады

# --- Пост құру ---
@app.post("/api/posts")
def create_post(data: PostCreate, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    user_obj = db.query(models.User).filter(models.User.username == username).first()
    if not user_obj:
        user_obj = models.User(username=username)
        db.add(user_obj)
        db.commit()
        db.refresh(user_obj)
    post = models.Post(text=data.text, owner_id=user_obj.id, timestamp=datetime.utcnow())
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"message": "Пост добавлен"}

# --- Барлық посттарды алу ---
@app.get("/api/posts", response_model=List[PostOut])
def get_posts(db: Session = Depends(get_db)):
    posts = db.query(models.Post).all()
    result = []
    for post in posts:
        owner = db.query(models.User).filter(models.User.id == post.owner_id).first()
        like_count = db.query(models.Like).filter(models.Like.post_id == post.id).count()
        result.append(PostOut(
            id=post.id,
            text=post.text,
            timestamp=post.timestamp,
            owner_id=post.owner_id,
            owner_username=owner.username,
            like_count=like_count
        ))
    return result

# --- Пост жою ---
@app.delete("/api/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    user_obj = db.query(models.User).filter(models.User.username == username).first()
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Пост табылмады")
    if post.owner_id != user_obj.id:
        raise HTTPException(status_code=403, detail="Тек өз постыңды жоя аласың")
    db.delete(post)
    db.commit()
    return {"message": "Пост удален"}

# --- Белгілі бір пайдаланушының посттары ---
@app.get("/api/users/{username}/posts", response_model=List[PostOut])
def get_user_posts(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")
    posts = db.query(models.Post).filter(models.Post.owner_id == user.id).all()
    result = []
    for post in posts:
        like_count = db.query(models.Like).filter(models.Like.post_id == post.id).count()
        result.append(PostOut(
            id=post.id,
            text=post.text,
            timestamp=post.timestamp,
            owner_id=post.owner_id,
            owner_username=username,
            like_count=like_count
        ))
    return result

# --- Лайк басу ---
@app.post("/api/posts/{post_id}/like")
def like_post(post_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.username == username).first()
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Пост табылмады")
    existing = db.query(models.Like).filter(models.Like.user_id == user.id, models.Like.post_id == post_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Сен бұл постқа лайк басқансың")
    like = models.Like(user_id=user.id, post_id=post_id)
    db.add(like)
    db.commit()
    return {"message": "Лайк қойылды"}

# --- Лайкты алып тастау ---
@app.delete("/api/posts/{post_id}/like")
def unlike_post(post_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.username == username).first()
    like = db.query(models.Like).filter(models.Like.user_id == user.id, models.Like.post_id == post_id).first()
    if not like:
        raise HTTPException(status_code=404, detail="Сен бұл постқа лайк баспағансың")
    db.delete(like)
    db.commit()
    return {"message": "Лайк алынып тасталды"}
