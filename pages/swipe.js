import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { profiles, auth } from '../lib/api';

export default function Swipe() {
  const router = useRouter();
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [canSwipe, setCanSwipe] = useState(false);
  const [photoWarning, setPhotoWarning] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/');
      return;
    }
    checkPermissionAndFetchProfiles();
  }, [router]);

  const checkPermissionAndFetchProfiles = async () => {
    setLoading(true);
    try {
      // First check if user has photos
      const canSwipeResponse = await profiles.canSwipe();
      const { canSwipe: allowed, message } = canSwipeResponse.data;
      
      if (!allowed) {
        setPhotoWarning(message);
        setCanSwipe(false);
        setLoading(false);
        return;
      }
      
      setCanSwipe(true);
      setPhotoWarning('');
      
      // If user can swipe, fetch profiles
      await fetchProfiles();
    } catch (err) {
      console.error('Failed to check swipe permission:', err);
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await profiles.getQueue();
      setQueue(response.data);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
      // If error is about missing photo, show warning
      if (err.includes && err.includes('upload a photo')) {
        setPhotoWarning('You must upload at least one photo to see other profiles');
        setCanSwipe(false);
      }
    }
    setLoading(false);
  };

  const handleSwipe = async (direction) => {
    if (swiping || !queue[currentIndex]) return;
    
    setSwiping(true);
    const targetProfile = queue[currentIndex];

    try {
      const response = await profiles.swipe(targetProfile.id, direction);
      
      if (response.data.match) {
        setShowMatch(true);
        setTimeout(() => setShowMatch(false), 3000);
      }
      
      // Move to next profile or reload
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        await fetchProfiles();
      }
    } catch (err) {
      console.error('Swipe failed:', err);
      // Show error to user
      if (err.includes && err.includes('Cannot swipe on yourself')) {
        alert('You cannot swipe on yourself!');
      }
    }
    
    setSwiping(false);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      auth.logout();
    }
  };

  const currentProfile = queue[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      {/* Match Notification */}
      {showMatch && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl">
            <p className="font-bold text-lg">🎉 It's a Match!</p>
            <p className="text-sm">Check your matches to connect!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-lg mx-auto mb-4">
        <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">ScentedSoleMates</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              Profile
            </button>
            <button
              onClick={() => router.push('/matches')}
              className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              Matches
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="bg-white rounded-lg shadow-xl p-12 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : !canSwipe ? (
          // Photo Warning State
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Photo Required</h2>
            <p className="text-gray-500 mb-6">
              {photoWarning || 'You must upload at least one photo to see other profiles'}
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Upload Photo Now
            </button>
          </div>
        ) : currentProfile ? (
          // Swipe Card
          <div className="bg-white rounded-lg shadow-xl overflow-hidden animate-fade-in">
            {/* Photo Section */}
            <div className="h-96 bg-gray-100 relative">
              {currentProfile.photos && currentProfile.photos.length > 0 ? (
                <img
                  src={currentProfile.photos[0].url}
                  alt={currentProfile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-6xl mb-2">👤</p>
                    <p>No photo available</p>
                  </div>
                </div>
              )}
              
              {/* Photo count indicator */}
              {currentProfile.photos && currentProfile.photos.length > 1 && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  1 / {currentProfile.photos.length}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">
                {currentProfile.username}, {currentProfile.age}
              </h2>
              <p className="text-gray-600 mb-4">📍 {currentProfile.city}</p>
              {currentProfile.bio && (
                <p className="text-gray-700 text-sm">{currentProfile.bio}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex border-t">
              <button
                onClick={() => handleSwipe('pass')}
                disabled={swiping}
                className="flex-1 py-4 text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Pass ✗
              </button>
              <button
                onClick={() => handleSwipe('like')}
                disabled={swiping}
                className="flex-1 py-4 text-green-600 font-semibold hover:bg-green-50 transition-colors disabled:opacity-50 border-l"
              >
                Like ❤️
              </button>
            </div>
          </div>
        ) : (
          // No profiles available
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <p className="text-gray-500 mb-4">No profiles available in your area</p>
            <p className="text-sm text-gray-400 mb-6">
              {queue.length === 0 
                ? 'Be the first in your city or check back when others join!'
                : 'You\'ve seen everyone! Check back later for new profiles.'}
            </p>
            <button
              onClick={checkPermissionAndFetchProfiles}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}