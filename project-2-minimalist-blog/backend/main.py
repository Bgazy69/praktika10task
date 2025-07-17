from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class PostBase(BaseModel):
    id: int
    title: str
    slug: str
    author: str
    date: str
    category: str

class PostFull(PostBase):
    content: str

# --- Fake DB ---
fake_posts_db: List[PostFull] = [
    PostFull(
        id=1,
        slug="first-post",
        title="Мой первый пост",
        content="""## Бұл менің бірінші постым

**Бұл блог** веб-даму туралы.

- HTML
- CSS
- JavaScript

Көбірек білу үшін [осында бас](https://developer.mozilla.org/).""",
        author="Bigazy",
        date="2025-07-10",
        category="Жаңалықтар"
    ),
    PostFull(
        id=2,
        slug="fastapi-and-nextjs",
        title="FastAPI + Next.js = ❤️",
        content="""### FastAPI + Next.js = 💥

FastAPI — Python негізіндегі заманауи backend фреймворк.

Next.js — React-пен жасалған қуатты frontend фреймворк.

**Біріктірсең:** толық стек қосымша шығады!

```bash
uvicorn main:app --reload
npm run dev
```""",
        author="Bigazy",
        date="2025-07-10",
        category="Веб-даму"
    ),
    PostFull(
        id=3,
        slug="why-i-love-python",
        title="Почему я люблю Python",
        content="""## Неліктен мен Python тілін жақсы көрем

Python тілі:

- **Оқуға жеңіл**
- Көп салаларда қолданылады: *backend, data science, AI*
- Үлкен қауымдастық пен кітапханалар бар

> "Simple is better than complex." — Zen of Python""",
        author="Bigazy",
        date="2025-07-10",
        category="Бағдарламалау"
    )
]


@app.get("/api/posts", response_model=List[PostBase])
async def get_all_posts():
    return fake_posts_db

@app.get("/api/posts/{slug}", response_model=PostFull)
async def get_post_by_slug(slug: str):
    for post in fake_posts_db:
        if post.slug == slug:
            return post
    raise HTTPException(status_code=404, detail="Post not found")

@app.get("/")
async def root():
    return {"message": "Blog API is running"}
