import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import {
  collection, query, where, getDocs, onSnapshot,
  getCountFromServer, Timestamp
} from 'firebase/firestore';
import { runMidnightCleanup } from '../utils/cleanup';
import { seedDatabase } from '../utils/seed';
import {
  Users, UserCheck, UserX, AlertTriangle, Clock, Loader2, QrCode, MessageCircle, Bell, CalendarCheck
} from 'lucide-react';
import { requestNotificationPermission } from "../utils/notifications"
import { checkAndNotifyExpiring } from "../utils/alertChecker"
import { sendExpiryAlert } from '../utils/whatsapp';
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
  const { alerts: expiryAlerts, alertCount } = useNotification();
  const { settings: gymSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, presentToday: 0, totalToday: 0 });
  const [liveInside, setLiveInside] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);

  // Live refresh for duration display
  useEffect(() => {
    const interval = setInterval(() => {
      // Just trigger a re-render to update the "Currently Inside" durations
      setStats(prev => ({ ...prev }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Browser Notifications Logic
  useEffect(() => {
    async function initAlerts() {
      const granted = await requestNotificationPermission();
      if (granted) {
        await checkAndNotifyExpiring();
      }
    }
    initAlerts();
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

      // 1. Total members count (Lightweight)
      const membersCountSnap = await getCountFromServer(collection(db, 'members'));
      
      // 2. Present Today (Only fetch IDs for today's sessions)
      // 3. Today's Attendance count
      const sessionsTodayQ = query(collection(db, 'sessions'), where('sessionDate', '==', today));
      const sessionsTodaySnap = await getDocs(sessionsTodayQ);
      const uniqueMembersToday = new Set(sessionsTodaySnap.docs.map(d => d.data().memberId));

      setStats({
        total: membersCountSnap.data().count,
        presentToday: uniqueMembersToday.size,
        totalToday: sessionsTodaySnap.size,
      });
    } catch (err) {
      console.error("Dashboard Stats Fetch Error:", err);
    }
  };

  // Live subscription for currently inside
  useEffect(() => {
    const today = todayStr();
    const q = query(collection(db, 'sessions'), where('sessionDate', '==', today));
    const unsub = onSnapshot(q, (snap) => {
      const allToday = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (b.entryTime?.toDate?.() || 0) - (a.entryTime?.toDate?.() || 0));
      
      setTodaySessions(allToday);
      setLiveInside(allToday.filter(s => s.status === 'open'));
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
        <StatCard label="Unique Today" value={stats.presentToday} icon={UserCheck} color="bg-success/10 text-success" />
        <StatCard label="Currently Inside" value={liveInside.length} icon={Clock} color="bg-primary/10 text-primary" />
        <StatCard label="Total Visits Today" value={stats.totalToday} icon={CalendarCheck || Users} color="bg-warning/10 text-warning" />
      </div>

      {/* Alert Panel */}
      {alertCount > 0 && (
        <div style={{
          background: "#2d2000",
          border: "1px solid #fbbf24",
          borderRadius: "10px",
          padding: "16px 20px",
        }}>
          <div style={{
            color: "#fbbf24",
            fontWeight: "bold",
            fontSize: "14px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            ⚠️ Membership Alerts — Action Required
          </div>

          {expiryAlerts
            .filter(member => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const endDate = member.endDate.toDate?.() ?? new Date(member.endDate);
              const daysLeft = Math.ceil((endDate - today) / 86400000);
              return daysLeft <= 3;
            })
            .map(member => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const endDate = member.endDate.toDate?.() ?? new Date(member.endDate);
              const daysLeft = Math.ceil((endDate - today) / 86400000);

              return (
                <div key={member.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #2a2a2a"
                }}>
                  <div>
                    <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>
                      {member.name}
                    </div>
                    <div style={{ color: "#a3a3a3", fontSize: "12px" }}>
                      {member.planName || (member.price ? `₹${member.price} / ${member.durationDays}d` : 'Gym')}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      color: daysLeft < 0 ? "#f87171" : daysLeft === 0 ? "#f87171" : "#fbbf24",
                      fontSize: "13px",
                      fontWeight: "bold"
                    }}>
                      {daysLeft < 0
                        ? "Expired"
                        : daysLeft === 0
                        ? "Expires Today"
                        : daysLeft === 1
                        ? "Expires Tomorrow"
                        : `${daysLeft} days left`}
                    </span>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

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

        {/* Today Attendance Panel */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Today Attendance
          </h2>
          {todaySessions.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">No sessions today yet.</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white font-medium text-sm">{s.memberName}</p>
                    <p className="text-muted text-xs">
                      {formatTime(s.entryTime)} 
                      {s.exitTime ? ` — ${formatTime(s.exitTime)}` : ' (Inside)'}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    s.status === 'open' ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'
                  }`}>
                    {s.status === 'open' ? 'Inside' : 'Out'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expire Session Panel */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Expire Session
          </h2>
          {expiryAlerts.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">No memberships expiring soon.</p>
          ) : (
            <div className="space-y-3">
              {expiryAlerts.map(m => {
                const endDate = m.endDate.toDate?.() ?? new Date(m.endDate);
                const daysLeft = Math.ceil((endDate - new Date()) / 86400000);
                return (
                  <div key={m.id} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                    <div>
                      <p className="text-white font-medium text-sm">{m.name}</p>
                      <p className="text-muted text-xs">
                        {m.planName || (m.price ? `₹${m.price} / ${m.durationDays}d` : 'Gym')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold ${daysLeft <= 3 ? 'text-error' : 'text-warning'}`}>
                        {daysLeft}d left
                      </span>
                      <button
                        onClick={() => sendExpiryAlert(m, daysLeft, gymSettings?.gymName)}
                        className="bg-primary/10 text-primary px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showQRModal && (
        <WallQRModal onClose={() => setShowQRModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;
