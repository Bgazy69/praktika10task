'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:8000/api';

export default function DashboardPage() {
  const [secretMessage, setSecretMessage] = useState('');
  const [adminData, setAdminData] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const role = localStorage.getItem('user_role');

    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Қарапайым қорғалған дерек
        const response = await axios.get(`${API_URL}/secret-data`, {
          headers: {
            Authorization: `${tokenType} ${token}`,
          },
        });
        setSecretMessage(response.data.message); // ✅ міне, дұрыс дерек

        // Егер рөлі admin болса, қосымша дерек сұраймыз
        if (role === 'admin') {
          const adminResp = await axios.get(`${API_URL}/admin-data`, {
            headers: {
              Authorization: `${tokenType} ${token}`,
            },
          });
          setAdminData(adminResp.data.secret); // ✅ міне осында ғана қолдан
        }
      } catch (error) {
        console.error('Auth failed:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user_role');
    localStorage.setItem("token_type", "Bearer");
    router.push('/login');
  };

  if (loading) {
    return <p className="text-center mt-10">Загрузка...</p>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Защищенная Панель</h1>
      <p className="p-4 bg-green-100 border border-green-400 rounded-md mb-6">
        {secretMessage}
      </p>

      {/* Админге ғана арналған бөлік */}
      {adminData && (
        <div className="bg-yellow-100 border border-yellow-400 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold text-yellow-800">🔐 Админ панелі</h2>
          <p className="mt-2">{adminData}</p>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Выйти
      </button>
    </div>
  );
}
