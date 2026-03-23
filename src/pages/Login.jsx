import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Dumbbell, LogIn, Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError('Please verify your email before logging in.');
        await auth.signOut();
        return;
      }

      navigate('/');
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Try again later.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
            <Dumbbell className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Boss Gym</h1>
          <p className="text-muted text-sm mt-1">Attendance Management System</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-5 bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-muted text-sm mb-1.5 font-medium">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@gym.com"
                className="w-full bg-secondary border border-border text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-muted/50"
              />
            </div>

            <div>
              <label className="block text-muted text-sm mb-1.5 font-medium">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-secondary border border-border text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-muted/50"
              />
            </div>

            <button
              id="login-button"
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-muted text-xs">
              Don't have an account? <Link to="/register" className="text-primary hover:underline">Create Account</Link>
            </p>
          </div>
        </div>

        <p className="text-muted text-center text-xs mt-6">
          © {new Date().getFullYear()} Boss Gym. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
