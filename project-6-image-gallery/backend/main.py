import os
import uuid
import aiofiles
from fastapi import FastAPI, UploadFile, File, HTTPException, Path
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List

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

# --- Суреттерді сақтау жолы ---
IMAGE_DIR = "static/images/"
os.makedirs(IMAGE_DIR, exist_ok=True)

# --- Статикалық файлдарды тарату ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Максималды өлшем (5 МБ) ---
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 мегабайт


@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл сурет емес.")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Файлда атауы жоқ.")

    # Мазмұнды оқимыз және өлшемін тексереміз
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Файл 5 МБ-тан аспауы керек.")

    # Бірегей атау береміз
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(IMAGE_DIR, unique_filename)

    # Файлды сақтаймыз
    try:
        async with aiofiles.open(file_path, mode="wb") as out_file:
            await out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Сақтау қатесі: {e}")

    return {"url": f"/static/images/{unique_filename}"}


@app.get("/api/images", response_model=List[str])
async def get_images():
    try:
        files = os.listdir(IMAGE_DIR)
        image_urls = [
            f"/static/images/{f}" for f in files
            if os.path.isfile(os.path.join(IMAGE_DIR, f))
        ]
        return image_urls
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Файл тізімі қатесі: {e}")


@app.delete("/api/images/{filename}")
async def delete_image(filename: str = Path(...)):
    file_path = os.path.join(IMAGE_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Файл табылмады.")

    try:
        os.remove(file_path)
        return {"message": "Файл сәтті жойылды."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Жою қатесі: {e}")
