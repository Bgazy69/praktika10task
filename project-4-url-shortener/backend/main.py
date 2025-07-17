import secrets
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional

app = FastAPI()

# --- CORS рұқсаттары ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Жадта сақталатын "база" ---
# {short_code: {long_url, clicks, created_at}}
url_db = {}

# --- Pydantic модельдері ---
class URLCreate(BaseModel):
    long_url: HttpUrl
    custom_code: Optional[str] = None

# --- Қысқа сілтеме жасау ---
@app.post("/api/shorten")
def create_short_url(url_data: URLCreate, request: Request):
    long_url = str(url_data.long_url)
    custom_code = url_data.custom_code

    if custom_code:
        if custom_code in url_db:
            raise HTTPException(status_code=400, detail="Бұл қысқа код қолданылып қойған")
        short_code = custom_code
    else:
        short_code = secrets.token_urlsafe(4)
        while short_code in url_db:
            short_code = secrets.token_urlsafe(4)

    url_db[short_code] = {
        "long_url": long_url,
        "clicks": 0,
        "created_at": datetime.utcnow()
    }

    short_url = f"{request.base_url}{short_code}"
    return {
        "short_url": short_url,
        "clicks": 0
    }

# --- Қайта бағыттау ---
@app.get("/{short_code}")
def redirect_to_long_url(short_code: str):
    entry = url_db.get(short_code)
    if not entry:
        raise HTTPException(status_code=404, detail="Мұндай қысқа сілтеме табылмады")

    # Мерзімі өтіп кеткенін тексеру (7 күн)
    if datetime.utcnow() - entry["created_at"] > timedelta(days=7):
        raise HTTPException(status_code=404, detail="Сілтеменің мерзімі өтіп кеткен")

    # Click санау
    entry["clicks"] += 1
    return RedirectResponse(url=entry["long_url"])

# --- Тексеру үшін ---
@app.get("/api/stats/{short_code}")
def get_stats(short_code: str):
    entry = url_db.get(short_code)
    if not entry:
        raise HTTPException(status_code=404, detail="Сілтеме табылмады")
    return {
        "clicks": entry["clicks"],
        "created_at": entry["created_at"]
    }
