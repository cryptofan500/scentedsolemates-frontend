import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { profiles, auth } from '../lib/api';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState('');
  const [contactMethod, setContactMethod] = useState('email');
  const [contactInfo, setContactInfo] = useState('');
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState('tease_toes');
  const [selectedPhotoType, setSelectedPhotoType] = useState('face');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/');
      return;
    }
    fetchMyProfile();
  }, [router]);

  const fetchMyProfile = async () => {
    try {
      const response = await profiles.getMyProfile();
      const data = response.data;
      
      setUser(data);
      setBio(data.bio || '');
      setContactMethod(data.contact_method || 'email');
      setContactInfo(data.contact_info || '');
      setGender(data.gender || '');
      setInterestedIn(data.interested_in || []);
      setPhotos(data.photos?.map(p => ({ url: p.url, type: p.photo_type })) || []);
      setCurrentMode(data.mode || 'tease_toes');
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch profile", err);
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setBio(parsed.bio || '');
        setContactMethod(parsed.contact_method || 'email');
        setContactInfo(parsed.contact_info || '');
        setGender(parsed.gender || '');
        setInterestedIn(parsed.interested_in || []);
        setCurrentMode(parsed.mode || 'tease_toes');
      }
      setLoading(false);
    }
  };

  // FIX: Capture file IMMEDIATELY before React recycles the event
  const handlePhotoUpload = async (e) => {
    // CRITICAL: Store file reference in a const BEFORE any async operations
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      console.log('[UPLOAD] No file selected');
      return;
    }
    
    console.log('[UPLOAD] File captured:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type
    });
    
    if (photos.length >= 3) {
      alert('Maximum 3 photos allowed');
      e.target.value = ''; // Reset input
      return;
    }

    setUploading(true);
    
    try {
      // Build FormData directly here with the captured file reference
      const formData = new FormData();
      formData.append('photo', selectedFile, selectedFile.name);
      formData.append('photo_type', selectedPhotoType || 'face');
      
      console.log('[UPLOAD] Uploading to backend...');
      
      // Use fetch() instead of axios for better FormData handling
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // DO NOT set Content-Type - browser sets it automatically with boundary
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }
      
      console.log('[UPLOAD] Success:', data.url);
      
      // Add photo to local state
      setPhotos([...photos, { url: data.url, type: data.type || selectedPhotoType }]);
      alert('Photo uploaded successfully!');
      
      // Reset file input and photo type selector
      e.target.value = '';
      setSelectedPhotoType('face');
      
    } catch (err) {
      console.error('[UPLOAD] Error:', err);
      alert('Failed to upload photo: ' + err.message);
    }
    
    setUploading(false);
  };

  const handleInterestedInChange = (value) => {
    const newInterested = interestedIn.includes(value)
      ? interestedIn.filter(item => item !== value)
      : [...interestedIn, value];
    setInterestedIn(newInterested);
  };

  const handleSave = async () => {
    if (interestedIn.length === 0) {
      alert('Please select at least one preference');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        bio: bio.trim(),
        contact_method: contactMethod,
        contact_info: contactMethod === 'phone' ? contactInfo.trim() : '',
        gender: gender,
        interested_in: interestedIn
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

        {/* Photo Warning Alert */}
        {photos.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Important:</span> You must upload at least one photo to see other profiles and start swiping!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-2 text-gray-600">
            <p><span className="font-medium">Username:</span> {user.username}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Age:</span> {user.age}</p>
            <p><span className="font-medium">City:</span> {user.city}</p>
            {!user.email_verified && (
              <p className="text-yellow-600">
                <span className="font-medium">Status:</span> Pending manual approval
              </p>
            )}
          </div>
        </div>

        {/* Gender & Preferences */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">Gender & Preferences</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am:
            </label>
            <div className="flex gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={(e) => setGender(e.target.value)}
                  className="mr-2 text-primary-600"
                />
                <span>Male</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={(e) => setGender(e.target.value)}
                  className="mr-2 text-primary-600"
                />
                <span>Female</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="non-binary"
                  checked={gender === 'non-binary'}
                  onChange={(e) => setGender(e.target.value)}
                  className="mr-2 text-primary-600"
                />
                <span>Non-binary</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interested in:
            </label>
            <div className="flex gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value="male"
                  checked={interestedIn.includes('male')}
                  onChange={() => handleInterestedInChange('male')}
                  className="mr-2 text-primary-600"
                />
                <span>Men</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value="female"
                  checked={interestedIn.includes('female')}
                  onChange={() => handleInterestedInChange('female')}
                  className="mr-2 text-primary-600"
                />
                <span>Women</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value="non-binary"
                  checked={interestedIn.includes('non-binary')}
                  onChange={() => handleInterestedInChange('non-binary')}
                  className="mr-2 text-primary-600"
                />
                <span>Non-binary</span>
              </label>
            </div>
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
            With in-app messaging, your contact info is optional
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
              <span>Keep contact private (use in-app chat only)</span>
            </label>
            
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="phone"
                checked={contactMethod === 'phone'}
                onChange={(e) => setContactMethod(e.target.value)}
                className="mr-3 text-primary-600"
              />
              <span>Share phone number (optional)</span>
            </label>
            
            {contactMethod === 'phone' && (
              <input
                type="tel"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Enter phone number (optional)"
                className="w-full mt-2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>
        </div>

        {/* Photos with Type Selection - FIXED UPLOAD */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">
            My Photos ({photos.length}/3)
            {photos.length === 0 && (
              <span className="text-red-500 text-sm ml-2">* Required for swiping</span>
            )}
          </h2>
          
          {/* Photo Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo Type to Upload:
            </label>
            <select
              value={selectedPhotoType}
              onChange={(e) => setSelectedPhotoType(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={uploading}
            >
              <option value="face">Face</option>
              <option value="feet">Feet</option>
              <option value="socks">Socks</option>
              <option value="shoes">Shoes</option>
              <option value="pedicure">Pedicure</option>
            </select>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative">
                <img 
                  src={photo.url} 
                  alt={`Photo ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
                {photo.type && (
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {photo.type}
                  </div>
                )}
              </div>
            ))}
            
            {photos.length < 3 && (
              <label className={`aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                photos.length === 0 
                  ? 'bg-yellow-50 border-2 border-yellow-300 hover:bg-yellow-100' 
                  : 'bg-gray-100 hover:bg-gray-200'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="text-center">
                  <p className="text-4xl mb-2">📷</p>
                  <p className="text-sm text-gray-600">
                    {uploading ? 'Uploading...' : (photos.length === 0 ? 'Add Photo (Required)' : 'Add Photo')}
                  </p>
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