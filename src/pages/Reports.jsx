import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, query, where, getDocs, orderBy
} from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { PieChart, Download, Loader2 } from 'lucide-react';

const SectionCard = ({ title, children }) => (
  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
    <h3 className="text-white font-semibold text-base">{title}</h3>
    {children}
  </div>
);

const exportCSV = (data, filename, columns) => {
  if (!data.length) return;
  const header = columns.join(',');
  const rows = data.map(row => columns.map(col => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const ExportBtn = ({ onClick }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 text-xs text-muted hover:text-primary border border-border hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors">
    <Download className="w-3.5 h-3.5" /> Export CSV
  </button>
);

const SimpleTable = ({ cols, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border text-muted">
          {cols.map(c => <th key={c} className="py-2 text-left pr-4 font-medium">{c}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.length === 0 ? (
          <tr><td colSpan={cols.length} className="text-muted text-center py-6">No data</td></tr>
        ) : rows.map((r, i) => (
          <tr key={i} className="text-white">
            {Object.values(r).map((v, j) => <td key={j} className="py-1.5 pr-4">{v}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted">{label}</p>
      <p className="text-primary font-semibold">{payload[0].value} sessions</p>
    </div>
  );
};

const Reports = () => {
  const [loading, setLoading] = useState({});
  const todayStr = () => new Date().toISOString().split('T')[0];
  const thisMonthStr = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  };

  // Daily Report
  const [dailyDate, setDailyDate] = useState(todayStr());
  const [dailySessions, setDailySessions] = useState([]);

  const loadDailyReport = async (date) => {
    setLoading(l => ({ ...l, daily: true }));
    try {
      const q = query(collection(db, 'sessions'), where('sessionDate', '==', date));
      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.entryTime?.toDate?.() || 0) - (b.entryTime?.toDate?.() || 0));
      
      setDailySessions(data.map(s => {
        return {
          Member: s.memberName,
          Entry: s.entryTime?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) ?? '—',
          Exit: s.exitTime?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) ?? '—',
          Duration: s.durationMinutes ? `${s.durationMinutes}m` : '—',
          Status: s.status,
        };
      }));
    } finally { setLoading(l => ({ ...l, daily: false })); }
  };

  useEffect(() => { loadDailyReport(dailyDate); }, [dailyDate]);

  // Monthly Summary
  const [monthMonth, setMonthMonth] = useState(thisMonthStr());
  const [monthData, setMonthData] = useState([]);

  const loadMonthly = async (month) => {
    setLoading(l => ({ ...l, monthly: true }));
    try {
      const snap = await getDocs(collection(db, 'sessions'));
      const sessions = snap.docs.map(d => d.data()).filter(s => s.sessionDate?.startsWith(month));
      const grouped = {};
      for (const s of sessions) {
        if (!grouped[s.memberName]) grouped[s.memberName] = { Member: s.memberName, Visits: 0, 'Total Minutes': 0, 'Total Hours': 0 };
        grouped[s.memberName].Visits++;
        grouped[s.memberName]['Total Minutes'] += s.durationMinutes || 0;
        grouped[s.memberName]['Total Hours'] = `${(grouped[s.memberName]['Total Minutes'] / 60).toFixed(1)}h`;
      }
      setMonthData(Object.values(grouped).sort((a, b) => b.Visits - a.Visits));
    } finally { setLoading(l => ({ ...l, monthly: false })); }
  };

  useEffect(() => { loadMonthly(monthMonth); }, [monthMonth]);

  // Peak Hours
  const [peakDateRange, setPeakDateRange] = useState(7);
  const [peakData, setPeakData] = useState([]);

  const loadPeakHours = async (days) => {
    setLoading(l => ({ ...l, peak: true }));
    try {
      const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      const snap = await getDocs(collection(db, 'sessions'));
      const sessions = snap.docs.map(d => d.data()).filter(s => s.sessionDate >= cutoff);
      const hourCount = {};
      for (let h = 0; h < 24; h++) hourCount[h] = 0;
      for (const s of sessions) {
        const hour = s.entryTime?.toDate?.()?.getHours() ?? null;
        if (hour !== null) hourCount[hour]++;
      }
      const data = Object.entries(hourCount)
        .filter(([h]) => Number(h) >= 5 && Number(h) <= 22)
        .map(([hour, count]) => ({
          hour: `${String(hour).padStart(2, '0')}:00`,
          Sessions: count
        }));
      setPeakData(data);
    } finally { setLoading(l => ({ ...l, peak: false })); }
  };

  useEffect(() => { loadPeakHours(peakDateRange); }, [peakDateRange]);

  // Member Frequency (reuses monthly data)
  // Inactive Members
  const [inactive, setInactive] = useState([]);
  const [loadingInactive, setLoadingInactive] = useState(false);

  const loadInactive = async () => {
    setLoadingInactive(true);
    try {
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const [membersSnap, sessionsSnap] = await Promise.all([
        getDocs(collection(db, 'members')),
        getDocs(query(collection(db, 'sessions'), where('sessionDate', '>=', cutoff)))
      ]);
      const activeMemberIds = new Set(sessionsSnap.docs.map(d => d.data().memberId));
      const result = membersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => !activeMemberIds.has(m.id))
        .map(m => ({ Name: m.name, Phone: m.phone, Plan: m.planName, Status: m.status }));
      setInactive(result);
    } finally { setLoadingInactive(false); }
  };

  useEffect(() => { loadInactive(); }, []);

  // Expiry Report
  const [expiryDays, setExpiryDays] = useState(7);
  const [expiryData, setExpiryData] = useState([]);
  const [loadingExpiry, setLoadingExpiry] = useState(false);

  const loadExpiry = async (days) => {
    setLoadingExpiry(true);
    try {
      const snap = await getDocs(collection(db, 'members'));
      const cutoff = new Date(Date.now() + days * 86400000);
      const result = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.status === 'active' && m.endDate?.toDate?.() <= cutoff)
        .sort((a, b) => a.endDate.toDate() - b.endDate.toDate())
        .map(m => ({
          Name: m.name,
          Phone: m.phone,
          Plan: m.planName,
          'Expires On': m.endDate.toDate().toLocaleDateString('en-IN'),
          'Days Left': Math.max(0, Math.ceil((m.endDate.toDate() - new Date()) / 86400000)),
        }));
      setExpiryData(result);
    } finally { setLoadingExpiry(false); }
  };

  useEffect(() => { loadExpiry(expiryDays); }, [expiryDays]);

  const inputClass = "bg-secondary border border-border text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <PieChart className="text-primary" /> Reports
        </h1>
        <p className="text-muted text-sm mt-1">Analytics and data exports.</p>
      </div>

      {/* Daily Report */}
      <SectionCard title="Daily Report">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <input type="date" value={dailyDate} max={todayStr()} onChange={e => setDailyDate(e.target.value)} className={inputClass} />
          <ExportBtn onClick={() => exportCSV(dailySessions, `daily-${dailyDate}`, ['Member', 'Entry', 'Exit', 'Duration', 'Status'])} />
        </div>
        {loading.daily ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div> :
          <SimpleTable cols={['Member', 'Entry', 'Exit', 'Duration', 'Status']} rows={dailySessions} />}
      </SectionCard>

      {/* Monthly Summary */}
      <SectionCard title="Monthly Summary">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <input type="month" value={monthMonth} onChange={e => setMonthMonth(e.target.value)} className={inputClass} />
          <ExportBtn onClick={() => exportCSV(monthData, `monthly-${monthMonth}`, ['Member', 'Visits', 'Total Minutes', 'Total Hours'])} />
        </div>
        {loading.monthly ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div> :
          <SimpleTable cols={['Member', 'Visits', 'Total Minutes', 'Total Hours']} rows={monthData} />}
      </SectionCard>

      {/* Peak Hours Chart */}
      <SectionCard title="Peak Hours Chart">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <select value={peakDateRange} onChange={e => setPeakDateRange(Number(e.target.value))} className={inputClass}>
            {[7, 14, 30].map(d => <option key={d} value={d}>Last {d} days</option>)}
          </select>
          <ExportBtn onClick={() => exportCSV(peakData.map(d => ({ Hour: d.hour, Sessions: d.Sessions })), 'peak-hours', ['Hour', 'Sessions'])} />
        </div>
        {loading.peak ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div> :
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="hour" tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                <YAxis tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Sessions" fill="#e8c97e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>}
      </SectionCard>

      {/* Member Frequency */}
      <SectionCard title="Member Frequency">
        <div className="flex justify-between items-center">
          <p className="text-muted text-xs">Based on selected monthly data above</p>
          <ExportBtn onClick={() => exportCSV(monthData, `frequency-${monthMonth}`, ['Member', 'Visits', 'Total Hours'])} />
        </div>
        <SimpleTable cols={['Member', 'Visits', 'Total Hours']} rows={monthData.map(r => ({ Member: r.Member, Visits: r.Visits, 'Total Hours': r['Total Hours'] }))} />
      </SectionCard>

      {/* Inactive Members */}
      <SectionCard title="Inactive Members (no visits in 30 days)">
        <div className="flex justify-end">
          <ExportBtn onClick={() => exportCSV(inactive, 'inactive-members', ['Name', 'Phone', 'Plan', 'Status'])} />
        </div>
        {loadingInactive ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div> :
          <SimpleTable cols={['Name', 'Phone', 'Plan', 'Status']} rows={inactive} />}
      </SectionCard>

      {/* Expiry Report */}
      <SectionCard title="Expiry Report">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <select value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} className={inputClass}>
            {[7, 15, 30].map(d => <option key={d} value={d}>Within {d} days</option>)}
          </select>
          <ExportBtn onClick={() => exportCSV(expiryData, `expiry-${expiryDays}days`, ['Name', 'Phone', 'Plan', 'Expires On', 'Days Left'])} />
        </div>
        {loadingExpiry ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div> :
          <SimpleTable cols={['Name', 'Phone', 'Plan', 'Expires On', 'Days Left']} rows={expiryData} />}
      </SectionCard>
    </div>
  );
};

export default Reports;
