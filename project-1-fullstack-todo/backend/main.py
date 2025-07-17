import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

origins = ["http://localhost:3000", "http://localhost"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TodoItem(BaseModel):
    id: str
    task: str
    completed: bool = False

class TodoCreate(BaseModel):
    task: str

class TodoUpdate(BaseModel):
    task: str

fake_db: List[TodoItem] = []

@app.get("/api/todos", response_model=List[TodoItem])
async def get_todos():
    return fake_db

@app.post("/api/todos", response_model=TodoItem)
async def add_todo(todo: TodoCreate):
    new = TodoItem(id=str(uuid.uuid4()), task=todo.task, completed=False)
    fake_db.append(new)
    return new

@app.patch("/api/todos/{todo_id}", response_model=TodoItem)
async def toggle_complete(todo_id: str):
    for t in fake_db:
        if t.id == todo_id:
            t.completed = not t.completed
            return t
    raise HTTPException(status_code=404, detail="Not found")

@app.put("/api/todos/{todo_id}", response_model=TodoItem)
async def update_task(todo_id: str, data: TodoUpdate):
    for t in fake_db:
        if t.id == todo_id:
            t.task = data.task
            return t
    raise HTTPException(status_code=404, detail="Not found")

@app.delete("/api/todos/{todo_id}")
async def delete_todo(todo_id: str):
    global fake_db
    fake_db = [t for t in fake_db if t.id != todo_id]
    return {"message": "Deleted"}

@app.delete("/api/todos/clear-completed")
async def clear_completed():
    global fake_db
    fake_db = [t for t in fake_db if not t.completed]
    return {"message": "Completed tasks deleted"}

@app.get("/")
async def root():
    return {"message": "Server running"}
