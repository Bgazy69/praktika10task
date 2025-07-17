import json
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import aiofiles
import os

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

DB_FILE = "data/guestbook.json"
os.makedirs("data", exist_ok=True)
if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        f.write("[]")

# --- Модели ---
class GuestbookEntry(BaseModel):
    id: str
    name: str
    message: str
    timestamp: datetime

class EntryCreate(BaseModel):
    name: str
    message: str

class EntryUpdate(BaseModel):
    message: str

# --- Вспомогательные функции ---
async def read_db() -> List[GuestbookEntry]:
    async with aiofiles.open(DB_FILE, mode="r", encoding="utf-8") as f:
        content = await f.read()
        if not content:
            return []
        data = json.loads(content)
        return [GuestbookEntry(**item) for item in data]

async def write_db(data: List[GuestbookEntry]):
    export_data = [item.model_dump(mode="json") for item in data]
    async with aiofiles.open(DB_FILE, mode="w", encoding="utf-8") as f:
        await f.write(json.dumps(export_data, indent=4, ensure_ascii=False))

# --- Эндпоинты ---
@app.get("/api/entries")
async def get_entries(page: int = 1, limit: int = 10):
    entries = await read_db()
    start = (page - 1) * limit
    end = start + limit
    return entries[::-1][start:end]  # Последние сверху

@app.post("/api/entries", response_model=GuestbookEntry, status_code=201)
async def create_entry(entry_data: EntryCreate):
    entries = await read_db()
    new_entry = GuestbookEntry(
        id=str(uuid.uuid4()),
        name=entry_data.name,
        message=entry_data.message,
        timestamp=datetime.now(timezone.utc),
    )
    entries.append(new_entry)
    await write_db(entries)
    return new_entry

@app.delete("/api/entries/{entry_id}", status_code=204)
async def delete_entry(entry_id: str):
    entries = await read_db()
    updated = [e for e in entries if e.id != entry_id]
    if len(entries) == len(updated):
        raise HTTPException(status_code=404, detail="Жазба табылмады")
    await write_db(updated)
    return

@app.put("/api/entries/{entry_id}", response_model=GuestbookEntry)
async def update_entry(entry_id: str, update: EntryUpdate):
    entries = await read_db()
    for entry in entries:
        if entry.id == entry_id:
            entry.message = update.message
            await write_db(entries)
            return entry
    raise HTTPException(status_code=404, detail="Жазба табылмады")
