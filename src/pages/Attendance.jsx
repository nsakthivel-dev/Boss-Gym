import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, query, where, getDocs, doc, updateDoc
} from 'firebase/firestore';
import { CalendarCheck, Edit2, X, RefreshCw, Clock, UserCheck, Calendar, Activity, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const todayStr = () => new Date().toISOString().split('T')[0];

const formatTime = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate?.() ?? new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const statusBadge = (s) => {
  const map = {
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    closed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'no-exit': 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${map[s] || 'bg-neutral-100 text-neutral-600'}`}>
      {s === 'no-exit' ? 'Auto-closed' : s === 'open' ? 'Active On Floor' : 'Completed'}
    </span>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    onClick={onClose}
  >
    <div 
      className="w-full max-w-md bg-white border border-[#e7e2d5] rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-5 border-b border-[#e7e2d5] bg-gradient-to-r from-gold-50/70 to-white">
        <h3 className="text-neutral-900 font-black text-base uppercase tracking-tight font-athletic">{title}</h3>
        <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
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
      setError('Failed to save session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#faf9f6] border border-[#e7e2d5] text-neutral-900 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-gold-500 focus:bg-white transition-all";

  return (
    <Modal title={`Adjust Session · ${session.memberName}`} onClose={onClose}>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block mb-1 font-athletic">Workout Entry Time *</label>
          <input
            type="time"
            value={entryTime}
            onChange={e => setEntryTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block mb-1 font-athletic">Workout Exit Time (Leave blank if currently training)</label>
          <input
            type="time"
            value={exitTime}
            onChange={e => setExitTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-[#e7e2d5] text-neutral-600 hover:bg-[#faf9f6] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 shadow-gold-sm transition-all disabled:opacity-50 active:scale-95 font-athletic"
          >
            {loading ? 'Saving...' : 'Update Session'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const Attendance = () => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'sessions'),
        where('sessionDate', '==', selectedDate)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => {
        const at = a.entryTime?.toDate?.() ?? new Date(a.entryTime);
        const bt = b.entryTime?.toDate?.() ?? new Date(b.entryTime);
        return bt - at;
      });
      setSessions(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedDate]);

  const insideCount = sessions.filter(s => s.status === 'open').length;
  const completedCount = sessions.filter(s => s.status === 'closed').length;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e7e2d5]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-700 font-athletic">Workout Tracking</span>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight uppercase font-athletic">Attendance Register</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Real-time gym attendance logs and workout durations</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 bg-white border border-[#e7e2d5] rounded-2xl px-4 py-2 shadow-xs">
            <Calendar size={16} className="text-gold-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-900 focus:outline-none"
            />
          </div>
          {selectedDate !== todayStr() && (
            <button
              onClick={() => setSelectedDate(todayStr())}
              className="px-4 py-2.5 bg-neutral-900 text-gold-400 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors active:scale-95 font-athletic"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards with High-Performance Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Sessions */}
        <div className="bg-white border border-[#e7e2d5] rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 font-athletic">Daily Visits</span>
            <p className="text-2xl font-black text-neutral-900 mt-1 font-athletic">{sessions.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gold-50 text-gold-700 flex items-center justify-center">
            <CalendarCheck size={22} />
          </div>
        </div>

        {/* Currently Training (Dark Athletic Card with Live Glow) */}
        <div className="bg-[#171717] border border-gold-500/30 rounded-3xl p-5 shadow-xl text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gold-400 font-athletic flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Active Inside Now
            </span>
            <p className="text-2xl font-black text-white mt-1 font-athletic">{insideCount} Athletes</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        {/* Completed Workouts */}
        <div className="bg-white border border-[#e7e2d5] rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 font-athletic">Finished Workouts</span>
            <p className="text-2xl font-black text-emerald-600 mt-1 font-athletic">{completedCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck size={22} />
          </div>
        </div>
      </div>

      {/* Sessions Container */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : sessions.length === 0 ? (
        <EmptyState 
          icon={CalendarCheck}
          title="No workouts recorded"
          description={`No attendance sessions logged for ${selectedDate}.`}
        />
      ) : (
        <div className="bg-white border border-[#e7e2d5] rounded-3xl shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf9f6] border-b border-[#e7e2d5] text-[10px] font-black tracking-wider text-neutral-500 uppercase font-athletic">
                  <th className="px-6 py-4">Athlete</th>
                  <th className="px-6 py-4">Entry Time</th>
                  <th className="px-6 py-4">Exit Time</th>
                  <th className="px-6 py-4">Workout Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece2] text-xs">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-gold-50/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-neutral-900 uppercase tracking-tight font-athletic">
                      {s.memberName}
                      {s.edited && <span className="ml-2 text-[9px] text-amber-600 font-normal italic">(adjusted)</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-neutral-700">
                      {formatTime(s.entryTime)}
                    </td>
                    <td className="px-6 py-4 font-mono text-neutral-700">
                      {formatTime(s.exitTime)}
                    </td>
                    <td className="px-6 py-4 font-black text-neutral-900">
                      {s.durationMinutes != null ? (
                        <span className="px-2.5 py-1 rounded-lg bg-gold-50 text-gold-800 border border-gold-200">
                          {s.durationMinutes} mins
                        </span>
                      ) : 'Training…'}
                    </td>
                    <td className="px-6 py-4">
                      {statusBadge(s.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingSession(s)}
                        className="p-2 rounded-xl bg-[#faf9f6] hover:bg-gold-50 text-neutral-600 hover:text-gold-700 transition-colors border border-[#e7e2d5]"
                        title="Adjust Session Time"
                      >
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-[#f0ece2]">
            {sessions.map(s => (
              <div key={s.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm text-neutral-900 uppercase font-athletic">{s.memberName}</p>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      {formatTime(s.entryTime)} {s.exitTime ? `— ${formatTime(s.exitTime)}` : '(On Workout Floor)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(s.status)}
                    <button
                      onClick={() => setEditingSession(s)}
                      className="p-2 rounded-xl bg-[#faf9f6] border border-[#e7e2d5] text-neutral-700 active:scale-95"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
                {s.durationMinutes != null && (
                  <p className="text-xs text-neutral-600 bg-[#faf9f6] px-3.5 py-2 rounded-xl border border-[#e7e2d5] font-semibold flex items-center justify-between">
                    <span className="text-[11px] uppercase font-athletic text-neutral-400">Duration</span>
                    <span className="font-black text-neutral-900">{s.durationMinutes} minutes</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          currentUser={currentUser}
          onClose={() => setEditingSession(null)}
          onSaved={fetchSessions}
        />
      )}
    </div>
  );
};

export default Attendance;
