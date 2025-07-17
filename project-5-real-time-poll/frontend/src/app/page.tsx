'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface PollPreview {
  id: string;
  question: string;
}

export default function Home() {
  const [polls, setPolls] = useState<PollPreview[]>([]);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/poll");
        setPolls(res.data);
      } catch (err) {
        console.error('Қате:', err);
      }
    };

    fetchPolls();
  }, []);

  return (
    <main className="max-w-2xl mx-auto py-10 px-4 text-white">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Нақты уақыттағы Опрос</h1>

      <div className="mb-6 text-center">
        <Link
          href="/create"
          className="inline-block px-5 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white"
        >
          + Жаңа опрос жасау
        </Link>
      </div>

      {polls.length === 0 ? (
        <p className="text-center text-gray-400">Әзірше опростар жоқ.</p>
      ) : (
        <ul className="space-y-4">
          {polls.map((poll) => (
            <li key={poll.id} className="bg-gray-800 p-4 rounded-lg shadow">
              <Link href={`/poll/${poll.id}`} className="text-lg text-cyan-300 hover:underline">
                {poll.question}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
