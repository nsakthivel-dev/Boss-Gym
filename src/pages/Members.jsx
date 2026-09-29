import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { supabase } from '../supabase/config';
import {
  collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, query, where,
  Timestamp, onSnapshot
} from 'firebase/firestore';
import { useSettings } from '../context/SettingsContext';
import {
  Users, Plus, Search, X, Download, Eye, Edit, Trash2,
  MessageCircle, Check, TrendingUp, Wallet, ShieldCheck,
  Upload, Camera, RefreshCw, Phone, Calendar, CalendarCheck, Dumbbell,
  Clock, AlertTriangle, ArrowUpRight, Zap, Award, Flame,
  CheckCircle2
} from 'lucide-react';
import { sendExpiryAlert, sendWelcomeMessage } from '../utils/whatsapp';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { getMemberPhotoMap } from '../utils/supabaseStorage';
import MemberFormModal from '../components/MemberFormModal';
import { fetchMemberTodayWorkout } from '../utils/attendanceService';

const todayStr = () => new Date().toISOString().split('T')[0];

const Modal = ({ title, children, onClose, maxWidth = 'max-w-lg' }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans"
    onClick={onClose}
  >
    <div 
      className={`w-full ${maxWidth} bg-white border border-[#e7e2d5] rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up`}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-5 md:p-6 border-b border-[#e7e2d5] bg-gradient-to-r from-gold-50/70 to-white">
        <h3 className="text-neutral-900 font-black text-lg uppercase tracking-tight font-athletic">{title}</h3>
        <button 
          onClick={onClose} 
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

const MemberProfileModal = ({ member, onClose, onEdit, onDelete, onWhatsApp, onProfilePictureUpdate }) => {
  const [sessions, setSessions] = useState([]);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    if (!member?.id) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        let allSessions = [];
        
        // 1. Fetch from Firestore
        try {
          const sessionQ = query(collection(db, 'sessions'), where('memberId', '==', member.id));
          const [snap, workoutData] = await Promise.all([
            getDocs(sessionQ),
            fetchMemberTodayWorkout(member)
          ]);
          allSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setTodaysWorkout(workoutData);
        } catch (fsErr) {
          console.warn("Firestore sessions query warning:", fsErr);
        }

        // 2. Fetch from Supabase attendance_sessions
        try {
          if (supabase) {
            const { data: sbSessions } = await supabase
              .from('attendance_sessions')
              .select('*')
              .eq('member_id', member.id)
              .order('created_at', { ascending: false })
              .limit(20);

            if (Array.isArray(sbSessions)) {
              const existingIds = new Set(allSessions.map(s => s.id));
              sbSessions.forEach(sb => {
                if (!existingIds.has(sb.id)) {
                  allSessions.push({
                    id: sb.id,
                    memberId: sb.member_id,
                    memberName: sb.member_name,
                    sessionDate: sb.session_date,
                    entryTime: sb.entry_time,
                    exitTime: sb.exit_time,
                    durationMinutes: sb.duration_minutes,
                    status: sb.status
                  });
                }
              });
            }
          }
        } catch (sbErr) {
          console.warn("Supabase sessions query warning:", sbErr);
        }

        // Sort descending by entry time safely
        allSessions.sort((a, b) => {
          const timeA = a.entryTime?.toDate?.()?.getTime?.() || new Date(a.entryTime || a.created_at || 0).getTime() || 0;
          const timeB = b.entryTime?.toDate?.()?.getTime?.() || new Date(b.entryTime || b.created_at || 0).getTime() || 0;
          return timeB - timeA;
        });

        setSessions(allSessions.slice(0, 15));
      } catch (err) {
        console.error("Error loading athlete profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [member?.id]);

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (jpg, png, webp)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${member.id}_${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('member-profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        alert(`Failed to upload image: ${uploadError.message}`);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('member-profiles')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update member document in Firestore
      await updateDoc(doc(db, 'members', member.id), {
        profilePictureUrl: publicUrl,
        updatedAt: Timestamp.fromDate(new Date())
      });

      if (onProfilePictureUpdate) {
        onProfilePictureUpdate(member.id, publicUrl);
      }
      
      alert('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingPicture(false);
    }
  };

  const formatSessionTime = (ts) => {
    if (!ts) return null;
    try {
      const d = ts.toDate?.() ?? (ts instanceof Date ? ts : new Date(ts));
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return null;
    }
  };

  if (!member) {
    return (
      <Modal title="Athlete Passport" onClose={onClose} maxWidth="max-w-md">
        <div className="text-center py-8 space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-black uppercase text-neutral-900 font-athletic">Member Not Found</h3>
          <p className="text-xs text-neutral-500">The requested athlete record does not exist or has been removed.</p>
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-xs uppercase font-athletic"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const initials = member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = member.endDate?.toDate?.() ?? (member.endDate ? new Date(member.endDate) : null);
  const daysLeft = endDate ? Math.ceil((endDate - today) / 86400000) : 0;
  const progressPercent = Math.max(0, Math.min(100, Math.round(((Number(member.durationDays || 30) - daysLeft) / Number(member.durationDays || 30)) * 100)));

  // Resolve today's attendance session safely
  const todayStrDate = todayStr();
  const todaySession = sessions.find(s => s.sessionDate === todayStrDate || s.session_date === todayStrDate) || null;
  const entryFormatted = formatSessionTime(todaySession?.entryTime || todaySession?.entry_time) || '—';
  const exitFormatted = formatSessionTime(todaySession?.exitTime || todaySession?.exit_time) || (todaySession?.status === 'open' ? 'Active' : '—');

  return (
    <>
      <Modal title="Athlete Passport" onClose={onClose} maxWidth="max-w-2xl">
        <div className="space-y-6">
          
          {/* VIP Athletic Pass Card with Real Gym Cover Backdrop */}
          <div className="relative overflow-hidden bg-[#151515] border-2 border-gold-500/40 rounded-3xl text-white shadow-2xl">
            {/* Cover Image Header */}
            <div 
              className="h-24 sm:h-28 w-full bg-cover bg-center relative"
              style={{ backgroundImage: `url('/photos/victor-freitas-WvDYdXDzkhs-unsplash.jpg')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/60 to-black/40" />
              <div className="absolute top-3 left-4 text-[10px] text-neutral-400 font-mono tracking-wider">
                ID: {String(member.id || '').slice(0, 8)}
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                  member.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}>
                  {member.status === 'active' ? 'Active Athlete' : 'Expired'}
                </span>
                <div className="bg-neutral-950/80 backdrop-blur-md border border-gold-400/40 text-gold-400 text-[9px] font-black uppercase px-2.5 py-1 rounded-full font-athletic">
                  VIP Pass
                </div>
              </div>
            </div>

            {/* Profile Content Section */}
            <div className="px-5 sm:px-6 pb-6 -mt-12 sm:-mt-14 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                
                {/* Large Profile Image (150–180px) with Gold Border & Lightbox click */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative group">
                    <div 
                      onClick={() => {
                        if (member.profilePictureUrl) setShowLightbox(true);
                      }}
                      className={`w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-3 border-gold-400 ring-4 ring-gold-500/20 shadow-2xl bg-[#111] ${
                        member.profilePictureUrl ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
                      }`}
                      title={member.profilePictureUrl ? "Click to view full photo" : ""}
                    >
                      {member.profilePictureUrl ? (
                        <img
                          src={member.profilePictureUrl}
                          alt={member.name}
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1e1e1e] flex flex-col items-center justify-center text-gold-400 font-black text-4xl sm:text-5xl font-athletic">
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Camera / Edit button safely positioned */}
                    <label 
                      className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all hover:scale-110 shadow-lg border border-gold-300 z-20"
                      title="Upload or Change Photo"
                    >
                      {uploadingPicture ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        disabled={uploadingPicture}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {member.profilePictureUrl && (
                    <button
                      onClick={() => setShowLightbox(true)}
                      className="mt-2 text-[10px] font-bold text-gold-400 hover:text-gold-300 uppercase tracking-wider flex items-center gap-1 font-athletic cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Tap to preview</span>
                    </button>
                  )}
                </div>

                {/* Member Information */}
                <div className="flex-1 min-w-0 w-full text-center sm:text-left mt-2 sm:mt-6">
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-athletic truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gold-400 font-bold">
                      {member.price ? `₹${member.price} / ${member.durationDays || 30} Days Plan` : (member.planName || 'Standard Plan')}
                    </p>
                  </div>

                  {/* Subscription Days Remaining Bar */}
                  <div className="mt-3 p-3 bg-[#202020] border border-[#2a2a2a] rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase font-athletic">Cycle Validity</span>
                      <span className={`font-black font-athletic ${daysLeft <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {daysLeft > 0 ? `${daysLeft} Days Remaining` : 'Expired'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#121212] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${daysLeft <= 3 ? 'bg-amber-400' : 'bg-gradient-to-r from-gold-500 to-gold-400'}`}
                        style={{ width: `${Math.min(100, Math.max(5, 100 - progressPercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Contact Details Grid */}
                  <div className="mt-3 pt-3 border-t border-[#262626] grid grid-cols-2 gap-3 text-xs text-left">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-athletic">Phone</span>
                      <span className="font-mono font-bold text-white text-xs">{member.phone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-athletic">Email</span>
                      <span className="text-neutral-300 text-xs truncate block">{member.email || '—'}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => { onWhatsApp(member); onClose(); }}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider font-athletic">WhatsApp</span>
            </button>
            <button 
              onClick={() => { onEdit(member); onClose(); }}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-gold-50 border border-gold-200 text-gold-800 hover:bg-gold-100 transition-colors active:scale-95 cursor-pointer"
            >
              <Edit className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider font-athletic">Edit Details</span>
            </button>
            <button 
              onClick={() => { onDelete(member); onClose(); }}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider font-athletic">Remove</span>
            </button>
          </div>

          {/* Today's Live Attendance Status */}
          <div className="border-t border-[#e7e2d5] pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-athletic flex items-center gap-2">
                <Clock size={14} className="text-gold-600" />
                <span>Today's Attendance Status</span>
              </h4>
              <span className="text-[10px] font-mono text-neutral-400">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {todaySession ? (
              <div className={`p-3.5 rounded-2xl border ${
                todaySession.status === 'open' 
                  ? 'bg-emerald-50/70 border-emerald-300' 
                  : 'bg-blue-50/70 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      todaySession.status === 'open' ? 'bg-emerald-500 animate-ping' : 'bg-blue-500'
                    }`} />
                    <span className={`text-xs font-black uppercase font-athletic ${
                      todaySession.status === 'open' ? 'text-emerald-800' : 'text-blue-800'
                    }`}>
                      {todaySession.status === 'open' ? 'Checked In · Active On Floor' : 'Checked Out · Session Finished'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-neutral-600 font-mono">
                    {todaySession.status === 'open' ? `Entry: ${entryFormatted}` : `${entryFormatted} — ${exitFormatted}`}
                  </span>
                </div>
                {todaySession.durationMinutes && (
                  <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                    Total Floor Duration: <strong className="text-neutral-900 font-black">{todaySession.durationMinutes} minutes</strong>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">Not checked in today yet</span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-athletic">
                  Awaiting Check-in
                </span>
              </div>
            )}
          </div>

          {/* Today's Assigned Workout Routine */}
          <div className="border-t border-[#e7e2d5] pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-athletic flex items-center gap-2">
                <Flame size={14} className="text-gold-600" />
                <span>Today's Assigned Workout</span>
              </h4>
              <span className="text-[10px] font-bold text-gold-700 uppercase font-athletic">Daily Split</span>
            </div>

            {todaysWorkout ? (
              <div className="bg-[#171717] border border-[#2a2a2a] rounded-2xl p-4 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase text-white font-athletic leading-tight">
                      {todaysWorkout.title}
                    </p>
                    <p className="text-[11px] text-gold-400 font-medium mt-0.5">
                      {todaysWorkout.muscles || 'Target Routine'}
                    </p>
                  </div>
                  {todaysWorkout.isRest && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase font-athletic">
                      Rest Day
                    </span>
                  )}
                </div>

                {todaysWorkout.exercises && todaysWorkout.exercises.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#2a2a2a]">
                    {todaysWorkout.exercises.map((ex, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1 px-2 rounded-lg bg-[#202020]">
                        <span className="font-bold text-neutral-200">{ex.name}</span>
                        <span className="font-mono text-gold-400 font-bold text-[11px]">{ex.sets} × {ex.reps}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl text-xs text-neutral-400 text-center">
                No workout has been assigned for today.
              </div>
            )}
          </div>

          {/* Detailed Attendance History */}
          <div className="border-t border-[#e7e2d5] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 font-athletic flex items-center gap-2">
                <CalendarCheck size={14} className="text-gold-600" />
                <span>Attendance History</span>
              </h4>
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Recent Sessions</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-6 text-gold-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-neutral-400 text-xs text-center py-4">No attendance sessions logged yet for this athlete.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {sessions.map(s => {
                  const entry = formatSessionTime(s.entryTime || s.entry_time) || '—';
                  const exit = formatSessionTime(s.exitTime || s.exit_time) || (s.status === 'open' ? 'Active' : '—');

                  return (
                    <div key={s.id} className="flex justify-between items-center py-2.5 px-3.5 rounded-xl bg-[#faf9f6] border border-[#e7e2d5] text-xs">
                      <div>
                        <span className="font-mono font-bold text-neutral-900 block">{s.sessionDate || s.session_date}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {entry} {s.exitTime || s.exit_time ? `— ${exit}` : ''}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        {s.durationMinutes != null && (
                          <span className="font-bold text-neutral-700 bg-white border border-[#e7e2d5] px-2 py-0.5 rounded-lg text-[10px]">
                            {s.durationMinutes}m
                          </span>
                        )}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          s.status === 'open' 
                            ? 'bg-blue-100 text-blue-800' 
                            : s.status === 'no-exit' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.status === 'open' ? 'Active' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Lightbox Photo Preview Modal */}
      {showLightbox && member.profilePictureUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-sans"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X size={24} />
            </button>
            <div className="relative rounded-2xl overflow-hidden border-2 border-gold-500/60 shadow-2xl bg-neutral-950 p-1">
              <img
                src={member.profilePictureUrl}
                alt={member.name}
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-white text-base font-black font-athletic uppercase tracking-wider">
                {member.name}
              </p>
              <p className="text-gold-400 text-xs font-bold font-athletic uppercase tracking-widest mt-0.5">
                Official Athlete Passport Photo
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Members = () => {
  const { memberId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings: gymSettings } = useSettings();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [todaySessions, setTodaySessions] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [snap, photoMap] = await Promise.all([
        getDocs(collection(db, 'members')),
        getMemberPhotoMap()
      ]);
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          profilePictureUrl: data.profilePictureUrl || photoMap[d.id] || null
        };
      });
      setMembers(list);
    } catch (err) {
      console.error('Error loading athletes:', err);
      setError('Failed to load athlete directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Are you sure you want to remove athlete ${m.name}? This will delete their membership profile.`)) return;
    try {
      await deleteDoc(doc(db, 'members', m.id));
      await loadData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleRenew = async (m) => {
    if (!window.confirm(`Renew membership for ${m.name}?`)) return;
    
    setLoading(true);
    try {
      const duration = Number(m.durationDays) || 30;
      const newStartDate = new Date();
      newStartDate.setHours(0,0,0,0);
      const newEndDate = new Date(newStartDate.getTime() + duration * 86400000);
      
      await updateDoc(doc(db, 'members', m.id), {
        startDate: Timestamp.fromDate(newStartDate),
        endDate: Timestamp.fromDate(newEndDate),
        status: 'active',
        updatedAt: Timestamp.fromDate(new Date())
      });
      await loadData();
    } catch (err) {
      alert('Renewal failed');
    } finally {
      setLoading(false);
    }
  };

  // Synchronize route/URL parameter for direct Passport view (Requirement 29, TEST 26)
  useEffect(() => {
    const targetId = memberId || searchParams.get('view');
    if (!targetId) {
      setViewMember(null);
      setMemberNotFound(false);
      return;
    }

    // 1. Check if member exists in loaded list
    const match = members.find(m => m.id === targetId || m.phone === targetId);
    if (match) {
      setViewMember(match);
      setMemberNotFound(false);
      return;
    }

    // 2. If still loading initial members, wait for data to load
    if (loading) return;

    // 3. Fallback: Query Firestore and Supabase directly by ID or phone
    let active = true;
    const fetchTargetMember = async () => {
      try {
        if (db) {
          const snap = await getDoc(doc(db, 'members', targetId));
          if (snap.exists() && active) {
            setViewMember({ id: snap.id, ...snap.data() });
            setMemberNotFound(false);
            return;
          }

          // Check by phone number
          const pQ = query(collection(db, 'members'), where('phone', '==', targetId));
          const pSnap = await getDocs(pQ);
          if (!pSnap.empty && active) {
            const d = pSnap.docs[0];
            setViewMember({ id: d.id, ...d.data() });
            setMemberNotFound(false);
            return;
          }
        }

        if (supabase) {
          try {
            const { data } = await supabase
              .from('members')
              .select('*')
              .or(`id.eq.${targetId},phone.eq.${targetId}`)
              .maybeSingle();

            if (data && active) {
              setViewMember({
                id: data.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                price: data.price,
                durationDays: data.duration_days,
                status: data.status || 'active',
                profilePictureUrl: data.profile_picture_url || null
              });
              setMemberNotFound(false);
              return;
            }
          } catch (sbErr) {}
        }

        if (active) {
          setMemberNotFound(true);
        }
      } catch (err) {
        console.warn("Athlete passport lookup error:", err);
        if (active) {
          setMemberNotFound(true);
        }
      }
    };

    fetchTargetMember();

    return () => {
      active = false;
    };
  }, [memberId, searchParams, members, loading]);

  useEffect(() => { 
    loadData();

    // Subscribe to today's attendance sessions in real time
    const today = todayStr();
    const q = query(collection(db, 'sessions'), where('sessionDate', '==', today));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[data.memberId] = data;
      });
      setTodaySessions(map);
    }, (err) => console.warn("Live sessions snapshot warning in Members:", err));

    return () => unsub();
  }, []);

  const handleOpenPassport = (m) => {
    setViewMember(m);
    setMemberNotFound(false);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('view', m.id);
      return next;
    }, { replace: true });
  };

  const handleClosePassport = () => {
    setViewMember(null);
    setMemberNotFound(false);
    if (memberId) {
      navigate('/members', { replace: true });
    } else {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('view');
        return next;
      }, { replace: true });
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = members
    .sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
    .filter(m => {
      const matchesSearch = m.name?.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search);
      if (!matchesSearch) return false;

      const endDate = m.endDate?.toDate?.() ?? (m.endDate ? new Date(m.endDate) : null);
      const daysLeft = endDate ? Math.ceil((endDate - today) / 86400000) : 0;

      if (filterStatus === 'active') return m.status === 'active' && daysLeft > 3;
      if (filterStatus === 'expiring') return daysLeft <= 3 && daysLeft >= 0;
      if (filterStatus === 'expired') return m.status === 'expired' || daysLeft < 0;
      return true;
    });

  const activeCount = members.filter(m => m.status === 'active').length;
  const totalRevenue = members.filter(m => m.status === 'active').reduce((acc, m) => acc + (Number(m.price) || 0), 0);
  const activeRetention = members.length > 0 
    ? Math.round((activeCount / members.length) * 100) 
    : 0;

  const handleExport = () => {
    if (filtered.length === 0) return;
    
    const headers = ['Name', 'Phone', 'Email', 'Plan Price', 'Duration Days', 'Start Date', 'End Date', 'Status'];
    const rows = filtered.map(m => [
      m.name,
      m.phone,
      m.email || '',
      m.price,
      m.durationDays,
      m.startDate?.toDate?.().toLocaleDateString('en-GB') || '',
      m.endDate?.toDate?.().toLocaleDateString('en-GB') || '',
      m.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `boss_gym_athletes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in font-sans">
      
      {/* 1. ATHLETIC HERO ROSTER BANNER WITH REAL GYM PHOTO */}
      <div className="relative overflow-hidden bg-[#151515] border border-[#2a2a2a] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-xl">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: `url('/photos/sven-mieke-jO6vBWX9h9Y-unsplash.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#151515]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-1.5">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-gold-400 font-athletic">
              Member Passport & Database
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white font-athletic leading-tight">
              ATHLETE ROSTER
            </h1>
            <p className="text-xs text-neutral-300 font-medium">
              {activeCount} active gym subscriptions out of {members.length} registered athletes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              onClick={handleExport}
              className="bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] hover:border-gold-400 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 font-athletic cursor-pointer"
            >
              <Download size={14} className="text-gold-400" />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-gold-sm transition-all flex items-center gap-1.5 active:scale-95 font-athletic cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Enrol Athlete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. COMPACT ANALYTICS SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5">
        <div className="bg-white border border-[#e7e2d5] hover:border-blue-400/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-neutral-500 font-athletic truncate">Retention</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp size={14} className="sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-2xl md:text-3xl font-black text-blue-600 font-athletic tracking-tight leading-none">{activeRetention}%</p>
            <p className="text-[9px] sm:text-[11px] text-neutral-400 mt-1 hidden sm:block truncate">Consecutive attendance</p>
          </div>
        </div>

        <div className="bg-white border border-[#e7e2d5] hover:border-gold-400/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-neutral-500 font-athletic truncate">Revenue</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Wallet size={14} className="sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-2xl md:text-3xl font-black text-gold-700 font-athletic tracking-tight leading-none">₹{(totalRevenue / 1000).toFixed(1)}k</p>
            <p className="text-[9px] sm:text-[11px] text-neutral-400 mt-1 hidden sm:block truncate">Active pipeline</p>
          </div>
        </div>

        <div className="bg-white border border-[#e7e2d5] hover:border-emerald-400/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider text-neutral-500 font-athletic truncate">Active</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck size={14} className="sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-2xl md:text-3xl font-black text-emerald-600 font-athletic tracking-tight leading-none">{activeCount} / {members.length}</p>
            <p className="text-[9px] sm:text-[11px] text-neutral-400 mt-1 hidden sm:block truncate">Current valid roster</p>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTER PILLS */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search athlete by name or phone number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-[#e7e2d5] rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-gold-500 shadow-xs transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 p-1"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'All Athletes' },
            { id: 'active', label: 'Active' },
            { id: 'expiring', label: 'Expiring Soon' },
            { id: 'expired', label: 'Expired' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 font-athletic cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-neutral-900 text-gold-400 shadow-sm'
                  : 'bg-white border border-[#e7e2d5] text-neutral-600 hover:text-neutral-900 hover:bg-[#faf9f6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. ATHLETE TABLE & CARDS */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No athletes matching your query" : "No athletes enrolled yet"}
          description={search ? "Try searching with a different name or phone number." : "Start by registering your first gym member into the system."}
          actionLabel="Enrol Athlete"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div className="bg-white border border-[#e7e2d5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e7e2d5] bg-[#faf9f6] text-[10px] font-black uppercase tracking-wider text-neutral-500 font-athletic">
                  <th className="px-6 py-4">Athlete Passport</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Plan & Fee</th>
                  <th className="px-6 py-4">Live Floor Status</th>
                  <th className="px-6 py-4">Subscription Validity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece2]">
                {filtered.map((m) => {
                  const initials = m.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const isExpired = m.status === 'expired';
                  const endDate = m.endDate?.toDate?.() ?? (m.endDate ? new Date(m.endDate) : null);
                  const daysLeft = endDate ? Math.ceil((endDate - today) / 86400000) : 0;
                  const progress = Math.max(0, Math.min(100, Math.round(((Number(m.durationDays || 30) - daysLeft) / Number(m.durationDays || 30)) * 100)));
                  const memberTodaySession = todaySessions[m.id];

                  return (
                    <tr key={m.id} className="hover:bg-[#faf9f6]/70 transition-colors">
                      {/* Athlete Identity & Photo */}
                      <td className="px-6 py-4">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => handleOpenPassport(m)}
                        >
                          {m.profilePictureUrl ? (
                            <img
                              src={m.profilePictureUrl}
                              alt={m.name}
                              className="w-11 h-11 rounded-2xl object-cover border border-gold-300 shadow-xs group-hover:scale-105 transition-transform shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-gold-50 border border-gold-200 text-gold-700 font-black flex items-center justify-center font-athletic shrink-0 group-hover:scale-105 transition-transform">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-black text-sm text-neutral-900 group-hover:text-gold-700 transition-colors truncate font-athletic">
                              {m.name}
                            </p>
                            <span className="text-[10px] text-neutral-400 font-mono tracking-wider">
                              ID: {String(m.id || '').slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="font-mono font-bold text-neutral-900">{m.phone}</p>
                        <p className="text-[11px] text-neutral-400 truncate max-w-[140px]">{m.email || '—'}</p>
                      </td>

                      {/* Plan */}
                      <td className="px-6 py-4">
                        <p className="font-black text-neutral-900 font-athletic">₹{m.price}</p>
                        <p className="text-[10px] text-neutral-500">{m.durationDays || 30} Days Active Split</p>
                      </td>

                      {/* Live Floor Status */}
                      <td className="px-6 py-4">
                        {memberTodaySession?.status === 'open' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase font-athletic">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Inside Now
                          </span>
                        ) : memberTodaySession?.status === 'closed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-black uppercase font-athletic">
                            <Check size={11} className="text-blue-600" />
                            Trained Today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase font-athletic">
                            Not In Today
                          </span>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 max-w-[140px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={`font-black font-athletic ${
                              m.status === 'active' 
                                ? (daysLeft <= 3 ? 'text-amber-600' : 'text-emerald-600') 
                                : 'text-red-600'
                            }`}>
                              {m.status === 'active' ? (daysLeft <= 3 ? 'Expiring' : 'Active') : 'Expired'}
                            </span>
                            <span className="text-neutral-500 font-medium">
                              {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#f0ece2] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${daysLeft <= 3 ? 'bg-amber-400' : 'bg-gold-500'}`}
                              style={{ width: `${Math.min(100, Math.max(5, 100 - progress))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => sendExpiryAlert(m, daysLeft, gymSettings?.gymName)}
                            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                            title="Send WhatsApp Alert"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenPassport(m)}
                            className="px-3 py-2 rounded-xl bg-gold-50 hover:bg-gold-100 text-gold-800 transition-colors border border-gold-200 flex items-center gap-1 font-athletic text-[11px] font-bold cursor-pointer"
                            title={`View ${m.name}'s Athlete Passport`}
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setEditingMember(m)}
                            className="p-2.5 rounded-xl bg-[#faf9f6] hover:bg-gold-50 text-neutral-600 hover:text-gold-700 transition-colors border border-[#e7e2d5] cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit size={15} />
                          </button>
                          {isExpired && (
                            <button
                              onClick={() => handleRenew(m)}
                              className="px-3.5 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-neutral-950 font-black text-[10px] uppercase tracking-wider transition-all font-athletic cursor-pointer"
                              title="Renew Subscription"
                            >
                              Renew
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(m)}
                            className="p-2.5 rounded-xl bg-[#faf9f6] hover:bg-red-50 text-neutral-600 hover:text-red-700 transition-colors border border-[#e7e2d5] cursor-pointer"
                            title="Remove Athlete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Athletic Cards View */}
          <div className="md:hidden divide-y divide-[#f0ece2]">
            {filtered.map((m) => {
              const initials = m.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const isExpired = m.status === 'expired';
              const endDate = m.endDate?.toDate?.() ?? (m.endDate ? new Date(m.endDate) : null);
              const daysLeft = endDate ? Math.ceil((endDate - today) / 86400000) : 0;
              const memberTodaySession = todaySessions[m.id];

              return (
                <div key={m.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => handleOpenPassport(m)}
                    >
                      {m.profilePictureUrl ? (
                        <img
                          src={m.profilePictureUrl}
                          alt={m.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-gold-300 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-200 text-gold-700 font-black flex items-center justify-center shrink-0 font-athletic">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-black text-sm text-neutral-900 truncate font-athletic">{m.name}</p>
                          {memberTodaySession?.status === 'open' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-black uppercase font-athletic">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                              Inside
                            </span>
                          )}
                          {memberTodaySession?.status === 'closed' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[8px] font-black uppercase font-athletic">
                              Trained
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono">{m.phone}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${
                      m.status === 'active' 
                        ? (daysLeft <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800') 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {m.status === 'active' ? (daysLeft <= 3 ? 'Expiring' : 'Active') : 'Expired'}
                    </span>
                  </div>

                  <div className="bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-athletic block">Plan</span>
                      <span className="font-bold text-neutral-900">₹{m.price} / {m.durationDays || 30}d</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 uppercase font-athletic block">Validity</span>
                      <span className={`font-bold ${daysLeft <= 3 ? 'text-amber-700' : 'text-neutral-900'}`}>
                        {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => sendExpiryAlert(m, daysLeft, gymSettings?.gymName)}
                      className="flex-1 min-h-[44px] py-2 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 font-athletic cursor-pointer"
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleOpenPassport(m)}
                      className="min-h-[44px] px-3.5 bg-gold-50 hover:bg-gold-100 border border-gold-200 text-gold-800 rounded-xl font-bold text-xs active:scale-95 flex items-center justify-center gap-1 font-athletic cursor-pointer"
                      title="View Passport"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => setEditingMember(m)}
                      className="min-h-[44px] px-3.5 bg-white border border-[#e7e2d5] text-neutral-700 rounded-xl font-bold text-xs active:scale-95 flex items-center justify-center cursor-pointer"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    {isExpired && (
                      <button
                        onClick={() => handleRenew(m)}
                        className="min-h-[44px] px-3.5 bg-gold-500 text-neutral-950 rounded-xl font-black text-xs uppercase active:scale-95 font-athletic cursor-pointer"
                      >
                        Renew
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <MemberFormModal
          onClose={() => setShowAdd(false)}
          onSaved={loadData}
        />
      )}

      {editingMember && (
        <MemberFormModal
          editingMember={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={loadData}
        />
      )}

      {viewMember && (
        <MemberProfileModal
          member={viewMember}
          onClose={handleClosePassport}
          onEdit={(m) => setEditingMember(m)}
          onDelete={handleDelete}
          onWhatsApp={(m) => sendExpiryAlert(m, 0, gymSettings?.gymName)}
          onProfilePictureUpdate={(id, url) => {
            setMembers(prev => prev.map(m => m.id === id ? { ...m, profilePictureUrl: url } : m));
            if (viewMember?.id === id) {
              setViewMember(prev => ({ ...prev, profilePictureUrl: url }));
            }
          }}
        />
      )}

      {memberNotFound && (
        <Modal title="Athlete Passport" onClose={handleClosePassport} maxWidth="max-w-md">
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black uppercase text-neutral-900 font-athletic">Member Not Found</h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              The athlete ID could not be located in the current database. Please select an athlete from the roster.
            </p>
            <button
              onClick={handleClosePassport}
              className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl font-black text-xs uppercase tracking-wider font-athletic hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Return to Athlete Directory
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Members;
