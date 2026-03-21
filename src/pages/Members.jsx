import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import {
  collection, getDocs, addDoc, doc, updateDoc, query, where,
  Timestamp
} from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Users, Plus, Search, X, Download, Loader2, Eye, Edit, ChevronLeft, ChevronRight,
  QrCode
} from 'lucide-react';



const randomDigits = () => Math.floor(100000 + Math.random() * 900000);
const todayStr = () => new Date().toISOString().split('T')[0];

const statusBadge = (status) =>
  status === 'active'
    ? <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full font-semibold">Active</span>
    : <span className="bg-error/10 text-error text-xs px-2 py-0.5 rounded-full font-semibold">Expired</span>;

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
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




const MemberProfileModal = ({ member, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [monthlyHours, setMonthlyHours] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const sessionQ = query(
          collection(db, 'sessions'),
          where('memberId', '==', member.id)
        );
        const snap = await getDocs(sessionQ);
        const allSessions = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.entryTime?.toDate?.() || 0) - (a.entryTime?.toDate?.() || 0));
        setTotalVisits(allSessions.length);
        setSessions(allSessions.slice(0, 10));

        const now = new Date();
        const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthSessions = allSessions.filter(s => s.sessionDate?.startsWith(thisMonthStr));
        const hrs = monthSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        setMonthlyHours(Math.round(hrs / 60 * 10) / 10);

        // Streak
        const dates = [...new Set(allSessions.map(s => s.sessionDate))].sort().reverse();
        let s = 0, d = new Date();
        d.setHours(0,0,0,0);
        for (let i = 0; i < dates.length; i++) {
          const check = new Date(d.getTime() - i * 86400000).toISOString().split('T')[0];
          if (dates[i] === check) s++;
          else break;
        }
        setStreak(s);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [member.id]);

  const startDate = member.startDate?.toDate?.() ?? new Date();

  const endDate = member.endDate?.toDate?.() ?? new Date();
  const totalDays = (endDate - startDate) / 86400000;
  const daysElapsed = Math.min((new Date() - startDate) / 86400000, totalDays);
  const progressPercent = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / 86400000));

  return (
    <Modal title={member.name} onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Phone', member.phone], 
              ['Email', member.email], 
              ['Amount Paid', member.price ? `₹${member.price}` : (member.planName || '—')], 
              ['Duration', member.durationDays ? `${member.durationDays} Days` : '—'],
              ['Status', member.status === 'active' ? '✅ Active' : '❌ Expired']
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-muted text-xs mb-0.5">{k}</p>
                <p className="text-white font-medium">{v}</p>
              </div>
            ))}

          </div>


          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{startDate.toLocaleDateString('en-IN')}</span>
              <span>{daysLeft} days left</span>
              <span>{endDate.toLocaleDateString('en-IN')}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[['Total Visits', totalVisits], ['Hours This Month', monthlyHours], ['Visit Streak', `${streak}d`]].map(([k, v]) => (
              <div key={k} className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-primary">{v}</p>
                <p className="text-muted text-xs leading-tight mt-1">{k}</p>
              </div>
            ))}
          </div>

          {/* Last 10 Sessions */}

          <div>
            <p className="text-muted text-xs mb-2">Last 10 Sessions</p>
            {sessions.length === 0 ? (
              <p className="text-muted text-sm text-center py-3">No sessions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted border-b border-border">
                      <th className="pb-2 text-left">Date</th>
                      <th className="pb-2 text-left">Entry</th>
                      <th className="pb-2 text-left">Exit</th>
                      <th className="pb-2 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.map(s => (
                      <tr key={s.id} className="text-white">
                        <td className="py-1.5">{s.sessionDate}</td>
                        <td className="py-1.5">{s.entryTime?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) || '—'}</td>
                        <td className="py-1.5">{s.exitTime?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) || '—'}</td>
                        <td className="py-1.5">{s.durationMinutes ? `${s.durationMinutes}m` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

const MemberFormModal = ({ editingMember, onClose, onSaved }) => {
  const [form, setForm] = useState({ 
    name: editingMember?.name || '', 
    phone: editingMember?.phone || '', 
    email: editingMember?.email || '', 
    price: editingMember?.price || '',
    durationDays: editingMember?.durationDays || '30',
    startDate: editingMember?.startDate?.toDate?.() ? editingMember.startDate.toDate().toISOString().split('T')[0] : todayStr() 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const price = Number(form.price);
    const duration = Number(form.durationDays);

    if (isNaN(price) || price < 0) { setError('Please enter a valid amount.'); return; }
    if (isNaN(duration) || duration <= 0) { setError('Please enter a valid duration.'); return; }

    setLoading(true);
    try {
      const startDate = new Date(form.startDate);
      startDate.setHours(0,0,0,0);
      const endDate = new Date(startDate.getTime() + duration * 86400000);
      const status = endDate >= new Date() ? 'active' : 'expired';

      const memberData = {
        name: form.name, 
        phone: form.phone, 
        email: form.email,
        price,
        durationDays: duration,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        status,
        updatedAt: Timestamp.fromDate(new Date()),
      };


      if (editingMember) {
        await updateDoc(doc(db, 'members', editingMember.id), memberData);
      } else {
        await addDoc(collection(db, 'members'), {
          ...memberData,
          qrValue: '',
          createdAt: Timestamp.fromDate(new Date()),
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(`Failed to ${editingMember ? 'update' : 'add'} member. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-secondary border border-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors";

  return (
    <Modal title={editingMember ? "Edit Member" : "Add New Member"} onClose={onClose}>
      {error && <div className="mb-4 bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {[['name', 'Full Name', 'text', 'John Doe'], ['phone', 'Phone', 'tel', '9876543210'], ['email', 'Email', 'email', 'john@example.com']].map(([field, label, type, placeholder]) => (
          <div key={field}>
            <label className="text-muted text-sm mb-1 block">{label}</label>
            <input type={type} required placeholder={placeholder} value={form[field]}
              onChange={e => setForm({ ...form, [field]: e.target.value })}
              className={inputClass} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-muted text-sm mb-1 block">Amount (₹)</label>
            <input type="number" required placeholder="500" value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className="text-muted text-sm mb-1 block">Duration (Days)</label>
            <input type="number" required placeholder="30" value={form.durationDays}
              onChange={e => setForm({ ...form, durationDays: e.target.value })}
              className={inputClass} />
          </div>
        </div>
        <div>
          <label className="text-muted text-sm mb-1 block">Start Date</label>
          <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
            required className={inputClass} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-muted hover:text-white border border-border rounded-lg transition-colors">Cancel</button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? (editingMember ? 'Saving...' : 'Adding...') : (editingMember ? 'Save Changes' : 'Add Member')}
          </button>
        </div>
      </form>
    </Modal>
  );
};


const Members = () => {
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
      const membersSnap = await getDocs(collection(db, 'members'));
      setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError('Failed to load members.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = members.sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
    .filter(m =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search)
    );


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-primary" /> Members
          </h1>
          <p className="text-muted text-sm mt-1">{members.length} total members</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="add-member-btn"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {error && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase tracking-wide">
                  {['Name', 'Phone', 'Amount', 'Duration', 'Status', 'Days Left', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-10 text-sm">No members found.</td>
                  </tr>
                ) : filtered.map(m => {
                  const daysLeft = m.endDate ? Math.max(0, Math.ceil((m.endDate.toDate() - new Date()) / 86400000)) : 0;
                  return (
                    <tr key={m.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-3 text-white text-sm font-medium">{m.name}</td>
                      <td className="px-5 py-3 text-muted text-sm">{m.phone}</td>
                      <td className="px-5 py-3 text-muted text-sm">{m.price ? `₹${m.price}` : (m.planName || '—')}</td>
                      <td className="px-5 py-3 text-muted text-sm">{m.durationDays ? `${m.durationDays}d` : '—'}</td>

                      <td className="px-5 py-3">{statusBadge(m.status)}</td>
                      <td className="px-5 py-3 text-sm text-white">{m.status === 'active' ? `${daysLeft}d` : '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setViewMember(m)}
                            className="flex items-center gap-1.5 text-xs text-muted hover:text-primary border border-border hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button onClick={() => setEditingMember(m)}
                            className="flex items-center gap-1.5 text-xs text-muted hover:text-primary border border-border hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <p className="text-muted text-sm text-center py-8">No members found.</p>
            ) : filtered.map(m => {
              const daysLeft = m.endDate ? Math.max(0, Math.ceil((m.endDate.toDate() - new Date()) / 86400000)) : 0;
              return (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{m.name}</p>
                    <p className="text-muted text-xs">{m.phone} · {m.price ? `₹${m.price} / ${m.durationDays}d` : (m.planName || '—')}</p>

                    <p className="text-xs mt-1">{statusBadge(m.status)} {m.status === 'active' && <span className="text-muted ml-2">{daysLeft}d left</span>}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setViewMember(m)}
                      className="text-muted hover:text-primary transition-colors p-1">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditingMember(m)}
                      className="text-muted hover:text-primary transition-colors p-1">
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showAdd && <MemberFormModal onClose={() => setShowAdd(false)} onSaved={loadData} />}
      
      {editingMember && (
        <MemberFormModal 
          editingMember={editingMember} 
          onClose={() => setEditingMember(null)} 
          onSaved={loadData} 
        />
      ) }


      {viewMember && <MemberProfileModal member={viewMember} onClose={() => setViewMember(null)} />}
    </div>


  );
};

export default Members;
