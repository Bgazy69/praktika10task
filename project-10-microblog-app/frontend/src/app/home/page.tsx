'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // ✅ Сілтеме үшін

interface Post {
  id: number;
  text: string;
  owner_id: number;
  owner_username: string;
  timestamp: string;
  like_count: number;
  liked_by_user: boolean;
}

interface User {
  id: number;
  username: string;
}

const API = 'http://localhost:8000/api';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newText, setNewText] = useState('');
  const router = useRouter();

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      console.error('Посттарды алу қатесі:', err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored || !token) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));
    fetchPosts();
  }, [router]);

  const handlePost = async () => {
    try {
      await axios.post(
        `${API}/posts`,
        { text: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewText('');
      fetchPosts();
    } catch {
      alert('Пост жасау қатесі');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Постты жоямыз ба?')) return;
    try {
      await axios.delete(`${API}/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPosts();
    } catch {
      alert('Жою мүмкін болмады');
    }
  };

  const handleLike = async (id: number, liked: boolean) => {
    try {
      if (liked) {
        await axios.delete(`${API}/posts/${id}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `${API}/posts/${id}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchPosts();
    } catch (err) {
      console.error('Лайк қатесі:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Лента</h1>
        <button onClick={handleLogout} className="text-red-500">
          Выйти
        </button>
      </div>

      <textarea
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
        placeholder="Напиши что-нибудь..."
        className="w-full p-2 border rounded mb-3"
        rows={3}
      ></textarea>
      <button
        onClick={handlePost}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Опубликовать
      </button>

      <div className="mt-6 space-y-4">
        {posts.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded shadow relative">
            <p>{p.text}</p>
            <div className="text-xs text-gray-500 mt-2">
              <Link href={`/users/${p.owner_username}`} className="text-blue-600 hover:underline">
                <strong>{p.owner_username}</strong>
              </Link> — {new Date(p.timestamp).toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-4">
              <button
                onClick={() => handleLike(p.id, p.liked_by_user)}
                className="text-blue-600"
              >
                {p.liked_by_user ? '❤️' : '🤍'} {p.like_count}
              </button>
              {user && user.id === p.owner_id && (
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-500 absolute top-2 right-2"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
