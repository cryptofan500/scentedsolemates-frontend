// Cache buster v4 - Legal compliance + PASSWORD VALIDATION UI
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/api';

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    age: '',
    city: '',
    gender: '',
    interested_in: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  
  // Legal compliance checkboxes
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [confirmed18, setConfirmed18] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.push('/swipe');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);
    
    if (!isLogin) {
      if (!formData.gender) {
        setError('Please select your gender');
        return;
      }
      if (formData.interested_in.length === 0) {
        setError('Please select at least one preference');
        return;
      }
      // Legal validation
      if (!confirmed18) {
        setError('You must confirm you are 18 years or older');
        return;
      }
      if (!agreedTerms) {
        setError('You must agree to the Terms of Service');
        return;
      }
    }
    
    setLoading(true);

    // DEBUG: Log exactly what we're sending to the API
    console.log('=== REGISTRATION DEBUG START ===');
    console.log('Full formData object:', formData);
    console.log('interested_in array:', formData.interested_in);
    console.log('interested_in type:', typeof formData.interested_in);
    console.log('interested_in length:', formData.interested_in.length);
    console.log('interested_in JSON:', JSON.stringify(formData.interested_in));
    console.log('=== REGISTRATION DEBUG END ===');

    try {
      const response = isLogin
        ? await auth.login({ email: formData.email, password: formData.password })
        : await auth.register(formData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/swipe');
    } catch (err) {
      const errorMessage = err.toString();
      setError(errorMessage);
      
      if (errorMessage.includes('verify your email')) {
        setShowResendVerification(true);
      }
      
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const updatedData = { ...formData, [e.target.name]: e.target.value };
    console.log('handleChange called:', e.target.name, '=', e.target.value);
    console.log('Updated formData:', updatedData);
    setFormData(updatedData);
  };

  const handleCheckboxChange = (value) => {
    const newInterested = formData.interested_in.includes(value)
      ? formData.interested_in.filter(item => item !== value)
      : [...formData.interested_in, value];
    
    console.log('handleCheckboxChange called with value:', value);
    console.log('Current interested_in:', formData.interested_in);
    console.log('New interested_in:', newInterested);
    
    setFormData({ ...formData, interested_in: newInterested });
  };

  // Password validation helpers
  const isPasswordValid = () => {
    if (!formData.password || formData.password.length < 10) return false;
    if (!/[A-Z]/.test(formData.password)) return false;
    if (!/[a-z]/.test(formData.password)) return false;
    if (!/[0-9]/.test(formData.password)) return false;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary-700">
          ScentedSoleMates
        </h1>
        <p className="text-gray-600 text-center mb-6">Find your perfect sole mate</p>

        <div className="flex mb-6 border-b">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2 transition-all ${
              isLogin 
                ? 'border-b-2 border-primary-500 font-semibold text-primary-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
              setAgreedTerms(false);
              setConfirmed18(false);
            }}
            className={`flex-1 py-2 transition-all ${
              !isLogin 
                ? 'border-b-2 border-primary-500 font-semibold text-primary-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm animate-slide-up">
            {error}
            
            {showResendVerification && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-xs">
                  Check your email inbox (including spam folder) for the verification link.
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  No email? Contact support or try registering again.
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />

          {!isLogin && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              maxLength={50}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={isLogin ? 6 : 10}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />

          {!isLogin && formData.password && (
            <div className="text-xs space-y-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-700 mb-2">Password Requirements:</p>
              <p className={formData.password.length >= 10 ? 'text-green-600 font-medium' : 'text-red-500'}>
                {formData.password.length >= 10 ? '✓' : '✗'} At least 10 characters
              </p>
              <p className={/[A-Z]/.test(formData.password) ? 'text-green-600 font-medium' : 'text-red-500'}>
                {/[A-Z]/.test(formData.password) ? '✓' : '✗'} One uppercase letter (A-Z)
              </p>
              <p className={/[a-z]/.test(formData.password) ? 'text-green-600 font-medium' : 'text-red-500'}>
                {/[a-z]/.test(formData.password) ? '✓' : '✗'} One lowercase letter (a-z)
              </p>
              <p className={/[0-9]/.test(formData.password) ? 'text-green-600 font-medium' : 'text-red-500'}>
                {/[0-9]/.test(formData.password) ? '✓' : '✗'} One number (0-9)
              </p>
              <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600 font-medium' : 'text-red-500'}>
                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '✗'} One special character (!@#$%^&*)
              </p>
            </div>
          )}

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="age"
                  placeholder="Age (18+)"
                  min="18"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  I am:
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                      className="mr-2 text-primary-600"
                    />
                    <span>Male</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                      className="mr-2 text-primary-600"
                    />
                    <span>Female</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="non-binary"
                      checked={formData.gender === 'non-binary'}
                      onChange={handleChange}
                      className="mr-2 text-primary-600"
                    />
                    <span>Non-binary</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Interested in:
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value="male"
                      checked={formData.interested_in.includes('male')}
                      onChange={() => handleCheckboxChange('male')}
                      className="mr-2 text-primary-600"
                    />
                    <span>Men</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value="female"
                      checked={formData.interested_in.includes('female')}
                      onChange={() => handleCheckboxChange('female')}
                      className="mr-2 text-primary-600"
                    />
                    <span>Women</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value="non-binary"
                      checked={formData.interested_in.includes('non-binary')}
                      onChange={() => handleCheckboxChange('non-binary')}
                      className="mr-2 text-primary-600"
                    />
                    <span>Non-binary</span>
                  </label>
                </div>
              </div>

              {/* LEGAL CHECKBOXES */}
              <div className="pt-2 border-t border-gray-200 space-y-3">
                {/* Age confirmation */}
                <div className="flex items-start">
                  <input 
                    type="checkbox" 
                    checked={confirmed18}
                    onChange={(e) => setConfirmed18(e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    id="age-confirm"
                  />
                  <label htmlFor="age-confirm" className="text-sm text-gray-700 cursor-pointer">
                    I confirm I am <strong>18 years of age or older</strong>
                  </label>
                </div>

                {/* Terms agreement */}
                <div className="flex items-start">
                  <input 
                    type="checkbox" 
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    id="terms-agree"
                  />
                  <label htmlFor="terms-agree" className="text-sm text-gray-700 cursor-pointer">
                    I agree to the{' '}
                    <a 
                      href="/terms" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms of Service
                    </a>
                    ,{' '}
                    <a 
                      href="/privacy" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </a>
                    , and{' '}
                    <a 
                      href="/guidelines" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Community Guidelines
                    </a>
                  </label>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && (!agreedTerms || !confirmed18 || !isPasswordValid()))}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              if (isLogin) {
                setAgreedTerms(false);
                setConfirmed18(false);
              }
            }}
            className="text-primary-600 font-semibold hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>

        {!isLogin && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              By registering, you confirm you are 18+ and agree to our community standards. 
              We reserve the right to suspend accounts that violate our guidelines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}