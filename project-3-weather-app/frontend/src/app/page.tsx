'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  icon: string;
}

interface ForecastItem {
  date: string;
  temperature: number;
  description: string;
  icon: string;
}

export default function Home() {
  const [city, setCity] = useState('Almaty');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async (cityName: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`http://localhost:8000/api/weather/${cityName}`);
      setWeather(res.data);

      const forecastRes = await axios.get(`http://localhost:8000/api/forecast/${cityName}`);
      setForecast(forecastRes.data.forecast);
    } catch (err: any) {
      setError('Қала табылмады немесе сервер қатесі');
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await axios.get(`http://localhost:8000/api/weather/coords?lat=${lat}&lon=${lon}`);
          setWeather(res.data);
          setCity(res.data.city_name);
        } catch {
          setError('Геолокация бойынша ауа райын алу мүмкін болмады');
        }
      });
    }
  };

  useEffect(() => {
    fetchWeather(city);
    fetchWeatherByCoords(); // Бетті ашқанда автоматты түрде геолокация
  }, []);

  return (
    <main className="p-8 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-6">Ауа райы қосымшасы</h1>

      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Қаланы енгізіңіз..."
        className="border p-2 rounded w-full mb-4"
      />
      <button
        onClick={() => fetchWeather(city)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-6"
      >
        Іздеу
      </button>

      {loading && <p>Загрузка...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {weather && (
        <div className="bg-white p-4 rounded shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-2">{weather.city}</h2>
          <p className="text-lg">
            {weather.temperature}°C — {weather.description}
          </p>
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            className="mx-auto"
          />
        </div>
      )}

      {forecast.length > 0 && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">5 күндік болжам</h3>
          <ul className="space-y-2">
            {forecast.map((day, index) => (
              <li key={index} className="flex items-center justify-between bg-white p-2 rounded shadow">
                <div>{day.date}</div>
                <div>{day.temperature}°C, {day.description}</div>
                <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt={day.description} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
