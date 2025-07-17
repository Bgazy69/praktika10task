import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# --- CORS Рұқсаттары ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OpenWeatherMap API кілті ---
API_KEY = os.getenv("OPENWEATHER_API_KEY")
CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
ONECALL_URL = "https://api.openweathermap.org/data/3.0/onecall"

# --- 1. Қала аты арқылы ауа райын алу ---
@app.get("/api/weather/{city}")
async def get_weather(city: str):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API кілті табылмады")

    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric",
        "lang": "ru"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(CURRENT_URL, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("message", "Қате"))

    data = response.json()
    return {
        "city": data["name"],
        "temperature": data["main"]["temp"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"]
    }

# --- 2. Геолокация (ендік, бойлық) арқылы ауа райы ---
@app.get("/api/weather/coords")
async def get_weather_by_coords(lat: float, lon: float):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API кілті табылмады")

    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric",
        "lang": "ru"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(CURRENT_URL, params=params)

    try:
        data = response.json()
    except Exception:
        raise HTTPException(status_code=response.status_code, detail="Жауапты оқу мүмкін емес")

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=data.get("message", "Қате"))

    return {
        "city": data.get("name", "Белгісіз"),  # 'Белгісіз' деп fallback істейміз
        "temperature": data["main"]["temp"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"]
    }


# --- 3. 5 күндік ауа райы болжамы ---
@app.get("/api/forecast/{city}")
async def get_forecast(city: str):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API кілті табылмады")

    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric",
        "lang": "ru"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(FORECAST_URL, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("message", "Қате"))

    data = response.json()

    # Тек 12:00 уақыттағы күндізгі болжамдарды жинау
    forecast_data = []
    for item in data["list"]:
        if "12:00:00" in item["dt_txt"]:
            forecast_data.append({
                "date": item["dt_txt"].split(" ")[0],
                "temperature": item["main"]["temp"],
                "description": item["weather"][0]["description"],
                "icon": item["weather"][0]["icon"]
            })

    return {
        "city": data["city"]["name"],
        "forecast": forecast_data
    }

@app.get("/api/weather/onecall")
async def get_weather_by_coords(lat: float, lon: float):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API кілті табылмады")

    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric",
        "lang": "ru",
        "exclude": "minutely,hourly,daily,alerts"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(ONECALL_URL, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()
    return {
        "temperature": data["current"]["temp"],
        "description": data["current"]["weather"][0]["description"],
        "icon": data["current"]["weather"][0]["icon"]
    }

# --- Тест маршруты ---
@app.get("/")
async def root():
    return {"message": "Weather API is running"}
