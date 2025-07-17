'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function CreatePollPage() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleChangeOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || options.filter((opt) => opt.trim()).length < 2) {
      setError('Сұрақ және кемінде екі нұсқа қажет');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/poll/create', {
        question,
        options: options.filter((opt) => opt.trim()),
      });
      const pollId = response.data.poll_id;
      router.push(`/poll/${pollId}`);
    } catch (err) {
      setError('Сервер қатесі немесе дұрыс емес деректер');
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow-xl space-y-6">
        <h1 className="text-2xl font-bold text-cyan-400 text-center">Жаңа опрос жасау</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Сұрақ:</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block mb-1 text-sm">Нұсқалар:</label>
            {options.map((opt, index) => (
              <input
                key={index}
                type="text"
                value={opt}
                onChange={(e) => handleChangeOption(index, e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none text-white"
                required
              />
            ))}
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-2 text-sm text-cyan-400 hover:underline"
            >
              + Нұсқа қосу
            </button>
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full py-3 font-semibold bg-cyan-600 rounded hover:bg-cyan-700 transition-colors"
          >
            Опрос жасау
          </button>
        </form>
      </div>
    </main>
  );
}
