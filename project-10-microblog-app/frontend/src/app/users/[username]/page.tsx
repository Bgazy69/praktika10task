'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

interface Post {
  id: number;
  text: string;
  timestamp: string;
  owner_id: number;
  owner_username: string;
  like_count: number;
}

export default function UserPostsPage() {
  const router = useRouter();
  const params = useParams();
  const username = Array.isArray(params.username) ? params.username[0] : params.username;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/users/${username}/posts`);
      setPosts(res.data);
    } catch (err) {
      setError('Пайдаланушы табылмады немесе қате орын алды.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) fetchUserPosts();
  }, [username]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <button onClick={() => router.back()} className="text-blue-500 mb-4">← Артқа</button>
      <h1 className="text-2xl font-bold mb-6">Профиль: {username}</h1>

      {loading ? (
        <p>Жүктелуде...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : posts.length === 0 ? (
        <p>Бұл пайдаланушыда пост жоқ.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded shadow">
              <p>{post.text}</p>
              <small className="text-gray-500">
                {new Date(post.timestamp).toLocaleString()} • ❤️ {post.like_count}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
