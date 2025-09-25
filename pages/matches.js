import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { matches } from '../lib/api';

export default function Matches() {
  const router = useRouter();
  const [matchList, setMatchList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/');
      return;
    }
    fetchMatches();
  }, [router]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await matches.getAll();
      setMatchList(response.data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    }
    setLoading(false);
  };

  const copyToClipboard = (text, matchId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(matchId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">My Matches</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/swipe')}
              className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              Swipe
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              Profile
            </button>
          </div>
        </div>

        {/* Matches List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : matchList.length > 0 ? (
            matchList.map((match) => (
              <div 
                key={match.id} 
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow animate-fade-in"
              >
                <div className="flex items-center space-x-4">
                  {/* Photo */}
                  <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    {match.partner.photo ? (
                      <img
                        src={match.partner.photo}
                        alt={match.partner.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                        👤
                      </div>
                    )}
                  </div>

                  {/* Match Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {match.partner.username}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Matched {formatDate(match.created_at)}
                    </p>
                    
                    {/* Contact Info */}
                    <div className="bg-gradient-to-r from-primary-50 to-purple-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-primary-900 mb-1">
                        Contact Information:
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-primary-700 font-mono text-sm break-all">
                          {match.partner.contact}
                        </p>
                        <button
                          onClick={() => copyToClipboard(match.partner.contact, match.id)}
                          className="ml-2 text-primary-600 hover:text-primary-800 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedId === match.id ? '✓' : '📋'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">💔</div>
              <p className="text-gray-500 mb-4 text-lg">No matches yet</p>
              <p className="text-sm text-gray-400 mb-6">
                Keep swiping to find your perfect sole mate!
              </p>
              <button
                onClick={() => router.push('/swipe')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Start Swiping
              </button>
            </div>
          )}
        </div>

        {/* Refresh button if has matches */}
        {!loading && matchList.length > 0 && (
          <button
            onClick={fetchMatches}
            className="w-full mt-6 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Refresh Matches
          </button>
        )}
      </div>
    </div>
  );
}