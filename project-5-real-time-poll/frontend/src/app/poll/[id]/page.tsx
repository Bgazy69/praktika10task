'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';

interface PollOption {
  option: string;
  votes: number;
}

interface PollData {
  question: string;
  options: PollOption[];
}

export default function PollPage() {
  const { id } = useParams();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const voted = localStorage.getItem(`voted_${id}`);
    if (voted) {
      setHasVoted(true);
    }
  }, [id]);

  const fetchPoll = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/poll/${id}`);
      setPoll(res.data);
    } catch (err) {
      console.error('Қате:', err);
    }
  };

  useEffect(() => {
    fetchPoll();
    const interval = setInterval(fetchPoll, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleVote = async () => {
    if (!selected || hasVoted) return;
    try {
      await axios.post(`http://localhost:8000/api/poll/vote`, {
        poll_id: id,
        option: selected,
      });
      localStorage.setItem(`voted_${id}`, selected);
      setHasVoted(true);
      fetchPoll();
    } catch (err) {
      console.error('Дауыс беру қатесі:', err);
    }
  };

  if (!poll) return <p className="text-white">Жүктелуде...</p>;

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
  <div className="max-w-xl mx-auto py-10 px-4 text-white">
    {/* Сұрақ */}
    <h1 className="text-2xl font-bold mb-6 text-cyan-400 text-center">
      {poll.question}
    </h1>

    {hasVoted ? (
      <div className="space-y-4">
        {poll.options.map((opt) => {
          const percent = totalVotes
            ? ((opt.votes / totalVotes) * 100).toFixed(1)
            : '0.0';
          return (
            <div key={opt.option} className="bg-gray-800 p-4 rounded-lg">
              <p className="text-base font-medium text-white mb-1">{opt.option}</p>
              <div className="w-full bg-gray-700 rounded h-6 overflow-hidden">
                <div
                  className="bg-cyan-500 h-6"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-sm text-gray-300 mt-1">
                {opt.votes} дауыс ({percent}%)
              </p>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="space-y-4">
        {poll.options.map((opt) => (
          <label
            key={opt.option}
            className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition"
          >
            <input
              type="radio"
              name="vote"
              value={opt.option}
              onChange={() => setSelected(opt.option)}
              className="w-4 h-4 accent-cyan-500"
            />
            <span className="text-white text-base">{opt.option}</span>
          </label>
        ))}

        <button
          onClick={handleVote}
          className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white w-full"
        >
          Дауыс беру
        </button>
      </div>
    )}
  </div>
);

}
