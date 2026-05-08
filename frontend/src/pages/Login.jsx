import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaShieldAlt, FaGithub, FaGoogle, FaEye } from "react-icons/fa";
import { IoMdEyeOff } from "react-icons/io";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) await register(username, email, password);
      else await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/20 rounded-2xl mb-4">
            <FaShieldAlt size={28} className="text-accent-light" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nexis</h1>
          <p className="text-gray-400 text-sm mt-1">AI Moderated Community Platform</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">{isSignup ? 'Create an account' : 'Sign in to your account'}</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <IoMdEyeOff size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                isSignup ? 'max-h-40 opacity-100 mb-4 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}`}
            >
              <label className="text-sm text-gray-400 block mb-1.5">Username </label>

              <input type="text" value={username}  placeholder="johndoe" required={isSignup}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full cursor-pointer">
              {loading ? isSignup ? 'Creating account...' : 'Signing in...' : isSignup ? 'Create Account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div>
            <div className="relative flex justify-center text-xs text-gray-500 bg-surface-secondary px-2">or continue with</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={`${BACKEND_URL}/auth/google`} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-surface-tertiary hover:text-white transition-all">
              <FaGoogle size={16} /> Google
            </a>
            <a href={`${BACKEND_URL}/auth/github`} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-surface-tertiary hover:text-white transition-all">
              <FaGithub size={16} /> GitHub
            </a>
          </div>

          <div className="mt-4 p-3 bg-surface rounded-lg border border-gray-700/50">
            <p className="text-xs text-gray-500 font-medium mb-1">Demo credentials:</p>
            <p className="text-xs text-gray-400 font-mono">ADMIN : admin@moderator.ai / admin123</p>
            <p className="text-xs text-gray-400 font-mono">MODERATOR : mod@moderator.ai / mod123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
