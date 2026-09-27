import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import {
  collection, query, where, getDocs, onSnapshot
} from 'firebase/firestore';
import { runMidnightCleanup } from '../utils/cleanup';
import {
  Users, UserCheck, Clock, CalendarCheck, AlertTriangle, 
  MessageCircle, ShieldAlert, Sparkles, Dumbbell, Zap,
  Activity, ArrowUpRight, ChevronRight, QrCode, Plus,
  Flame, Award, ShieldCheck, TrendingUp, Calendar, ArrowRight,
  Search, Phone, Filter, CheckCircle2, Image as ImageIcon
} from 'lucide-react';
import { requestNotificationPermission } from "../utils/notifications";
import { checkAndNotifyExpiring } from "../utils/alertChecker";
import { sendExpiryAlert } from '../utils/whatsapp';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Link, useNavigate } from 'react-router-dom';
import { getMemberPhotoMap } from '../utils/supabaseStorage';

const todayStr = () => new Date().toISOString().split('T')[0];

const formatTime = (ts) => {
  if (!ts) return '—';
  const d = ts instanceof Date ? ts : ts.toDate?.() ?? new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDuration = (ms) => {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

const Dashboard = () => {
  const { alerts: expiryAlerts, alertCount } = useNotification();
  const { settings: gymSettings } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, activeCount: 0, presentToday: 0, totalToday: 0 });
  const [liveInside, setLiveInside] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [photoMap, setPhotoMap] = useState({});
  const [athleteSearch, setAthleteSearch] = useState('');
  const [athleteFilter, setAthleteFilter] = useState('all');

  // Live refresh for session duration display
  useEffect(() => {
    const interval = setInterval(() => {
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

  // Fetch Firestore Members + Supabase Storage Photos in real-time
  useEffect(() => {
    let unsubMembers = () => {};
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Supabase storage photo map
        const photos = await getMemberPhotoMap();
        if (isMounted) setPhotoMap(photos);

        // 2. Fetch or subscribe to Firestore members
        const membersRef = collection(db, 'members');
        unsubMembers = onSnapshot(membersRef, (snap) => {
          if (!isMounted) return;
          const memberList = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              profilePictureUrl: data.profilePictureUrl || photos[doc.id] || null
            };
          });
          setMembers(memberList);
          setStats(prev => ({
            ...prev,
            total: memberList.length,
            activeCount: memberList.filter(m => m.status === 'active').length
          }));
          setLoading(false);
        }, async (snapErr) => {
          console.warn("Real-time members snapshot error, falling back to getDocs:", snapErr);
          try {
            const snap = await getDocs(membersRef);
            const memberList = snap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                profilePictureUrl: data.profilePictureUrl || photos[doc.id] || null
              };
            });
            if (isMounted) {
              setMembers(memberList);
              setStats(prev => ({
                ...prev,
                total: memberList.length,
                activeCount: memberList.filter(m => m.status === 'active').length
              }));
            }
          } catch (getErr) {
            console.error("Firestore getDocs fallback error:", getErr);
            if (isMounted) setError("Could not connect to Firestore members.");
          } finally {
            if (isMounted) setLoading(false);
          }
        });

        // 3. Fetch today's check-in sessions
        await fetchTodayStats();
      } catch (err) {
        console.error("Dashboard initialization error:", err);
        if (isMounted) {
          setError("Failed to load dashboard data.");
          setLoading(false);
        }
      }
    };

    runMidnightCleanup();
    loadDashboardData();

    return () => {
      isMounted = false;
      unsubMembers();
    };
  }, []);

  const fetchTodayStats = async () => {
    try {
      const today = todayStr();
      const sessionsTodayQ = query(collection(db, 'sessions'), where('sessionDate', '==', today));
      const sessionsTodaySnap = await getDocs(sessionsTodayQ);
      const uniqueMembersToday = new Set(sessionsTodaySnap.docs.map(d => d.data().memberId));

      setStats(prev => ({
        ...prev,
        presentToday: uniqueMembersToday.size,
        totalToday: sessionsTodaySnap.size,
      }));
    } catch (err) {
      console.warn("Sessions today query warning:", err);
    }
  };

  // Live subscription for currently inside floor sessions
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
      console.warn("Live sessions snapshot warning:", err);
    });
    return () => unsub();
  }, []);

  // Filtered members for Dashboard Athlete Showcase
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredAthletes = members
    .filter(m => {
      const matchesSearch = 
        m.name?.toLowerCase().includes(athleteSearch.toLowerCase()) || 
        m.phone?.includes(athleteSearch);
      if (!matchesSearch) return false;

      const endDate = m.endDate?.toDate?.() ?? (m.endDate ? new Date(m.endDate) : null);
      const daysLeft = endDate ? Math.ceil((endDate - today) / 86400000) : 0;

      if (athleteFilter === 'active') return m.status === 'active' && daysLeft > 3;
      if (athleteFilter === 'expiring') return daysLeft <= 3 && daysLeft >= 0;
      if (athleteFilter === 'expired') return m.status === 'expired' || daysLeft < 0;
      return true;
    })
    .sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 bg-[#151515] border border-[#2a2a2a] rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // Calculate capacity gauge (max 50 recommended floor load)
  const maxFloorCapacity = 50;
  const occupancyPercentage = Math.min(Math.round((liveInside.length / maxFloorCapacity) * 100), 100);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in font-sans">
      
      {/* 1. BRAND HERO COMMAND CENTER (WITH REAL GYM PHOTO BACKDROP) */}
      <div className="relative overflow-hidden bg-[#121212] border border-[#2a2a2a] rounded-2xl sm:rounded-3xl text-white shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: `url('/photos/gallery/1000076824.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#121212]/90 to-[#0d0d0d]/80 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-gold-400 font-athletic">
                Turnstiles & GPS Geofence Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tight text-white font-athletic leading-tight">
              ATHLETIC COMMAND <span className="text-gold-gradient">PORTAL</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 font-medium max-w-xl">
              {gymSettings.gymName || 'New Boss Gym'} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              onClick={() => navigate('/members')}
              className="inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all shadow-gold-sm active:scale-95 font-athletic cursor-pointer"
            >
              <Plus size={15} strokeWidth={3} />
              <span>Enrol Athlete</span>
            </button>
            <button 
              onClick={() => navigate('/qr')}
              className="inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] hover:border-gold-400 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 font-athletic cursor-pointer"
            >
              <QrCode size={15} className="text-gold-400" />
              <span>Wall QR Sign</span>
            </button>
            <a 
              href="/checkin" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] hover:border-emerald-400 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 font-athletic"
            >
              <Zap size={15} className="text-emerald-400" />
              <span>Kiosk Mode</span>
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xs">
          <ShieldAlert size={18} /> {error}
        </div>
      )}

      {/* 2. COMPACT 2x2 MOBILE / 4-COL DESKTOP VISUAL METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        
        {/* Metric 1: Real-time Floor Load with Progress Ring Indicator */}
        <div className="bg-gradient-to-br from-[#1c1c1c] to-[#121212] border border-gold-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gold-400 font-athletic flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Inside
            </span>
            {/* Circular Progress Gauge */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#262626]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-gold-400 transition-all duration-700"
                  strokeDasharray={`${occupancyPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[9px] sm:text-[10px] font-black text-white font-athletic">{occupancyPercentage}%</span>
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-athletic tracking-tight leading-none">{liveInside.length}</p>
            <p className="text-[10px] sm:text-xs text-neutral-400 font-medium mt-1 truncate">Active on floor now</p>
          </div>
        </div>

        {/* Metric 2: Enrolled Active Athletes */}
        <div className="bg-white border border-[#e7e2d5] hover:border-gold-400 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-[11px] font-black text-neutral-500 uppercase tracking-wider font-athletic truncate">Athletes</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Users size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 font-athletic tracking-tight leading-none">{members.length || stats.total}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-neutral-500 mt-1 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
              <span className="truncate">{stats.activeCount || members.filter(m => m.status === 'active').length} Active</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Unique Athletes Today */}
        <div className="bg-white border border-[#e7e2d5] hover:border-emerald-400 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-[11px] font-black text-neutral-500 uppercase tracking-wider font-athletic truncate">Trained Today</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <UserCheck size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 font-athletic tracking-tight leading-none">{stats.presentToday}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-neutral-500 mt-1 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Unique Check-Ins</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Total Visits Logged */}
        <div className="bg-white border border-[#e7e2d5] hover:border-amber-400 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-[11px] font-black text-neutral-500 uppercase tracking-wider font-athletic truncate">Total Visits</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <CalendarCheck size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 font-athletic tracking-tight leading-none">{stats.totalToday}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-neutral-500 mt-1 flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="truncate">Floor Sessions</span>
            </p>
          </div>
        </div>

      </div>

      {/* 3. ATHLETE ROSTER & SUPABASE PROFILE VAULT (FIRESTORE MEMBERS + SUPABASE STORAGE PHOTOS) */}
      <div className="bg-white border border-[#e7e2d5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e7e2d5]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 shrink-0">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg sm:text-xl text-neutral-900 uppercase tracking-wider font-athletic">
                  Enrolled Athletes & Profiles
                </h2>
                <span className="text-xs font-black text-gold-700 bg-gold-50 border border-gold-200 px-2.5 py-0.5 rounded-full font-athletic">
                  {members.length} Synced
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                Live Firestore athletes synchronized with Supabase Storage profile photos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search athlete or phone..."
                value={athleteSearch}
                onChange={e => setAthleteSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#faf9f6] border border-[#e7e2d5] rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-gold-400 transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-[#faf9f6] border border-[#e7e2d5] rounded-xl p-1 gap-1">
              {['all', 'active', 'expiring', 'expired'].map(status => (
                <button
                  key={status}
                  onClick={() => setAthleteFilter(status)}
                  className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-lg transition-all font-athletic ${
                    athleteFilter === status
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <Link
              to="/members"
              className="text-xs font-black uppercase text-gold-700 hover:text-gold-800 bg-gold-50 hover:bg-gold-100 border border-gold-200 px-4 py-2 rounded-xl transition-all font-athletic flex items-center gap-1.5"
            >
              <span>Full Roster</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Athletes Grid */}
        {filteredAthletes.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No athletes match the search criteria"
            description="Try changing the filter or search term to view registered athletes."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAthletes.slice(0, 12).map(m => {
              const photoUrl = m.profilePictureUrl || photoMap[m.id];
              const initials = m.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A';
              const endDate = m.endDate?.toDate?.() ?? (m.endDate ? new Date(m.endDate) : null);
              const daysLeft = endDate ? Math.ceil((endDate - today) / 86400000) : 0;
              const isExpired = m.status === 'expired' || daysLeft < 0;

              return (
                <div
                  key={m.id}
                  className="bg-[#faf9f6] hover:bg-white border border-[#e7e2d5] hover:border-gold-300 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-sm space-y-3 group"
                >
                  <div className="flex items-center gap-3">
                    {/* Athlete Supabase Photo / Avatar */}
                    <div className="relative shrink-0">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={m.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-gold-300 shadow-xs bg-neutral-900 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-200 text-gold-700 font-black flex items-center justify-center shrink-0 font-athletic text-sm shadow-xs group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                      )}
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        m.status === 'active' && daysLeft > 3 
                          ? 'bg-emerald-500' 
                          : daysLeft <= 3 && daysLeft >= 0 
                            ? 'bg-amber-500' 
                            : 'bg-red-500'
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm text-neutral-900 truncate font-athletic">
                        {m.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        {m.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#ede8dc]">
                    <span className="text-[11px] font-bold text-neutral-700">
                      {m.price ? `₹${m.price} / ${m.durationDays}d` : (m.planName || 'Gym Access')}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      !isExpired 
                        ? (daysLeft <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800') 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {!isExpired ? `${daysLeft}d left` : 'Expired'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => sendExpiryAlert(m, daysLeft, gymSettings?.gymName)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors font-athletic"
                      title="WhatsApp Athlete"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </button>
                    <Link
                      to="/members"
                      className="py-1.5 px-3 rounded-xl bg-white hover:bg-neutral-50 border border-[#e7e2d5] text-neutral-700 font-bold text-[11px] flex items-center justify-center transition-colors font-athletic"
                      title="View in Members"
                    >
                      <span>Passport</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredAthletes.length > 12 && (
          <div className="pt-2 text-center border-t border-[#e7e2d5]">
            <Link
              to="/members"
              className="inline-flex items-center gap-2 text-xs font-black uppercase text-gold-700 hover:text-gold-800 font-athletic"
            >
              <span>View all {filteredAthletes.length} athletes in roster directory</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* 4. EXPIRING MEMBERSHIPS CALLOUT (Fitness Renewal Action Banner) */}
      {alertCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/40 border border-amber-300 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5 text-amber-900 font-black text-xs uppercase tracking-wider font-athletic">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Membership Renewals Requiring Coach Attention ({alertCount})</span>
            </div>
            <Link 
              to="/members" 
              className="text-xs font-bold text-amber-800 hover:text-amber-900 uppercase tracking-wider flex items-center gap-1 shrink-0 font-athletic"
            >
              <span>View Roster</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiryAlerts
              .filter(member => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const endDate = member.endDate?.toDate?.() ?? (member.endDate ? new Date(member.endDate) : null);
                const daysLeft = endDate ? Math.ceil((endDate - today) / 86400000) : 0;
                return daysLeft <= 3;
              })
              .map(member => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const endDate = member.endDate?.toDate?.() ?? (member.endDate ? new Date(member.endDate) : null);
                const daysLeft = endDate ? Math.ceil((endDate - today) / 86400000) : 0;
                const photoUrl = member.profilePictureUrl || photoMap[member.id];

                return (
                  <div key={member.id} className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={member.name}
                          className="w-10 h-10 rounded-xl object-cover border border-amber-300 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black flex items-center justify-center shrink-0 font-athletic text-xs">
                          {member.name?.charAt(0) || 'A'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 uppercase tracking-tight truncate font-athletic">{member.name}</p>
                        <p className="text-[11px] text-neutral-500 font-medium truncate">
                          {member.planName || (member.price ? `₹${member.price} / ${member.durationDays}d` : 'Gym Access')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        daysLeft < 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                      </span>
                      <button
                        onClick={() => sendExpiryAlert(member, daysLeft, gymSettings?.gymName)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                        title="Send WhatsApp Alert"
                      >
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      )}

      {/* 5. ASYMMETRIC GRID: REAL-TIME FLOOR OCCUPANCY VS DAILY ATHLETE LOGS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: High-Performance Dark Monitor - Live Floor Occupancy (Col 7) */}
        <div className="xl:col-span-7 bg-[#151515] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#262626]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity size={22} />
                </div>
                <div>
                  <h2 className="font-black text-base sm:text-lg uppercase tracking-wider font-athletic flex items-center gap-2">
                    Floor Occupancy Monitor
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium">
                    Real-time workout floor capacity
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-athletic">
                {liveInside.length} Training Now
              </span>
            </div>

            {/* Athletes Currently Training List */}
            {liveInside.length === 0 ? (
              <div className="py-14 text-center text-neutral-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
                <p className="text-xs font-black uppercase tracking-wider font-athletic">No active workouts on floor</p>
                <p className="text-xs text-neutral-400 mt-1">Checked-in athletes will appear here with live session timers.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                {liveInside.map(s => {
                  const entry = s.entryTime?.toDate?.();
                  const durationMs = entry ? Date.now() - entry.getTime() : 0;
                  const memberPhoto = photoMap[s.memberId] || members.find(m => m.id === s.memberId)?.profilePictureUrl;

                  return (
                    <div key={s.id} className="flex items-center justify-between bg-[#1e1e1e] hover:bg-[#252525] border border-[#2a2a2a] rounded-2xl px-4 py-3.5 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {memberPhoto ? (
                          <img
                            src={memberPhoto}
                            alt={s.memberName}
                            className="w-10 h-10 rounded-2xl object-cover border border-gold-400/60 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center font-black text-gold-400 text-xs shrink-0 font-athletic">
                            {s.memberName?.charAt(0) || 'A'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-bold text-xs sm:text-sm uppercase tracking-tight truncate font-athletic">
                            {s.memberName}
                          </p>
                          <p className="text-neutral-400 text-[11px] mt-0.5">
                            Started: {formatTime(s.entryTime)}
                          </p>
                        </div>
                      </div>
                      <span className="text-gold-400 text-xs font-black bg-gold-500/10 border border-gold-500/20 px-3.5 py-1.5 rounded-xl shrink-0 ml-3 font-athletic">
                        {formatDuration(durationMs)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#262626] flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Floor Load: {occupancyPercentage}% ({liveInside.length} / 50 optimal)</span>
            <Link to="/attendance" className="text-xs font-black uppercase text-gold-400 hover:text-gold-300 font-athletic flex items-center gap-1">
              <span>Attendance History</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right: Today's Full Athletic Feed (Col 5) */}
        <div className="xl:col-span-5 bg-white border border-[#e7e2d5] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e7e2d5]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700">
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <h2 className="font-black text-base sm:text-lg text-neutral-900 uppercase tracking-wider font-athletic">
                    Today's Athletic Feed
                  </h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    All check-ins logged today
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-neutral-600 bg-[#faf9f6] border border-[#e7e2d5] px-3 py-1 rounded-full font-athletic">
                {todaySessions.length} Total
              </span>
            </div>

            {todaySessions.length === 0 ? (
              <EmptyState 
                icon={CalendarCheck}
                title="No check-ins today yet" 
                description="Today's attendance entries will appear here in real time."
              />
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                {todaySessions.map(s => {
                  const memberPhoto = photoMap[s.memberId] || members.find(m => m.id === s.memberId)?.profilePictureUrl;

                  return (
                    <div key={s.id} className="flex items-center justify-between bg-[#faf9f6] hover:bg-white border border-[#e7e2d5] rounded-2xl px-4 py-3 transition-all shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {memberPhoto ? (
                          <img
                            src={memberPhoto}
                            alt={s.memberName}
                            className="w-9 h-9 rounded-xl object-cover border border-gold-300 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 font-black text-xs flex items-center justify-center shrink-0 font-athletic">
                            {s.memberName?.charAt(0) || 'A'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-neutral-900 font-bold text-xs sm:text-sm uppercase tracking-tight truncate font-athletic">
                            {s.memberName}
                          </p>
                          <p className="text-neutral-500 text-[11px] truncate mt-0.5">
                            {formatTime(s.entryTime)} 
                            {s.exitTime ? ` — ${formatTime(s.exitTime)} (${s.durationMinutes || 0}m)` : ' (On Floor)'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-xl font-black uppercase shrink-0 ml-3 font-athletic ${
                        s.status === 'open' 
                          ? 'bg-blue-100 text-blue-800' 
                          : s.status === 'no-exit' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.status === 'open' ? 'Active' : s.status === 'no-exit' ? 'Auto-closed' : 'Completed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#e7e2d5] flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-athletic">
              Comprehensive Log
            </span>
            <Link 
              to="/attendance" 
              className="text-xs font-black text-gold-700 hover:text-gold-800 uppercase tracking-wider flex items-center gap-1.5 font-athletic"
            >
              <span>Full Attendance Logs</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

      </div>

      {/* 6. PROMOTIONAL ATHLETIC BANNER (REAL GYM MOTIVATION IMAGE) */}
      <div className="relative overflow-hidden bg-[#151515] border border-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-white shadow-xl">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: `url('/photos/anastase-maragos-7kEpUPB8vNk-unsplash.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#151515]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[10px] font-black uppercase tracking-widest font-athletic">
            <Flame size={12} />
            <span>Master Coach Creed</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white font-athletic leading-tight">
            DISCIPLINE IS THE BRIDGE BETWEEN <br />
            <span className="text-gold-gradient">GOALS & ACCOMPLISHMENT.</span>
          </h2>
          <p className="text-neutral-300 text-xs sm:text-sm font-medium leading-relaxed">
            Ensure every athlete has an assigned progressive overload split. Review workout history and keep the energy on the floor intense and focused.
          </p>
          <div className="pt-2">
            <Link 
              to="/schedule"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic active:scale-95"
            >
              <span>Manage 7-Day Workout Cycles</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
