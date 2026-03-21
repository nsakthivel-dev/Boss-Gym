import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where,
  Timestamp
} from 'firebase/firestore';
import {
  Users, Plus, Search, X, Download, Loader2, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  QrCode, MessageCircle, Check
} from 'lucide-react';
import { sendExpiryAlert, sendExpiredAlert, sendWelcomeMessage } from '../utils/whatsapp';

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
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Phone', member.phone],
            ['Email', member.email],
            ['Plan', member.price ? `₹${member.price} / ${member.durationDays}d` : (member.planName || '—')],
            ['Status', member.status === 'active' ? '✅ Active' : '❌ Expired']
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-muted text-xs mb-0.5">{k}</p>
              <p className="text-white font-medium">{v}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-4">
          <h4 className="text-white font-medium text-sm mb-3">Recent Attendance</h4>
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : sessions.length === 0 ? <p className="text-muted text-xs">No records found.</p> : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex justify-between text-xs py-1.5 border-b border-border/50">
                  <span className="text-white">{s.sessionDate}</span>
                  <span className="text-muted">{s.entryTime?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) || '—'}</span>
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
        <div className="text-center py-6 space-y-6">
          <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} />
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">Member Added Successfully!</h3>
            <p className="text-muted text-sm mt-1">Would you like to send a welcome message via WhatsApp?</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { sendWelcomeMessage(successMember); onClose(); }}
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#25D366]/90 transition-colors"
            >
              <MessageCircle size={20} /> Send Welcome WhatsApp
            </button>
            <button onClick={onClose} className="w-full text-muted hover:text-white py-2 text-sm transition-colors">
              Skip
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const inputClass = "w-full bg-secondary border border-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <Modal title={editingMember ? "Edit Member" : "Add New Member"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-error text-xs">{error}</p>}
        {[['name', 'Full Name', 'text'], ['phone', 'Phone', 'tel'], ['email', 'Email', 'email']].map(([f, l, t]) => (
          <div key={f}>
            <label className="text-muted text-xs mb-1 block">{l}</label>
            <input type={t} required value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} className={inputClass} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-muted text-xs mb-1 block">Amount (₹)</label>
            <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-muted text-xs mb-1 block">Duration (Days)</label>
            <input type="number" required value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="text-muted text-xs mb-1 block">Start Date</label>
          <input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-muted">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Processing...' : (editingMember ? 'Save Changes' : 'Add Member')}
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

  useEffect(() => { loadData(); }, []);

  const filtered = members
    .sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
    .filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-muted text-sm">{members.length} total</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Add Member
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-10 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 text-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(m => {
                  const daysLeft = m.endDate ? Math.ceil((m.endDate.toDate() - new Date()) / 86400000) : 0;
                  return (
                    <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{m.name}</td>
                      <td className="px-4 py-3 text-muted">{m.phone}</td>
                      <td className="px-4 py-3 text-muted">{m.price ? `₹${m.price} / ${m.durationDays}d` : (m.planName || '—')}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          {statusBadge(m.status)}
                          {m.status === 'active' && <span className="text-[10px] text-muted">{daysLeft}d left</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {daysLeft <= 0 ? (
                            <button onClick={() => sendExpiredAlert(m)} className="bg-[#25D366] text-white p-1.5 rounded-lg hover:bg-[#25D366]/80 flex items-center gap-1 text-[10px] font-bold"><MessageCircle size={14} /> Alert</button>
                          ) : daysLeft <= 7 ? (
                            <button onClick={() => sendExpiryAlert(m, daysLeft)} className="bg-[#25D366] text-white p-1.5 rounded-lg hover:bg-[#25D366]/80 flex items-center gap-1 text-[10px] font-bold"><MessageCircle size={14} /> Remind</button>
                          ) : (
                            <button onClick={() => sendWelcomeMessage(m)} className="bg-[#25D366] text-white p-1.5 rounded-lg hover:bg-[#25D366]/80 flex items-center gap-1 text-[10px] font-bold"><MessageCircle size={14} /> WhatsApp</button>
                          )}
                          <button onClick={() => setViewMember(m)} className="text-muted hover:text-white p-1.5"><Eye size={16} /></button>
                          <button onClick={() => setEditingMember(m)} className="text-muted hover:text-white p-1.5"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(m)} className="text-muted hover:text-error p-1.5"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map(m => {
              const daysLeft = m.endDate ? Math.ceil((m.endDate.toDate() - new Date()) / 86400000) : 0;
              return (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">{m.name}</p>
                      <p className="text-muted text-xs">{m.phone}</p>
                    </div>
                    {statusBadge(m.status)}
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted">
                    <span>{m.price ? `₹${m.price} / ${m.durationDays}d` : (m.planName || '—')}</span>
                    {m.status === 'active' && <span>{daysLeft}d left</span>}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <div className="flex-1">
                      {daysLeft <= 0 ? (
                        <button onClick={() => sendExpiredAlert(m)} className="w-full bg-[#25D366] text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><MessageCircle size={14} /> Send Alert</button>
                      ) : daysLeft <= 7 ? (
                        <button onClick={() => sendExpiryAlert(m, daysLeft)} className="w-full bg-[#25D366] text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><MessageCircle size={14} /> Send Reminder</button>
                      ) : (
                        <button onClick={() => sendWelcomeMessage(m)} className="w-full bg-[#25D366] text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><MessageCircle size={14} /> WhatsApp</button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setViewMember(m)} className="bg-secondary p-2 rounded-lg text-muted"><Eye size={16} /></button>
                      <button onClick={() => setEditingMember(m)} className="bg-secondary p-2 rounded-lg text-muted"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(m)} className="bg-secondary p-2 rounded-lg text-error"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showAdd && <MemberFormModal onClose={() => setShowAdd(false)} onSaved={loadData} />}
      {editingMember && <MemberFormModal editingMember={editingMember} onClose={() => setEditingMember(null)} onSaved={loadData} />}
      {viewMember && <MemberProfileModal member={viewMember} onClose={() => setViewMember(null)} />}
    </div>
  );
};

export default Members;
