import { useState, useEffect } from 'react';
import { challenges } from '../lib/api';

export default function DailyChallenge({ onComplete }) {
  const [todayChallenge, setTodayChallenge] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallengeData();
  }, []);

  const loadChallengeData = async () => {
    setLoading(true);
    try {
      const [challengeResponse, statsResponse] = await Promise.all([
        challenges.getToday(),
        challenges.getStats()
      ]);
      
      setTodayChallenge(challengeResponse.data);
      setCompleted(challengeResponse.data.completed);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to load challenge data:', err);
    }
    setLoading(false);
  };

  const handleCompleteChallenge = async () => {
    if (!todayChallenge || completed) return;
    
    try {
      const response = await challenges.complete(todayChallenge.id);
      if (response.data.success) {
        setCompleted(true);
        alert(`Challenge completed! ${response.data.reward}`);
        if (onComplete) {
          onComplete(todayChallenge.id);
        }
        // Reload stats
        loadChallengeData();
      }
    } catch (err) {
      alert('Challenge not verified. Make sure you completed the requirement!');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!todayChallenge) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Challenge Header */}
      <div className={`p-4 ${completed ? 'bg-green-50' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className={`font-bold text-lg ${completed ? 'text-green-700' : 'text-white'}`}>
              {completed ? '✅ Daily Challenge Complete!' : '🎯 Daily Challenge'}
            </h3>
            <p className={`text-sm ${completed ? 'text-green-600' : 'text-white/90'}`}>
              {todayChallenge.title}
            </p>
          </div>
          {!completed && (
            <div className="text-2xl animate-pulse">
              💫
            </div>
          )}
        </div>
      </div>

      {/* Challenge Details */}
      <div className="p-4">
        <p className="text-gray-700 mb-3">{todayChallenge.description}</p>
        
        {!completed && (
          <>
            <div className="bg-purple-50 rounded p-3 mb-3">
              <p className="text-sm text-purple-700 font-medium">
                Reward: {todayChallenge.reward}
              </p>
            </div>
            
            <button
              onClick={handleCompleteChallenge}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Mark as Complete
            </button>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Complete the task first, then click to claim reward
            </p>
          </>
        )}

        {/* Stats Section */}
        {stats && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.totalCompleted}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-600">{stats.weeklyCompleted}</p>
              <p className="text-xs text-gray-500">This Week</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats.streakBonus ? '🔥' : '—'}
              </p>
              <p className="text-xs text-gray-500">Streak</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}