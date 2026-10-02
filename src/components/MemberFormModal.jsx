import React, { useState } from 'react';
import { db } from '../firebase/config';
import { supabase } from '../supabase/config';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useSettings } from '../context/SettingsContext';
import { sendWelcomeMessage } from '../utils/whatsapp';
import { X, UserPlus, Save, Loader2, Sparkles } from 'lucide-react';

const todayStr = () => new Date().toISOString().split('T')[0];

const MemberFormModal = ({ editingMember, initialPhone = '', onClose, onSaved }) => {
  const { settings: gymSettings } = useSettings();
  const [form, setForm] = useState({
    name: editingMember?.name || '',
    phone: editingMember?.phone || initialPhone || '',
    email: editingMember?.email || '',
    price: editingMember?.price || 800,
    durationDays: editingMember?.durationDays || 30,
    startDate: editingMember?.startDate 
      ? new Date(editingMember.startDate.toDate?.() || editingMember.startDate).toISOString().split('T')[0]
      : todayStr(),
    workoutStartPreference: 'today'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.price || !form.durationDays || !form.startDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const start = new Date(form.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + Number(form.durationDays) * 86400000);

      // Workout start date based on preference
      const workoutStartDate = new Date(start);
      if (form.workoutStartPreference === 'tomorrow') {
        workoutStartDate.setDate(workoutStartDate.getDate() + 1);
      }

      const cleanPhone = form.phone.trim().replace(/\D/g, '').slice(-10);

      const memberData = {
        name: form.name.trim(),
        phone: cleanPhone,
        email: form.email.trim(),
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        workoutStartDate: Timestamp.fromDate(workoutStartDate),
        status: 'active',
        updatedAt: Timestamp.fromDate(new Date()),
      };

      let savedMember;
      if (editingMember) {
        await updateDoc(doc(db, 'members', editingMember.id), memberData);
        savedMember = { id: editingMember.id, ...memberData };
      } else {
        memberData.createdAt = Timestamp.fromDate(new Date());
        memberData.profilePictureUrl = '';
        const docRef = await addDoc(collection(db, 'members'), memberData);
        savedMember = { id: docRef.id, ...memberData };

        // Also sync to Supabase members table if available
        try {
          if (supabase) {
            await supabase.from('members').insert({
              id: docRef.id,
              name: memberData.name,
              phone: memberData.phone,
              email: memberData.email,
              price: memberData.price,
              duration_days: memberData.durationDays,
              status: memberData.status,
              created_at: new Date().toISOString()
            });
          }
        } catch (sbE) {}

        // Welcome WhatsApp
        try {
          sendWelcomeMessage(savedMember, gymSettings?.gymName);
        } catch (we) {
          console.warn("Welcome message failed:", we);
        }
      }

      if (onSaved) {
        onSaved(savedMember);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error(err);
      const isPermission = err?.code === 'permission-denied' || (err?.message && err.message.toLowerCase().includes('permission'));
      if (isPermission) {
        setError('Database permission denied: Registration requires updated Firestore rules. Please deploy the updated firestore.rules in Firebase Console.');
      } else {
        setError('Failed to save athlete record: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#faf9f6] border border-[#e7e2d5] rounded-xl px-4 py-3 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-gold-500 focus:bg-white transition-all";
  const labelClass = "text-[10px] font-black uppercase tracking-wider text-neutral-600 block mb-1 font-athletic";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white border border-[#e7e2d5] rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-[#e7e2d5] bg-gradient-to-r from-gold-50/70 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-500/20 text-gold-700 flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <h3 className="text-neutral-900 font-black text-lg uppercase tracking-tight font-athletic">
              {editingMember ? "Edit Athlete Details" : "Enrol New Athlete"}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl p-3">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Athlete Full Name *</label>
              <input 
                required 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                className={inputClass} 
                placeholder="e.g. SAKTHIVEL N" 
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input 
                  required 
                  type="tel"
                  maxLength={10}
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} 
                  className={inputClass} 
                  placeholder="e.g. 9876543210" 
                />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input 
                  type="email"
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })} 
                  className={inputClass} 
                  placeholder="athlete@example.com" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Membership Fee (₹) *</label>
                <input 
                  type="number" 
                  required 
                  value={form.price} 
                  onChange={e => setForm({ ...form, price: e.target.value })} 
                  className={inputClass} 
                  placeholder="800" 
                />
              </div>
              <div>
                <label className={labelClass}>Duration (Days) *</label>
                <input 
                  type="number" 
                  required 
                  value={form.durationDays} 
                  onChange={e => setForm({ ...form, durationDays: e.target.value })} 
                  className={inputClass} 
                  placeholder="30" 
                />
              </div>
            </div>
            
            <div>
              <label className={labelClass}>Subscription Start Date *</label>
              <input 
                type="date" 
                required 
                value={form.startDate} 
                onChange={e => setForm({ ...form, startDate: e.target.value })} 
                className={inputClass} 
              />
            </div>

            {!editingMember && (
              <div className="bg-gold-50/50 border border-gold-200/80 p-3.5 rounded-2xl space-y-2">
                <label className="text-gold-800 text-[10px] font-black tracking-wider uppercase block font-athletic">
                  Workout Cycle Commencement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, workoutStartPreference: 'today' })}
                    className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                      form.workoutStartPreference === 'today' 
                        ? 'bg-gold-500 text-neutral-950 font-black shadow-sm' 
                        : 'bg-white border border-[#e7e2d5] text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, workoutStartPreference: 'tomorrow' })}
                    className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                      form.workoutStartPreference === 'tomorrow' 
                        ? 'bg-gold-500 text-neutral-950 font-black shadow-sm' 
                        : 'bg-white border border-[#e7e2d5] text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-[#e7e2d5] text-neutral-600 hover:bg-[#faf9f6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 shadow-gold-sm transition-all disabled:opacity-50 active:scale-95 font-athletic cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingMember ? 'Save Changes' : 'Confirm Enrolment'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MemberFormModal;
