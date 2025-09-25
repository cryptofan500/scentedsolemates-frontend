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
    city: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    if (localStorage.getItem('token')) {
      router.push('/swipe');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = isLogin
        ? await auth.login({ email: formData.email, password: formData.password })
        : await auth.register(formData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/swipe');
    } catch (err) {
      setError(err.toString());
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary-700">
          ScentedSoleMates
        </h1>
        <p className="text-gray-600 text-center mb-6">Find your perfect sole mate 👣</p>

        <div className="flex mb-6 border-b">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 transition-all ${
              isLogin 
                ? 'border-b-2 border-primary-500 font-semibold text-primary-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
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
              required={!isLogin}
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
            minLength={6}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />

          {!isLogin && (
            <>
              <input
                type="number"
                name="age"
                placeholder="Age (18+)"
                min="18"
                max="120"
                value={formData.age}
                onChange={handleChange}
                required={!isLogin}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
              <input
                type="text"
                name="city"
                placeholder="City (e.g., Toronto, New York)"
                value={formData.city}
                onChange={handleChange}
                required={!isLogin}
                maxLength={100}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-600 font-semibold hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}