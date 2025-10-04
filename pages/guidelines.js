import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Guidelines() {
  const router = useRouter();
  const [content, setContent] = useState('Loading...');
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/legal/guidelines`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content);
        setLastUpdated(new Date(data.last_updated).toLocaleDateString());
      })
      .catch(err => {
        console.error('Failed to load guidelines:', err);
        setContent('Failed to load community guidelines. Please try again later.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-800 mb-6 flex items-center gap-2 transition-colors"
          >
            ← Back to Home
          </button>
          
          <h1 className="text-3xl font-bold text-primary-700 mb-2">Community Guidelines</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mb-6">Last Updated: {lastUpdated}</p>
          )}
          
          <div className="prose prose-purple max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}