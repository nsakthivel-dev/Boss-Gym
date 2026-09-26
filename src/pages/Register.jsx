import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Dumbbell, UserPlus, Loader2, Mail, Lock, CheckCircle2, Award, ArrowRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Register = () => {
  const navigate = useNavigate();
  const { settings: gymSettings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 6) {
      return setError('Password should be at least 6 characters.');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      const adminEmails = [
        'sakthicud07@gmail.com',
        'manisuni94@gmail.com',
        import.meta.env.VITE_ADMIN_EMAIL?.replace(/^["'](.+)["']$/, '$1').toLowerCase().trim()
      ].filter(Boolean).map(e => e.toLowerCase().trim());

      const isSystemAdmin = adminEmails.includes(email.toLowerCase().trim());
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: isSystemAdmin ? 'admin' : 'user',
        createdAt: Timestamp.now(),
      });

      await signOut(auth);
      setVerificationSent(true);
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email is already registered. Please login.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Use at least 6 characters.');
          break;
        default:
          setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white border border-[#e8e4d8] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Verify Your Email</h2>
            <p className="text-neutral-600 text-xs sm:text-sm mt-2 leading-relaxed">
              We have dispatched an activation link to <span className="text-neutral-900 font-bold">{email}</span>. 
              Please click the link in your inbox to complete verification.
            </p>
          </div>
          <div className="pt-2">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center w-full min-h-[48px] bg-gold-600 hover:bg-gold-500 text-neutral-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-gold-600/20 transition-all cursor-pointer"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white border border-[#e8e4d8] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Side: Athletic Visual Showcase (Col 1-5) */}
        <div className="lg:col-span-5 bg-[#151515] relative p-8 sm:p-10 text-white flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/photos/anastase-maragos-7kEpUPB8vNk-unsplash.jpg" 
              alt="Athlete Chalk Preparation" 
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/60 to-[#151515]/30" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <Award size={12} className="text-gold-400" />
              <span>Athlete Enrollment</span>
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
                  Join The Brotherhood
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 sm:pt-20">
            <div className="w-10 h-1 bg-gold-400 mb-3" />
            <p className="text-sm sm:text-base font-black uppercase tracking-tight text-neutral-100 leading-snug">
              "THE PAIN YOU FEEL TODAY WILL BE THE STRENGTH YOU FEEL TOMORROW."
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-2">
              Muthaliyarpet • Pondicherry
            </p>
          </div>
        </div>

        {/* Right Side: Registration Form (Col 6-12) */}
        <div className="lg:col-span-7 p-8 sm:p-12 md:p-14 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <span className="text-[11px] font-black uppercase tracking-widest text-gold-700 block mb-1">
                New Athlete
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 uppercase tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-neutral-500 font-medium mt-1">
                Sign up to begin your personalized training journey at Boss Gym.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-neutral-800 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="name@email.com"
                    className="w-full bg-[#faf9f6] border border-[#e8e4d8] text-neutral-900 rounded-xl pl-10 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-gold-500 focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-800 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full bg-[#faf9f6] border border-[#e8e4d8] text-neutral-900 rounded-xl pl-10 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-gold-500 focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-800 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter password"
                    className="w-full bg-[#faf9f6] border border-[#e8e4d8] text-neutral-900 rounded-xl pl-10 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-gold-500 focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] bg-gold-600 hover:bg-gold-500 active:scale-95 text-neutral-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md shadow-gold-600/20 transition-all disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#f0ede6] flex flex-col gap-4 text-center">
              <p className="text-neutral-500 text-xs font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-gold-700 font-bold hover:underline ml-1">
                  Sign In Instead
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

export default Register;
