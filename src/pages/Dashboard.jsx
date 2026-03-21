import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, query, where, getDocs, onSnapshot,
  getCountFromServer, Timestamp
} from 'firebase/firestore';
import { runMidnightCleanup } from '../utils/cleanup';
import { seedDatabase } from '../utils/seed';
import {
  Users, UserCheck, UserX, AlertTriangle, Clock, Loader2, QrCode
} from 'lucide-react';
import WallQRModal from '../components/WallQRModal';
import { QRCodeCanvas } from 'qrcode.react';



const todayStr = () => new Date().toISOString().split('T')[0];

const formatTime = (ts) => {
  if (!ts) return '—';
  const d = ts instanceof Date ? ts : ts.toDate?.() ?? new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (ms) => {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

const StatCard = ({ label, value, icon, color }) => {
  const IconComponent = icon;
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <IconComponent className="w-6 h-6" />
      </div>
      <div>
        <p className="text-muted text-sm">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, presentToday: 0, noExit: 0 });
  const [liveInside, setLiveInside] = useState([]);
  const [noExitSessions, setNoExitSessions] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);


  // Live refresh for duration display
  useEffect(() => {
    const interval = setInterval(() => {
      // Just trigger a re-render to update the "Currently Inside" durations
      setStats(prev => ({ ...prev }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await seedDatabase();
        await runMidnightCleanup();
        await fetchStats();
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchStats = async () => {
    try {
      const today = todayStr();
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 86400000);

      // 1. Total members count (Lightweight)
      const membersCountSnap = await getCountFromServer(collection(db, 'members'));
      
      // 2. Present Today (Only fetch IDs for today's sessions)
      const sessionsTodayQ = query(collection(db, 'sessions'), where('sessionDate', '==', today));
      const sessionsTodaySnap = await getDocs(sessionsTodayQ);
      const uniqueMembersToday = new Set(sessionsTodaySnap.docs.map(d => d.data().memberId));

      // 3. No-Exit Flags (Single filter to avoid composite index)
      const noExitQ = query(collection(db, 'sessions'), where('status', '==', 'no-exit'));
      const noExitSnap = await getDocs(noExitQ);
      const noExit = noExitSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.sessionDate < today); // Filter by date in memory
      setNoExitSessions(noExit);

      // 4. Expiry in 7 days (Single filter to avoid composite index)
      const expiryQ = query(collection(db, 'members'), where('status', '==', 'active'));
      const expirySnap = await getDocs(expiryQ);
      const expiryMembers = expirySnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => {
          if (!m.endDate) return false;
          const endDate = m.endDate.toDate?.() ?? new Date(m.endDate);
          return endDate <= in7Days;
        });
      setExpiryAlerts(expiryMembers);

      setStats({
        total: membersCountSnap.data().count,
        presentToday: uniqueMembersToday.size,
        noExit: noExit.length,
      });
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError('Error fetching stats. Check Firestore rules/indexes.');
    }
  };

  // Live subscription for currently inside
  useEffect(() => {
    const today = todayStr();
    // Simple query to avoid composite index reqs
    const q = query(collection(db, 'sessions'), where('sessionDate', '==', today));
    const unsub = onSnapshot(q, (snap) => {
      const openOnes = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.status === 'open');
      setLiveInside(openOnes);
    }, (err) => {
      console.error("Live Query Error:", err);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button 
          onClick={() => setShowQRModal(true)}
          className="flex items-center gap-2 bg-transparent border border-[#2a2a2a] text-[#e8c97e] px-4 py-2 rounded-lg text-sm hover:border-[#e8c97e] transition-colors"
        >
          <QrCode size={16} />
          Wall QR Code
        </button>
      </div>


      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={stats.total} icon={Users} color="bg-info/10 text-info" />
        <StatCard label="Present Today" value={stats.presentToday} icon={UserCheck} color="bg-success/10 text-success" />
        <StatCard label="Currently Inside" value={liveInside.length} icon={Clock} color="bg-primary/10 text-primary" />
        <StatCard label="No-Exit Flags" value={stats.noExit} icon={UserX} color="bg-error/10 text-error" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Currently Inside Live Panel */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block"></span>
            Currently Inside
          </h2>
          {liveInside.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">No members currently inside.</p>
          ) : (
            <div className="space-y-3">
              {liveInside.map(s => {
                const entry = s.entryTime?.toDate?.();
                const durationMs = entry ? Date.now() - entry.getTime() : 0;
                return (
                  <div key={s.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                    <div>
                      <p className="text-white font-medium text-sm">{s.memberName}</p>
                      <p className="text-muted text-xs">Entry: {formatTime(s.entryTime)}</p>
                    </div>
                    <span className="text-primary text-xs font-semibold bg-primary/10 px-2 py-1 rounded-full">
                      {formatDuration(durationMs)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* No Exit Panel */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <UserX className="w-4 h-4 text-error" />
            No Exit Flagged Sessions
          </h2>
          {noExitSessions.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">No flagged sessions.</p>
          ) : (
            <div className="space-y-3">
              {noExitSessions.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white font-medium text-sm">{s.memberName}</p>
                    <p className="text-muted text-xs">{s.sessionDate}</p>
                  </div>
                  <span className="text-error text-xs bg-error/10 px-2 py-1 rounded-full">No Exit</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiryAlerts.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-5">
          <h2 className="font-semibold text-warning mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Memberships Expiring Soon (within 7 days)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiryAlerts.map(m => {
              const daysLeft = Math.ceil((m.endDate.toDate() - new Date()) / 86400000);
              return (
                <div key={m.id} className="bg-secondary rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{m.name}</p>
                    <p className="text-muted text-xs">{m.planName}</p>
                  </div>
                  <span className="text-warning text-xs font-semibold">{daysLeft}d left</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showQRModal && (
        <WallQRModal onClose={() => setShowQRModal(false)} />
      )}
    </div>

  );
};

export default Dashboard;
