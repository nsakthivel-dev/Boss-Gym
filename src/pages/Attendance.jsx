import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, query, where, getDocs, doc, updateDoc, orderBy
} from 'firebase/firestore';
import { CalendarCheck, Loader2, Edit2, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const todayStr = () => new Date().toISOString().split('T')[0];

const formatTime = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate?.() ?? new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const statusBadge = (s) => {
  const map = {
    open: 'bg-info/10 text-info',
    closed: 'bg-success/10 text-success',
    'no-exit': 'bg-error/10 text-error',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${map[s] || 'bg-muted/10 text-muted'}`}>
      {s === 'no-exit' ? 'No Exit' : s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <button onClick={onClose} className="text-muted hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const EditSessionModal = ({ session, currentUser, onClose, onSaved }) => {
  const entryDate = session.sessionDate;
  const toTimeStr = (ts) => {
    if (!ts) return '';
    const d = ts.toDate?.() ?? new Date(ts);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  const [entryTime, setEntryTime] = useState(toTimeStr(session.entryTime));
  const [exitTime, setExitTime] = useState(toTimeStr(session.exitTime));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!entryTime) { setError('Entry time is required.'); return; }
    setLoading(true);
    try {
      const [eh, em] = entryTime.split(':').map(Number);
      const entryDate_ = new Date(`${entryDate}T${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}:00`);
      let exitDate_ = null;
      let duration = null;
      if (exitTime) {
        const [xh, xm] = exitTime.split(':').map(Number);
        exitDate_ = new Date(`${entryDate}T${String(xh).padStart(2,'0')}:${String(xm).padStart(2,'0')}:00`);
        duration = Math.max(1, Math.floor((exitDate_ - entryDate_) / 60000));
      }
      await updateDoc(doc(db, 'sessions', session.id), {
        entryTime: entryDate_,
        exitTime: exitDate_,
        durationMinutes: duration,
        edited: true,
        editedBy: currentUser?.uid ?? 'unknown',
        status: exitDate_ ? 'closed' : 'open',
      });
      onSaved();
      onClose();
    } catch (err) {
      setError('Failed to save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-secondary border border-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50";

  return (
    <Modal title={`Edit Session — ${session.memberName}`} onClose={onClose}>
      {error && <div className="mb-4 bg-error/10 border border-error/30 text-error text-xs rounded-lg px-3 py-2">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="text-muted text-sm mb-1 block">Entry Time</label>
          <input type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-muted text-sm mb-1 block">Exit Time (optional)</label>
          <input type="time" value={exitTime} onChange={e => setExitTime(e.target.value)} className={inputClass} />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm text-muted hover:text-white border border-border rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="px-5 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

const SessionTable = ({ sessions, userRole, currentUser, onEdit }) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
            {['Member', 'Entry', 'Exit', 'Duration', 'Status', ...(userRole === 'admin' ? [''] : [])].map(h => (
              <th key={h} className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-primary/20 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {sessions.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-primary/20 py-20 font-bold tracking-widest text-xs uppercase">No sessions found.</td></tr>
            ) : sessions.map(s => (
              <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6 text-primary font-bold text-sm tracking-tight">
                  {s.memberName}
                  {s.edited && <span className="ml-1.5 text-primary/40 text-xs">✏️</span>}
                </td>
                <td className="px-8 py-6 text-primary/40 font-mono text-sm group-hover:text-primary transition-colors">{formatTime(s.entryTime)}</td>
                <td className="px-8 py-6 text-primary/40 font-mono text-sm group-hover:text-primary transition-colors">{formatTime(s.exitTime)}</td>
                <td className="px-8 py-6 text-primary/40 font-mono text-sm group-hover:text-primary transition-colors">{s.durationMinutes ? `${s.durationMinutes}m` : '—'}</td>
                <td className="px-8 py-6">{statusBadge(s.status)}</td>
                {userRole === 'admin' && (
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => onEdit(s)}
                      className="text-primary/40 hover:text-warning transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
      </table>
    </div>
    {/* Mobile */}
    <div className="md:hidden divide-y divide-border">
      {sessions.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">No sessions found.</p>
      ) : sessions.map(s => (
        <div key={s.id} className="p-3 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{s.memberName} {s.edited && '✏️'}</p>
            <p className="text-muted text-xs mt-1">{formatTime(s.entryTime)} → {formatTime(s.exitTime)} · {s.durationMinutes ? `${s.durationMinutes}m` : '—'}</p>
            <div className="mt-1">{statusBadge(s.status)}</div>
          </div>
          {userRole === 'admin' && (
            <button onClick={() => onEdit(s)} className="text-muted hover:text-primary ml-2 shrink-0">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

const Attendance = () => {
  const { userRole, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('today');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [editSession, setEditSession] = useState(null);

  const loadToday = async () => {
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'sessions'), where('sessionDate', '==', todayStr()));
      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.entryTime?.toDate?.() || 0) - (a.entryTime?.toDate?.() || 0));
      setSessions(data);
    } catch (err) {
      setError('Failed to load sessions.'); console.error(err);
    } finally { setLoading(false); }
  };

  const loadHistory = async (date) => {
    if (!date) return;
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'sessions'), where('sessionDate', '==', date));
      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.entryTime?.toDate?.() || 0) - (a.entryTime?.toDate?.() || 0));
      setSessions(data);
    } catch (err) {
      setError('Failed to load session history.'); console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (activeTab === 'today') loadToday(); }, [activeTab]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-primary tracking-tight uppercase flex items-center gap-2">
          <CalendarCheck className="text-primary w-5 h-5 md:w-6 md:h-6" /> Attendance
        </h1>
        <p className="text-[#555] text-[10px] md:text-xs font-bold tracking-[0.2em] mt-1 md:mt-2 uppercase text-muted">Session logs for all members.</p>
      </div>

      {error && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 bg-[#0a0a0a] border border-[#1a1a1a] p-1 w-fit rounded-sm">
        {['today', 'history'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 md:px-6 py-1.5 md:py-2 text-[9px] md:text-[10px] font-bold tracking-widest uppercase transition-colors ${activeTab === tab ? 'bg-[#111] text-primary' : 'text-[#666] hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'history' && (
        <input
          type="date"
          value={historyDate}
          max={todayStr()}
          onChange={e => { setHistoryDate(e.target.value); loadHistory(e.target.value); }}
          className="bg-card border border-border rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2 text-white text-xs md:text-sm focus:outline-none focus:border-primary transition-colors w-full md:w-auto"
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <SessionTable sessions={sessions} userRole={userRole} currentUser={currentUser} onEdit={setEditSession} />
      )}

      {editSession && (
        <EditSessionModal session={editSession} currentUser={currentUser}
          onClose={() => setEditSession(null)}
          onSaved={activeTab === 'today' ? loadToday : () => loadHistory(historyDate)} />
      )}
    </div>
  );
};

export default Attendance;
