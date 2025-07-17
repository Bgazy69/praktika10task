'use client';

import { useEffect, useState, FormEvent } from 'react';
import axios from 'axios';

interface Entry {
  id: string;
  name: string;
  message: string;
  timestamp: string;
}

const API_URL = 'http://localhost:8000/api/entries';
const LIMIT = 5;

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API_URL}?page=${page}&limit=${LIMIT}`);
      setEntries(res.data);
      setHasNext(res.data.length === LIMIT);
    } catch {
      setError('Қонақ кітабын жүктеу қатесі.');
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [page]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError('Аты мен хабарламаны толтырыңыз.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(API_URL, { name, message });
      setName('');
      setMessage('');
      fetchEntries();
    } catch {
      setError('Хабарлама жіберілмеді.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchEntries();
    } catch {
      setError('Жою сәтсіз.');
    }
  };

  const startEdit = (id: string, currentMessage: string) => {
    setEditId(id);
    setEditMessage(currentMessage);
  };

  const handleUpdate = async (id: string) => {
    try {
      await axios.put(`${API_URL}/${id}`, { message: editMessage });
      setEditId(null);
      fetchEntries();
    } catch {
      setError('Өңдеу қатесі.');
    }
  };

  return (
    <main className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Қонақ кітабы</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Жазба қалдыру</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 mb-1">Атыңыз</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Аноним"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="message" className="block text-gray-700 mb-1">Хабарлама</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Сәлем!"
            ></textarea>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {loading ? 'Жіберілуде...' : 'Жіберу'}
          </button>
        </form>

        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-lg shadow">
              {editId === entry.id ? (
                <div>
                  <textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(entry.id)}
                      className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Сақтау
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="px-4 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                      Болдырмау
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-800">{entry.message}</p>
                  <div className="text-right text-sm text-gray-500 mt-2">
                    <strong>- {entry.name}</strong> ({new Date(entry.timestamp).toLocaleString()})
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => startEdit(entry.id, entry.message)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Өңдеу
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Жою
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            ← Артқа
          </button>
          <button
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Алға →
          </button>
        </div>
      </div>
    </main>
  );
}
