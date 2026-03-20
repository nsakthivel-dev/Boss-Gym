import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Dumbbell, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

const ADMIN_EMAIL = 'admin@gym.com';
const ADMIN_PASSWORD = 'Admin@123';
const STAFF_EMAIL = 'staff@gym.com';
const STAFF_PASSWORD = 'Staff@123';

const Setup = () => {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [log, setLog] = useState([]);
  const [error, setError] = useState('');

  const addLog = (msg, type = 'info') => {
    setLog(prev => [...prev, { msg, type }]);
  };

  const createUser = async (email, password, role, name) => {
    try {
      // Try to create user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        role,
        createdAt: Timestamp.fromDate(new Date()),
      });
      addLog(`✅ Created ${role} account: ${email}`, 'success');
      return true;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        addLog(`⚠️ ${email} already exists — skipped.`, 'warn');
        return true;
      }
      addLog(`❌ Failed to create ${email}: ${err.message}`, 'error');
      return false;
    }
  };

  const runSetup = async () => {
    setStatus('loading');
    setLog([]);
    setError('');

    try {
      addLog('Starting Boss Gym setup…');

      // Create admin account
      addLog('Creating admin account…');
      await createUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'admin', 'Admin');

      // Sign out temporarily before creating staff (Firebase auto-signs in on createUser)
      await signOut(auth);

      addLog('Creating staff account…');
      await createUser(STAFF_EMAIL, STAFF_PASSWORD, 'staff', 'Staff');

      // Sign out after creating staff too
      await signOut(auth);

      addLog('✅ Setup complete! You can now log in.', 'success');
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
            <Dumbbell className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">Boss Gym Setup</h1>
          <p className="text-muted text-sm mt-1">One-time Firebase configuration</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* Account Preview */}
          <div className="space-y-3">
            <p className="text-muted text-sm font-medium uppercase tracking-wide">Accounts to be created</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Admin Account</p>
                <p className="text-white text-sm font-semibold">{ADMIN_EMAIL}</p>
                <p className="text-primary text-xs font-mono mt-1">Password: {ADMIN_PASSWORD}</p>
              </div>
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Staff Account</p>
                <p className="text-white text-sm font-semibold">{STAFF_EMAIL}</p>
                <p className="text-primary text-xs font-mono mt-1">Password: {STAFF_PASSWORD}</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-warning text-xs">
              This page is for one-time setup only. After setup is complete, you should remove the <code className="bg-black/30 px-1 rounded">/setup</code> route from <code className="bg-black/30 px-1 rounded">App.jsx</code>.
            </p>
          </div>

          {/* Log output */}
          {log.length > 0 && (
            <div className="bg-background rounded-xl p-4 space-y-1.5 font-mono text-xs max-h-40 overflow-y-auto">
              {log.map((entry, i) => (
                <p key={i} className={
                  entry.type === 'success' ? 'text-success' :
                  entry.type === 'error' ? 'text-error' :
                  entry.type === 'warn' ? 'text-warning' : 'text-muted'
                }>{entry.msg}</p>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* Done state */}
          {status === 'done' && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Setup complete!</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted mb-0.5">Admin Login</p>
                  <p className="text-white">{ADMIN_EMAIL}</p>
                  <p className="text-primary font-mono">{ADMIN_PASSWORD}</p>
                </div>
                <div>
                  <p className="text-muted mb-0.5">Staff Login</p>
                  <p className="text-white">{STAFF_EMAIL}</p>
                  <p className="text-primary font-mono">{STAFF_PASSWORD}</p>
                </div>
              </div>
              <a href="/login"
                className="block w-full text-center bg-primary text-black font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm">
                Go to Login →
              </a>
            </div>
          )}

          {/* Run Button */}
          {status !== 'done' && (
            <button
              id="run-setup-btn"
              onClick={runSetup}
              disabled={status === 'loading'}
              className="w-full bg-primary text-black font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running Setup…</>
              ) : (
                'Run Setup Now'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;
