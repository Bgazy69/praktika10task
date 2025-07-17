'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';

interface Todo {
  id: string;
  task: string;
  completed: boolean;
}

const API_URL = 'http://localhost:8000/api/todos';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get(API_URL);
        setTodos(response.data);
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };
    fetchTodos();
  }, []);

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await axios.post(API_URL, { task: newTask });
      setTodos([...todos, response.data]);
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}`);
      setTodos(todos.map(todo => (todo.id === id ? response.data : todo)));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditClick = (todo: Todo) => {
    setEditingId(todo.id);
    setEditedText(todo.task);
  };

  const handleEditSave = async (id: string) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, { task: editedText });
      setTodos(todos.map(todo => (todo.id === id ? response.data : todo)));
      setEditingId(null);
    } catch (error) {
      console.error('Error editing task:', error);
    }
  };

  const handleClearCompleted = async () => {
  try {
    await axios.delete('http://localhost:8000/api/todos/clear-completed');
    setTodos(todos.filter(todo => !todo.completed));
  } catch (error) {
    console.error("Error clearing completed tasks:", error);
  }
};

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-cyan-400">Full-Stack To-Do List</h1>

        <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-grow p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Add
          </button>
        </form>

        <button
          onClick={handleClearCompleted}
          className="mb-4 text-sm text-pink-400 hover:underline"
        >
          🧹 Clear Completed Tasks
        </button>

        <ul className="space-y-3">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
              {editingId === todo.id ? (
                <>
                  <input
                    type="text"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="flex-grow bg-gray-600 text-white p-1 mr-2 rounded"
                  />
                  <button
                    onClick={() => handleEditSave(todo.id)}
                    className="text-green-400 hover:text-green-600 text-sm"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span
                    onClick={() => handleToggleComplete(todo.id)}
                    className={`cursor-pointer flex-grow ${
                      todo.completed ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {todo.task}
                  </span>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleEditClick(todo)}
                      className="text-yellow-400 hover:text-yellow-600 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(todo.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
