import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List

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

# --- Файл және деректер ---
DATA_FILE = "polls.json"
polls_db: Dict[str, Dict] = {}

# --- Деректерді жүктеу ---
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        try:
            polls_db = json.load(f)
        except json.JSONDecodeError:
            polls_db = {}

# --- Сақтау функциясы ---
def save_polls():
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(polls_db, f, indent=2, ensure_ascii=False)

# --- Модельдер ---
class PollCreate(BaseModel):
    question: str
    options: List[str]

class VoteData(BaseModel):
    poll_id: str
    option: str

# --- Опрос жасау ---
@app.post("/api/poll/create")
def create_poll(poll: PollCreate):
    poll_id = str(len(polls_db) + 1)
    if not poll.options or len(poll.options) < 2:
        raise HTTPException(status_code=400, detail="Кемінде 2 нұсқа болуы керек")

    polls_db[poll_id] = {
        "question": poll.question,
        "options": {opt: 0 for opt in poll.options}
    }
    save_polls()
    return {"poll_id": poll_id}

# --- Опросты алу ---
@app.get("/api/poll/{poll_id}")
def get_poll(poll_id: str):
    poll = polls_db.get(poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Опрос табылмады")

    # dict -> list түрлендіру
    options_list = [{"option": k, "votes": v} for k, v in poll["options"].items()]
    return {
        "question": poll["question"],
        "options": options_list
    }

# --- Дауыс беру ---
@app.post("/api/poll/vote")
def vote(vote_data: VoteData):
    poll = polls_db.get(vote_data.poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Опрос табылмады")
    if vote_data.option not in poll["options"]:
        raise HTTPException(status_code=400, detail="Мұндай нұсқа жоқ")

    poll["options"][vote_data.option] += 1
    save_polls()
    return {"message": "Дауыс қабылданды"}

# --- Барлық опростар ---
@app.get("/api/poll")
def list_all_poll():
    return [
        {"id": poll_id, "question": data["question"]}
        for poll_id, data in polls_db.items()
    ]
