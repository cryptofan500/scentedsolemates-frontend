import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
// FIX: Corrected import path from './lib/api' to '../lib/api'
import { messages, matches, auth } from '../lib/api';

export default function Chat() {
  const router = useRouter();
  const { matchId } = router.query;
  const [conversation, setConversation] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchInfo, setMatchInfo] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);
  const currentUserId = useRef(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Get current user ID from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      currentUserId.current = user.id;
    }

    // Load match info and messages if matchId is available
    if (matchId) {
      loadMatchInfo();
      loadMessages();
      
      // Set up polling for new messages
      pollingInterval.current = setInterval(loadMessages, 3000);
    }

    // Cleanup on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [matchId, router]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMatchInfo = async () => {
    try {
      const response = await matches.getAll();
      const match = response.data.find(m => m.id === matchId);
      if (match) {
        setMatchInfo(match);
      } else {
        setError('Match not found');
      }
    } catch (err) {
      console.error('Failed to load match info:', err);
      setError('Failed to load match information');
    }
  };

  const loadMessages = async () => {
    if (!matchId) return;
    
    try {
      const response = await messages.getConversation(matchId);
      setConversation(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;
    
    const messageContent = newMessage.trim();
    if (messageContent.length > 5000) {
      alert('Message is too long. Maximum 5000 characters.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await messages.send(matchId, messageContent);
      
      // Add new message to conversation immediately
      setConversation([...conversation, response.data]);
      setNewMessage('');
      
      // Reload messages to ensure sync
      setTimeout(loadMessages, 500);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    }
    
    setSending(false);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleBack = () => {
    router.push('/matches');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      auth.logout();
    }
  };

  if (!matchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">No match selected</p>
          <button
            onClick={() => router.push('/matches')}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back
            </button>
            {matchInfo && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                  {matchInfo.partner.photo ? (
                    <img
                      src={matchInfo.partner.photo}
                      alt={matchInfo.partner.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      👤
                    </div>
                  )}
                </div>
                <span className="font-semibold">{matchInfo.partner.username}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/matches')}
              className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              Matches
            </button>
            <button
              onClick={() => router.push('/swipe')}
              className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              Swipe
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 overflow-hidden flex flex-col">
        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading messages...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={loadMessages}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : conversation.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-2">Say hello to start the conversation!</p>
              </div>
            ) : (
              conversation.map((msg) => {
                const isOwnMessage = msg.sender_id === currentUserId.current;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-primary-200' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                        {isOwnMessage && msg.is_read && ' • Read'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSend} className="border-t p-4">
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="2"
                maxLength="5000"
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{newMessage.length}/5000 characters</span>
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}