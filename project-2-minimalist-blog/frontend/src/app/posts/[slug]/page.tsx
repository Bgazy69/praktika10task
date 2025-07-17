'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Post {
  slug: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
}

const API_URL = 'http://localhost:8000/api/posts';

export default function PostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const fetchPost = async () => {
        try {
          const response = await axios.get(`${API_URL}/${slug}`);
          setPost(response.data);
        } catch (error) {
          console.error(`Error fetching post ${slug}:`, error);
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return <div className="text-center p-10">Загрузка...</div>;
  }

  if (!post) {
    return <div className="text-center p-10">Пост не найден</div>;
  }

  return (
    <article className="max-w-3xl mx-auto p-8 bg-white rounded shadow">
      <Link href="/" className="text-blue-500 hover:underline mb-6 block">
        ← Басты бетке
      </Link>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">{post.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Автор: {post.author} | {post.date} | Санат: {post.category}
      </p>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold my-3" {...props} />,
          p: ({ node, ...props }) => <p className="my-2 text-gray-800" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-600 underline" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-6 my-2" {...props} />,
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
        }}
      >
        {post.content}
      </ReactMarkdown>
    </article>
  );
}
