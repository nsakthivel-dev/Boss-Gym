import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Dumbbell, LogIn, Loader2, Mail, Lock, ArrowRight, ShieldCheck, Flame, Award, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const Login = () => {
  const { currentUser, userRole } = useAuth();
  const { settings: gymSettings } = useSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, userRole, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const adminEmails = [
        'sakthicud07@gmail.com',
        'manisuni94@gmail.com',
        import.meta.env.VITE_ADMIN_EMAIL?.replace(/^["'](.+)["']$/, '$1').toLowerCase().trim()
      ].filter(Boolean).map(e => e.toLowerCase().trim());

      const isSystemAdmin = adminEmails.includes(user.email?.toLowerCase().trim());
      if (!user.emailVerified && !isSystemAdmin) {
        setError('Please verify your email before logging in.');
        await auth.signOut();
        return;
      }

      // Direct immediate navigation upon successful sign-in
      if (isSystemAdmin) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error("Login authentication error:", err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No user account found with this email address.');
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid password or credentials. Please verify your password or use Forgot Password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please wait a minute or reset your password.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support.');
          break;
        default:
          setError(err.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMsg('');
    const targetEmail = email.trim() || import.meta.env.VITE_ADMIN_EMAIL?.replace(/^["'](.+)["']$/, '$1').toLowerCase().trim();
    if (!targetEmail) {
      setError('Please enter your email address to receive the password reset link.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setSuccessMsg(`Password reset link sent to ${targetEmail}. Please check your inbox and spam folder.`);
      if (!email) setEmail(targetEmail);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send reset link. Please try again in a few moments.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white border border-[#e8e4d8] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Side: Dark Athletic Visual Showcase (Col 1-5, Hidden on small screens or compact header) */}
        <div className="lg:col-span-5 bg-[#151515] relative p-8 sm:p-10 text-white flex flex-col justify-between overflow-hidden">
          {/* Real Gym Photo Background */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/photos/victor-freitas-WvDYdXDzkhs-unsplash.jpg" 
              alt="Boss Gym Athlete Training" 
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/60 to-[#151515]/30" />
          </div>

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <Award size={12} className="text-gold-400" />
              <span>Portal Access</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gold-500 text-neutral-950 flex items-center justify-center font-black shadow-lg">
                <Dumbbell size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-none">
                  {gymSettings.gymName || 'Boss Gym'}
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-gold-400 mt-1">
                  Management & Athlete Hub
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Motivational Quote */}
          <div className="relative z-10 pt-12 sm:pt-20">
            <div className="w-10 h-1 bg-gold-400 mb-3" />
            <p className="text-sm sm:text-base font-black uppercase tracking-tight text-neutral-100 leading-snug">
              "DISCIPLINE IS CHOOSING BETWEEN WHAT YOU WANT NOW AND WHAT YOU WANT MOST."
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-2">
              Muthaliyarpet • Pondicherry
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Form (Col 6-12) */}
        <div className="lg:col-span-7 p-8 sm:p-12 md:p-14 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <span className="text-[11px] font-black uppercase tracking-widest text-gold-700 block mb-1">
                Secure Entry
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tight">
                Sign In To Account
              </h2>
              <p className="text-xs text-neutral-500 font-medium mt-1">
                Enter your registered credentials to access your administrative dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-neutral-800 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="admin@bossgym.com"
                    className="w-full bg-[#faf9f6] border border-[#e8e4d8] text-neutral-900 rounded-xl pl-10 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-gold-500 focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-neutral-800 text-xs font-bold uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[11px] font-bold text-gold-700 hover:text-gold-600 uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {resetLoading ? 'Sending link...' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#faf9f6] border border-[#e8e4d8] text-neutral-900 rounded-xl pl-10 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-gold-500 focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <button
                id="login-button"
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] bg-gold-600 hover:bg-gold-500 active:scale-95 text-neutral-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md shadow-gold-600/20 transition-all disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{loading ? 'Verifying Credentials...' : 'Sign In Now'}</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#f0ede6] flex flex-col gap-4 text-center">
              <p className="text-neutral-500 text-xs font-medium">
                Don't have an account yet?{' '}
                <Link to="/register" className="text-gold-700 font-bold hover:underline ml-1">
                  Create Member Account
                </Link>
              </p>

              <button 
                onClick={() => navigate('/')}
                className="text-xs font-bold text-neutral-600 hover:text-gold-700 uppercase tracking-wider transition-colors py-1 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Return To Website</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
