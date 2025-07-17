'use client';
import { useState, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/login', { username, password });
      localStorage.setItem('auth_token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.push('/home');
    } catch {
      setError('Неверный логин или пароль.');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-center">Вход</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <input type="text" placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 mb-3 border rounded" />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mb-3 border rounded" />
        <button className="w-full bg-blue-500 text-white py-2 rounded">Войти</button>
      </form>
    </div>
  );
}
