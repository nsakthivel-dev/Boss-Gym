import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
  query, where, Timestamp
} from 'firebase/firestore';
import { CreditCard, Plus, Edit2, Trash2, X, Loader2, AlertTriangle } from 'lucide-react';

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

const PlanForm = ({ initial, onSubmit, onClose, loading, error }) => {
  const [form, setForm] = useState(initial ?? { name: '', durationDays: '', price: '' });
  const inputClass = "w-full bg-secondary border border-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors";
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      {error && <div className="bg-error/10 border border-error/30 text-error text-xs rounded-lg px-3 py-2">{error}</div>}
      {[['name','Plan Name','text','Monthly'], ['durationDays','Duration (days)','number','30'], ['price','Price (₹)','number','999']].map(([f, label, t, p]) => (
        <div key={f}>
          <label className="text-muted text-sm mb-1 block">{label}</label>
          <input type={t} required placeholder={p} value={form[f]}
            onChange={e => setForm({ ...form, [f]: e.target.value })}
            min={t === 'number' ? 1 : undefined}
            className={inputClass} />
        </div>
      ))}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-muted border border-border rounded-lg hover:text-white transition-colors">Cancel</button>
        <button type="submit" disabled={loading}
          className="px-5 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
        </button>
      </div>
    </form>
  );
};

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState('');

  const loadPlans = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'plans'));
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError('Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlans(); }, []);

  const handleAdd = async (form) => {
    setFormLoading(true); setFormError('');
    try {
      await addDoc(collection(db, 'plans'), {
        name: form.name,
        durationDays: Number(form.durationDays),
        price: Number(form.price),
        active: true,
        createdAt: Timestamp.fromDate(new Date()),
      });
      setShowAdd(false);
      loadPlans();
    } catch (err) {
      setFormError('Failed to add plan.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (form) => {
    setFormLoading(true); setFormError('');
    try {
      await updateDoc(doc(db, 'plans', editPlan.id), {
        name: form.name,
        durationDays: Number(form.durationDays),
        price: Number(form.price),
      });
      setEditPlan(null);
      loadPlans();
    } catch (err) {
      setFormError('Failed to update plan.');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleActive = async (plan) => {
    try {
      await updateDoc(doc(db, 'plans', plan.id), { active: !plan.active });
      setPlans(ps => ps.map(p => p.id === plan.id ? { ...p, active: !p.active } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttempt = async (plan) => {
    // Check if any member uses this plan
    const q = query(collection(db, 'members'), where('planId', '==', plan.id));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setDeleteMsg(`Cannot delete "${plan.name}" — ${snap.size} member(s) are using this plan.`);
      setDeleteConfirm(null);
      return;
    }
    setDeleteConfirm(plan);
    setDeleteMsg('');
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDoc(doc(db, 'plans', deleteConfirm.id));
      setDeleteConfirm(null);
      loadPlans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="text-primary" /> Membership Plans
          </h1>
          <p className="text-muted text-sm mt-1">Manage subscription tiers.</p>
        </div>
        <button onClick={() => { setFormError(''); setShowAdd(true); }}
          className="flex items-center gap-2 bg-primary text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      {error && <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3">{error}</div>}
      {deleteMsg && (
        <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-lg px-4 py-3 flex gap-2 items-center">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {deleteMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase tracking-wide">
                  {['Plan Name', 'Duration', 'Price', 'Active', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plans.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted py-10">No plans yet.</td></tr>
                ) : plans.map(p => (
                  <tr key={p.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3 text-white font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-muted">{p.durationDays} days</td>
                    <td className="px-5 py-3 text-white">₹{p.price}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleActive(p)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${p.active ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${p.active ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setFormError(''); setEditPlan(p); }}
                          className="text-muted hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteAttempt(p)}
                          className="text-muted hover:text-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {plans.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold">{p.name}</p>
                    <p className="text-muted text-sm">{p.durationDays} days · ₹{p.price}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleActive(p)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${p.active ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <button onClick={() => { setFormError(''); setEditPlan(p); }}
                      className="text-muted hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteAttempt(p)}
                      className="text-muted hover:text-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <Modal title="Add Plan" onClose={() => setShowAdd(false)}>
          <PlanForm onSubmit={handleAdd} onClose={() => setShowAdd(false)} loading={formLoading} error={formError} />
        </Modal>
      )}

      {editPlan && (
        <Modal title={`Edit — ${editPlan.name}`} onClose={() => setEditPlan(null)}>
          <PlanForm initial={editPlan} onSubmit={handleEdit} onClose={() => setEditPlan(null)} loading={formLoading} error={formError} />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
          <p className="text-white text-sm">Are you sure you want to delete <span className="text-primary font-semibold">{deleteConfirm.name}</span>? This cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2 text-sm text-muted border border-border rounded-lg hover:text-white transition-colors">Cancel</button>
            <button onClick={handleDelete} className="px-5 py-2 text-sm bg-error text-white font-semibold rounded-lg hover:bg-error/90 transition-colors">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Plans;
