import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Dumbbell, UserPlus, Loader2, Mail } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
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
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Send Verification Email
      await sendEmailVerification(user);

      // 3. Create User Document in Firestore
      const isSystemAdmin = email === 'nsakthiveldev@gmail.com';
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: isSystemAdmin ? 'admin' : 'user',
        createdAt: Timestamp.now(),
      });

      // 4. Sign out immediately so they have to verify and then log in
      await signOut(auth);
      
      setVerificationSent(true);
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email is already in use.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak.');
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white">Verify your email</h2>
          <p className="text-muted text-sm">
            We've sent a verification link to <span className="text-white font-semibold">{email}</span>. 
            Please check your inbox and click the link to activate your account.
          </p>
          <div className="pt-4">
            <Link 
              to="/login" 
              className="inline-block w-full bg-primary text-black font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
            <Dumbbell className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Boss Gym</h1>
          <p className="text-muted text-sm mt-1">Create your management account</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>

          {error && (
            <div className="mb-5 bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-muted text-sm mb-1.5 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full bg-secondary border border-border text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-muted/50"
              />
            </div>

            <div>
              <label className="block text-muted text-sm mb-1.5 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-secondary border border-border text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-muted/50"
              />
            </div>

            <div>
              <label className="block text-muted text-sm mb-1.5 font-medium">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-secondary border border-border text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-muted/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-muted text-xs">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
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

export default Register;
