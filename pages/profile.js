import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { profiles, auth } from '../lib/api';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState('');
  const [contactMethod, setContactMethod] = useState('email');
  const [contactInfo, setContactInfo] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/');
      return;
    }
    fetchMyProfile();
  }, [router]);

  // CRITICAL FIX: Fetch profile from API instead of localStorage
  const fetchMyProfile = async () => {
    try {
      const response = await profiles.getMyProfile();
      const data = response.data;
      
      setUser(data);
      setBio(data.bio || '');
      setContactMethod(data.contact_method || 'email');
      setContactInfo(data.contact_info || '');
      
      // Initialize photos correctly by mapping the URLs
      setPhotos(data.photos?.map(p => p.url) || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch profile", err);
      // Fallback to localStorage if API fails
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setBio(parsed.bio || '');
        setContactMethod(parsed.contact_method || 'email');
        setContactInfo(parsed.contact_info || '');
      }
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (photos.length >= 3) {
      alert('Maximum 3 photos allowed');
      return;
    }

    setUploading(true);
    try {
      const response = await profiles.uploadPhoto(file);
      setPhotos([...photos, response.data.url]);
      alert('Photo uploaded successfully!');
    } catch (err) {
      alert('Failed to upload photo: ' + err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        bio: bio.trim(),
        contact_method: contactMethod,
        contact_info: contactMethod === 'phone' ? contactInfo.trim() : ''
      };
      
      const response = await profiles.updateProfile(updates);
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile: ' + err);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      auth.logout();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">My Profile</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/swipe')}
              className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            >
              Swipe
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

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-2 text-gray-600">
            <p><span className="font-medium">Username:</span> {user.username}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Age:</span> {user.age}</p>
            <p><span className="font-medium">City:</span> {user.city}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">About Me</h2>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about yourself and what you're looking for..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows="4"
            maxLength="500"
          />
          <p className="text-sm text-gray-500 mt-2">{bio.length}/500 characters</p>
        </div>

        {/* Contact Preferences */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">Contact Preferences</h2>
          <p className="text-sm text-gray-600 mb-4">
            When you match, this is how they'll contact you:
          </p>
          
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="email"
                checked={contactMethod === 'email'}
                onChange={(e) => setContactMethod(e.target.value)}
                className="mr-3 text-primary-600"
              />
              <span>Share my email ({user.email})</span>
            </label>
            
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="phone"
                checked={contactMethod === 'phone'}
                onChange={(e) => setContactMethod(e.target.value)}
                className="mr-3 text-primary-600"
              />
              <span>Share my phone number</span>
            </label>
            
            {contactMethod === 'phone' && (
              <input
                type="tel"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Enter phone number (e.g., +1 555-0123)"
                className="w-full mt-2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">My Photos ({photos.length}/3)</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            {photos.map((url, idx) => (
              <div key={idx} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img 
                  src={url} 
                  alt={`Photo ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            
            {photos.length < 3 && (
              <label className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <div className="text-center">
                  <p className="text-4xl mb-2">📷</p>
                  <p className="text-sm text-gray-600">Add Photo</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
          
          {uploading && (
            <p className="text-center text-gray-500">Uploading photo...</p>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}