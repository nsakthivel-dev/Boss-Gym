import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where,
  Timestamp
} from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import {
  Users, Plus, Search, X, Download, Loader2, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  QrCode, MessageCircle, Check, TrendingUp, Wallet, ShieldCheck, MoreVertical, ExternalLink
} from 'lucide-react';
import { sendExpiryAlert, sendExpiredAlert, sendWelcomeMessage } from '../utils/whatsapp';

const todayStr = () => new Date().toISOString().split('T')[0];

const statusBadge = (status) =>
  status === 'active'
    ? <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full font-semibold">Active</span>
    : <span className="bg-error/10 text-error text-xs px-2 py-0.5 rounded-full font-semibold">Expired</span>;

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-sm">
    <div className="w-full max-w-lg bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-6 md:p-8 border-b border-[#1a1a1a] bg-[#111]">
        <h3 className="text-primary font-black text-xl uppercase tracking-tight">{title}</h3>
        <button onClick={onClose} className="p-2 -mr-2 text-[#444] hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

const MemberProfileModal = ({ member, onClose, onEdit, onDelete, onWhatsApp }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const sessionQ = query(collection(db, 'sessions'), where('memberId', '==', member.id));
        const snap = await getDocs(sessionQ);
        const allSessions = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.entryTime?.toDate?.() || 0) - (a.entryTime?.toDate?.() || 0));
        setSessions(allSessions.slice(0, 10));
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [member.id]);

  return (
    <Modal title={member.name} onClose={onClose}>
      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => { onWhatsApp(member); onClose(); }}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-[#0d1a10] border border-[#1a2e1d] rounded-sm hover:bg-[#1a2e1d] transition-all group"
          >
            <MessageCircle className="text-[#25D366] w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] font-black text-[#25D366] uppercase tracking-widest">WhatsApp</span>
          </button>
          <button 
            onClick={() => { onEdit(member); onClose(); }}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-[#111] border border-[#1a1a1a] rounded-sm hover:border-primary/30 transition-all group"
          >
            <Edit className="text-primary/60 w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest">Edit</span>
          </button>
          <button 
            onClick={() => { onDelete(member); onClose(); }}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1a0d0d] border border-[#2e1a1a] rounded-sm hover:bg-[#2e1a1a] transition-all group"
          >
            <Trash2 className="text-error w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] font-black text-error uppercase tracking-widest">Delete</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
          {[
            ['Phone', member.phone],
            ['Email', member.email],
            ['Plan', member.price ? `₹${member.price} / ${member.durationDays}d` : (member.planName || '—')],
            ['Status', member.status === 'active' ? '✅ Active' : '❌ Expired']
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <p className="text-[#555] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">{k}</p>
              <p className={`text-white font-bold text-sm tracking-tight ${k === 'Email' ? 'break-all' : ''}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-[#1a1a1a] pt-6">
          <h4 className="text-primary/40 text-[10px] font-black tracking-[0.2em] uppercase mb-4">Recent Attendance</h4>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[#333] text-[10px] font-bold uppercase tracking-widest text-center py-4">No records found.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {sessions.map(s => (
                <div key={s.id} className="flex justify-between items-center py-2 border-b border-[#1a1a1a]/50 group hover:border-primary/20 transition-colors">
                  <span className="text-primary/60 text-[10px] font-mono">{s.sessionDate}</span>
                  <span className="text-white font-bold text-[10px] tracking-widest uppercase">
                    {s.entryTime?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const MemberFormModal = ({ editingMember, onClose, onSaved }) => {
  const { settings: gymSettings } = useSettings();
  const [form, setForm] = useState({
    name: editingMember?.name || '',
    phone: editingMember?.phone || '',
    email: editingMember?.email || '',
    price: editingMember?.price || '',
    durationDays: editingMember?.durationDays || '30',
    startDate: editingMember?.startDate?.toDate?.() ? editingMember.startDate.toDate().toISOString().split('T')[0] : todayStr(),
    workoutStartPreference: 'today'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMember, setSuccessMember] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const price = Number(form.price);
      const duration = Number(form.durationDays);
      const startDate = new Date(form.startDate);
      startDate.setHours(0,0,0,0);
      const endDate = new Date(startDate.getTime() + duration * 86400000);
      const status = endDate >= new Date() ? 'active' : 'expired';

      // Calculate Workout Schedule Start Date
      const workoutStartDate = new Date();
      workoutStartDate.setHours(0,0,0,0);
      if (form.workoutStartPreference === 'tomorrow') {
        workoutStartDate.setDate(workoutStartDate.getDate() + 1);
      }

      const memberData = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        price,
        durationDays: duration,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        status,
        workoutStartDate: Timestamp.fromDate(workoutStartDate),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if (editingMember) {
        await updateDoc(doc(db, 'members', editingMember.id), memberData);
        onSaved();
        onClose();
      } else {
        const docRef = await addDoc(collection(db, 'members'), {
          ...memberData,
          qrValue: '',
          createdAt: Timestamp.fromDate(new Date()),
        });
        setSuccessMember({ ...memberData, id: docRef.id });
        onSaved();
      }
    } catch (err) {
      setError('Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successMember) {
    return (
      <Modal title="Success" onClose={onClose}>
        <div className="text-center py-8 space-y-8">
          <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6 border border-success/20">
            <Check size={40} strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-white font-black text-2xl uppercase tracking-tight">Member Added!</h3>
            <p className="text-[#555] text-xs font-bold tracking-widest uppercase mt-2">The membership is now active.</p>
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => { sendWelcomeMessage(successMember, gymSettings?.gymName); onClose(); }}
              className="w-full bg-[#25D366] text-white font-black py-4 rounded-sm flex items-center justify-center gap-3 hover:bg-[#25D366]/90 transition-all uppercase text-[10px] tracking-[0.2em]"
            >
              <MessageCircle size={20} /> Send Welcome WhatsApp
            </button>
            <button onClick={onClose} className="w-full text-[#444] hover:text-white py-2 text-[10px] font-bold uppercase tracking-widest transition-colors">
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const inputClass = "w-full bg-[#111] border border-[#1a1a1a] text-white rounded-sm px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/50 transition-all placeholder:text-[#333]";
  const labelClass = "text-[#555] text-[10px] font-black tracking-[0.2em] uppercase mb-2 block";

  return (
    <Modal title={editingMember ? "Edit Member" : "Add New Member"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-error/10 border border-error/30 text-error text-[10px] font-bold uppercase tracking-widest rounded-sm px-4 py-3">{error}</div>}
        
        <div className="space-y-4">
          {[['name', 'Full Name', 'text'], ['phone', 'Phone', 'tel'], ['email', 'Email', 'email']].map(([f, l, t]) => (
            <div key={f}>
              <label className={labelClass}>{l}</label>
              <input type={t} required value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} className={inputClass} placeholder={`Enter ${l.toLowerCase()}...`} />
            </div>
          ))}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Amount (₹)</label>
              <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Duration (Days)</label>
              <input type="number" required value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} className={inputClass} placeholder="30" />
            </div>
          </div>
          
          <div>
            <label className={labelClass}>Membership Start Date</label>
            <input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
          </div>
        </div>

        {!editingMember && (
          <div className="bg-[#111] border border-[#1a1a1a] p-6 rounded-sm space-y-4">
            <label className="text-primary text-[10px] font-black tracking-[0.3em] uppercase block">Workout Schedule Start</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, workoutStartPreference: 'today' })}
                className={`py-3 text-[10px] font-black tracking-widest uppercase border rounded-sm transition-all ${form.workoutStartPreference === 'today' ? 'bg-primary border-primary text-black' : 'border-[#1a1a1a] text-[#444] hover:border-[#333]'}`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, workoutStartPreference: 'tomorrow' })}
                className={`py-3 text-[10px] font-black tracking-widest uppercase border rounded-sm transition-all ${form.workoutStartPreference === 'tomorrow' ? 'bg-primary border-primary text-black' : 'border-[#1a1a1a] text-[#444] hover:border-[#333]'}`}
              >
                Tomorrow
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] border border-[#1a1a1a] text-[#444] hover:text-white transition-all">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] bg-primary text-black hover:bg-white transition-all disabled:opacity-50">
            {loading ? 'Processing...' : (editingMember ? 'Save Changes' : 'Add Member')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Members = () => {
  const { settings: gymSettings } = useSettings();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'members'));
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete ${m.name}?`)) return;
    try {
      await deleteDoc(doc(db, 'members', m.id));
      await loadData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleRenew = async (m) => {
    const isExpired = m.status === 'expired';
    if (!isExpired) return;
    
    if (!window.confirm(`Renew subscription for ${m.name}?`)) return;
    
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

  useEffect(() => { loadData(); }, []);

  const filtered = members
    .sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
    .filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search));

  const activeCount = members.filter(m => m.status === 'active').length;
  const totalRevenue = members.filter(m => m.status === 'active').reduce((acc, m) => acc + (Number(m.price) || 0), 0);
  
  // Calculate Retention: (Active Members / Total Members) * 100
  const activeRetention = members.length > 0 
    ? Math.round((activeCount / members.length) * 100) 
    : 0;

  // System status check: Simple check if we have data and Firebase is responsive
  const isSystemOperational = !loading && !error && members.length >= 0;

  const handleExport = () => {
    if (filtered.length === 0) return;
    
    // Define headers
    const headers = ['Name', 'Phone', 'Plan', 'Duration', 'Start Date', 'End Date', 'Status'];
    
    // Format rows
    const rows = filtered.map(m => [
      m.name,
      m.phone,
      m.price,
      m.durationDays,
      m.startDate?.toDate?.().toLocaleDateString('en-GB') || '',
      m.endDate?.toDate?.().toLocaleDateString('en-GB') || '',
      m.status
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `members_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-primary tracking-tight uppercase">Members</h1>
          <p className="text-[#555] text-[10px] md:text-xs font-bold tracking-[0.2em] mt-1 md:mt-2 uppercase">{activeCount} Total Active Subscription</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={handleExport}
            className="bg-[#111] border border-[#1a1a1a] text-primary px-4 md:px-6 py-2 md:py-2.5 rounded-sm text-[9px] md:text-[10px] font-bold tracking-widest uppercase hover:border-primary/50 hover:text-white transition-colors flex items-center gap-2"
          >
            <Download size={12} className="md:hidden" />
            <span className="hidden md:inline">Export List</span>
            <span className="md:hidden">Export</span>
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-primary text-black px-4 md:px-6 py-2 md:py-2.5 rounded-sm text-[9px] md:text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-colors flex items-center gap-2 font-black"
          >
            <Plus size={14} /> <span className="hidden sm:inline">Add Member</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-[#111] border border-[#1a1a1a] p-4 md:p-8 rounded-sm group relative overflow-hidden">
          <TrendingUp size={16} className="text-info/40 mb-3 md:mb-6 group-hover:text-info transition-colors md:w-5 md:h-5" />
          <p className="text-[#555] text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase mb-1 md:mb-2">Retention</p>
          <p className="text-xl md:text-4xl font-black text-info">{activeRetention}%</p>
          <div className="absolute top-0 right-0 p-2 md:p-4 opacity-5 group-hover:opacity-10 transition-opacity text-info hidden md:block">
            <TrendingUp size={80} />
          </div>
        </div>

        <div className="bg-[#111] border border-[#1a1a1a] p-4 md:p-8 rounded-sm group relative overflow-hidden">
          <Wallet size={16} className="text-[#333] mb-3 md:mb-6 md:w-5 md:h-5" />
          <p className="text-[#555] text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase mb-1 md:mb-2">Revenue</p>
          <p className="text-xl md:text-4xl font-black text-primary font-mono">₹{(totalRevenue / 1000).toFixed(1)}k</p>
          <div className="absolute top-0 right-0 p-2 md:p-4 opacity-5 group-hover:opacity-10 transition-opacity text-primary hidden md:block">
            <Wallet size={80} />
          </div>
        </div>

        <div className="bg-[#111] border border-[#1a1a1a] p-4 md:p-8 rounded-sm group relative overflow-hidden col-span-2 md:col-span-1">
          <ShieldCheck size={16} className={`${isSystemOperational ? 'text-success/40' : 'text-error/40'} mb-1 md:mb-2 group-hover:text-success transition-colors md:w-5 md:h-5`} />
          <p className="text-[#555] text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5 md:mb-1">System Status</p>
          <p className={`text-sm md:text-lg font-bold ${isSystemOperational ? 'text-success' : 'text-error'} leading-tight uppercase tracking-tight`}>
            {isSystemOperational ? 'Operational' : 'Degraded'}
          </p>
          <p className="text-[#444] text-[8px] md:text-[10px] mt-1 font-bold uppercase tracking-wider">
            {isSystemOperational ? 'Access: OK' : 'Check Conn.'}
          </p>
          <div className={`absolute top-1/2 right-0 -translate-y-1/2 p-2 md:p-4 opacity-10 ${isSystemOperational ? 'text-success' : 'text-error'} hidden md:block`}>
            <ShieldCheck size={120} />
          </div>
        </div>
      </div>

      {/* Search & Table */}
      <div className="space-y-3 md:space-y-4">
        <div className="relative">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#444] w-4 h-4" />
          <input
            type="text"
            placeholder="FILTER BY NAME OR PHONE..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border-b border-[#1a1a1a] pl-10 md:pl-12 py-3 md:py-4 text-[9px] md:text-[10px] font-bold tracking-widest text-primary/40 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-24"><Loader2 className="animate-spin text-white w-8 h-8 opacity-20" /></div>
        ) : (
          <div className="border border-[#1a1a1a] bg-[#0c0c0c]/50">
            <table className="w-full text-left">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-primary/20 uppercase">Name</th>
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-primary/20 uppercase">Phone</th>
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-primary/20 uppercase">Plan</th>
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-primary/20 uppercase">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-primary/20 uppercase text-right">Subscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a] block md:table-row-group">
                {filtered.map((m, idx) => {
                  const daysLeft = m.endDate ? Math.ceil((m.endDate.toDate() - new Date()) / 86400000) : 0;
                  const initials = m.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const uid = m.uid || `BOSS-${2024 + (idx % 3)}-${String(idx + 1).padStart(3, '0')}`;
                  const isExpired = m.status === 'expired';

                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group flex flex-col md:table-row p-4 md:p-0 gap-3 md:gap-0">
                      <td onClick={() => setViewMember(m)} className="px-0 md:px-8 py-2 md:py-6 border-none md:table-cell cursor-pointer">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#1a1a1a] border border-[#222] rounded-sm flex items-center justify-center text-[#444] font-black text-xs md:text-sm tracking-widest group-hover:border-primary/20 transition-colors shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-primary font-bold text-xs md:text-sm tracking-tight truncate">{m.name}</p>
                            <p className="text-[#444] text-[9px] md:text-[10px] font-bold tracking-widest mt-0.5 md:mt-1 uppercase">UID: {uid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-0 md:px-8 py-2 md:py-6 border-none md:table-cell text-[#666] font-mono text-sm group-hover:text-info transition-colors">
                        <span className="md:hidden text-[10px] text-[#333] font-bold uppercase block mb-1 tracking-widest">Phone</span>
                        {m.phone.startsWith('+') ? m.phone : `+91 ${m.phone}`}
                      </td>
                      <td className="px-0 md:px-8 py-2 md:py-6 border-none md:table-cell">
                        <span className="md:hidden text-[10px] text-[#333] font-bold uppercase block mb-1 tracking-widest">Membership</span>
                        <p className="text-primary font-bold text-xs md:text-sm tracking-tight">₹{m.price} / {m.durationDays}d</p>
                        <p className="text-[#444] text-[9px] md:text-[10px] font-bold tracking-widest mt-0.5 md:mt-1 uppercase">Exp: {m.endDate?.toDate?.().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </td>
                      <td className="px-0 md:px-8 py-2 md:py-6 border-none md:table-cell">
                        <span className="md:hidden text-[10px] text-[#333] font-bold uppercase block mb-2 tracking-widest">Status</span>
                        <div className={`flex items-center gap-2 border rounded-full px-3 py-1 w-fit ${
                          m.status === 'active' 
                            ? 'bg-[#0d1a10] border-[#1a2e1d]' 
                            : 'bg-[#1a0d0d] border-[#2e1a1a]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            m.status === 'active' ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                          }`} />
                          <span className={`text-[10px] font-black tracking-[0.1em] uppercase ${
                            m.status === 'active' ? 'text-[#10b981]' : 'text-[#ef4444]'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-0 md:px-8 py-2 md:py-4 border-none md:table-cell">
                        <button 
                          onClick={() => handleRenew(m)}
                          disabled={!isExpired}
                          className={`w-full md:w-auto px-3 md:px-4 py-2 rounded-sm text-[9px] md:text-[10px] font-black uppercase tracking-wider md:tracking-widest transition-all ${
                            isExpired 
                              ? 'bg-primary text-black hover:bg-white cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                              : 'bg-[#111] border border-[#1a1a1a] text-[#333] cursor-not-allowed opacity-50'
                          }`}
                        >
                          {isExpired ? 'Renew' : 'Renew Subscription'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[#555] text-[10px] font-bold tracking-[0.2em] uppercase">
        <p>Showing 1 to {filtered.length} of {members.length} Members</p>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 hover:text-primary transition-colors"><ChevronLeft size={14} /> Previous</button>
          <button className="flex items-center gap-2 hover:text-primary transition-colors">Next <ChevronRight size={14} /></button>
        </div>
      </div>

      {showAdd && <MemberFormModal onClose={() => setShowAdd(false)} onSaved={loadData} />}
      {editingMember && <MemberFormModal editingMember={editingMember} onClose={() => setEditingMember(null)} onSaved={loadData} />}
      {viewMember && (
        <MemberProfileModal 
          member={viewMember} 
          onClose={() => setViewMember(null)} 
          onEdit={setEditingMember}
          onDelete={handleDelete}
          onWhatsApp={(m) => {
            if (m.status === 'expired') {
              sendExpiredAlert(m, gymSettings?.gymName);
            } else {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const endDate = m.endDate.toDate();
              const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
              if (daysLeft <= 7) {
                sendExpiryAlert(m, daysLeft, gymSettings?.gymName);
              } else {
                sendWelcomeMessage(m, gymSettings?.gymName);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default Members;
