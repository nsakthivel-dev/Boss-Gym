import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, query, where, getDocs
} from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { PieChart, Download, Calendar, ArrowUpRight, TrendingUp, Activity, Dumbbell } from 'lucide-react';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { getGymDateString } from '../utils/workoutSchedule';

const SectionCard = ({ title, subtitle, action, children }) => (
  <div className="bg-white border border-[#e7e2d5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xs space-y-4 sm:space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[#e7e2d5]">
      <div>
        <h3 className="text-neutral-900 font-black text-sm sm:text-base uppercase tracking-tight font-athletic">{title}</h3>
        {subtitle && <p className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
    {children}
  </div>
);

const exportCSV = (data, filename, columns) => {
  if (!data.length) return;
  const header = columns.join(',');
  const rows = data.map(row => columns.map(col => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const ExportBtn = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="inline-flex items-center justify-center min-h-[38px] gap-2 text-xs font-black uppercase tracking-wider text-neutral-800 hover:text-gold-700 bg-white hover:bg-gold-50 border border-[#e7e2d5] hover:border-gold-300 px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95 font-athletic shrink-0 cursor-pointer"
  >
    <Download className="w-3.5 h-3.5 text-gold-600 shrink-0" />
    <span className="whitespace-nowrap">Export CSV</span>
  </button>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const count = payload[0].value ?? 0;
  return (
    <div className="bg-[#171717]/95 backdrop-blur-md border border-gold-500/50 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl text-xs text-white pointer-events-none select-none max-w-[200px]">
      <p className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] font-athletic">Day {label}</p>
      <p className="text-gold-400 font-black text-xs sm:text-sm mt-0.5 font-athletic">
        {count} {count === 1 ? 'Workout' : 'Workouts'} Logged
      </p>
    </div>
  );
};

const Reports = () => {
  const [loading, setLoading] = useState({});
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const todayStr = () => getGymDateString();
  const thisMonthStr = () => {
    return getGymDateString().slice(0, 7);
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
      
      setDailySessions(data.map(s => ({
        Member: s.memberName,
        Entry: s.entryTime?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) ?? '—',
        Exit: s.exitTime?.toDate?.()?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) ?? '—',
        Duration: s.durationMinutes ? `${s.durationMinutes}m` : '—',
        Status: s.status,
      })));
    } finally { 
      setLoading(l => ({ ...l, daily: false })); 
    }
  };

  useEffect(() => { loadDailyReport(dailyDate); }, [dailyDate]);

  // Monthly Report
  const [monthlyMonth, setMonthlyMonth] = useState(thisMonthStr());
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const loadMonthlyReport = async (month) => {
    setLoading(l => ({ ...l, monthly: true }));
    try {
      const start = `${month}-01`;
      const [y, m] = month.split('-').map(Number);
      const end = `${month}-${new Date(y, m, 0).getDate()}`;
      const q = query(
        collection(db, 'sessions'),
        where('sessionDate', '>=', start),
        where('sessionDate', '<=', end)
      );
      const snap = await getDocs(q);
      const counts = {};
      snap.docs.forEach(d => {
        const date = d.data().sessionDate;
        counts[date] = (counts[date] || 0) + 1;
      });
      const daysInMonth = new Date(y, m, 0).getDate();
      const chart = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${month}-${String(day).padStart(2, '0')}`;
        chart.push({ date: String(day), sessions: counts[dStr] || 0 });
      }
      setMonthlyChart(chart);
      setMonthlyTotal(snap.size);
    } finally { 
      setLoading(l => ({ ...l, monthly: false })); 
    }
  };

  useEffect(() => { loadMonthlyReport(monthlyMonth); }, [monthlyMonth]);

  useEffect(() => {
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        loadDailyReport(dailyDate);
        loadMonthlyReport(monthlyMonth);
      }
    };
    window.addEventListener('online', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);
    return () => {
      window.removeEventListener('online', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
    };
  }, [dailyDate, monthlyMonth]);

  // Responsive chart parameters
  const xAxisInterval = windowWidth < 380 ? 4 : windowWidth < 640 ? 2 : windowWidth < 960 ? 1 : 0;
  const chartMargin = windowWidth < 640 
    ? { top: 10, right: 6, left: -14, bottom: 4 }
    : { top: 10, right: 10, left: -10, bottom: 0 };
  const yAxisWidth = windowWidth < 640 ? 26 : 32;
  const tickFontSize = windowWidth < 640 ? 9 : 10;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e7e2d5]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-700 font-athletic">Facility Analytics</span>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight uppercase font-athletic">Performance Trends</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Workout volume, peak training days, and session history</p>
        </div>
      </div>

      {/* Monthly Attendance Chart */}
      <SectionCard 
        title="Monthly Gym Volume & Frequency"
        subtitle={`Total of ${monthlyTotal} completed sessions in ${monthlyMonth}`}
        action={
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <input
              type="month"
              value={monthlyMonth}
              onChange={e => setMonthlyMonth(e.target.value)}
              className="flex-1 sm:flex-none min-w-[130px] min-h-[38px] bg-[#faf9f6] border border-[#e7e2d5] text-xs font-bold text-neutral-900 rounded-xl px-3 py-2 focus:outline-none focus:border-gold-400 font-sans"
            />
            <ExportBtn onClick={() => exportCSV(monthlyChart, `boss_gym_monthly_${monthlyMonth}`, ['date', 'sessions'])} />
          </div>
        }
      >
        <div className="h-60 sm:h-72 w-full min-w-0 pt-2 sm:pt-4 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChart} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece2" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: tickFontSize, fill: '#71717a' }} 
                stroke="#e7e2d5" 
                interval={xAxisInterval}
                tickMargin={4}
              />
              <YAxis 
                tick={{ fontSize: tickFontSize, fill: '#71717a' }} 
                stroke="#e7e2d5" 
                allowDecimals={false} 
                width={yAxisWidth}
                tickMargin={2}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(201, 162, 39, 0.12)' }}
                isAnimationActive={false}
                wrapperStyle={{ zIndex: 40, outline: 'none', pointerEvents: 'none' }}
              />
              <Bar 
                dataKey="sessions" 
                fill="#c9a227" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Daily Breakdown Section */}
      <SectionCard 
        title="Daily Athlete Attendance Breakdown"
        subtitle={`Detailed workout sessions for ${dailyDate}`}
        action={
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <input
              type="date"
              value={dailyDate}
              onChange={e => setDailyDate(e.target.value)}
              className="flex-1 sm:flex-none min-w-[130px] min-h-[38px] bg-[#faf9f6] border border-[#e7e2d5] text-xs font-bold text-neutral-900 rounded-xl px-3 py-2 focus:outline-none focus:border-gold-400 font-sans"
            />
            <ExportBtn onClick={() => exportCSV(dailySessions, `boss_gym_daily_${dailyDate}`, ['Member', 'Entry', 'Exit', 'Duration', 'Status'])} />
          </div>
        }
      >
        {loading.daily ? (
          <TableSkeleton rows={4} cols={5} />
        ) : dailySessions.length === 0 ? (
          <EmptyState 
            icon={Calendar}
            title="No records found"
            description={`No attendance sessions logged for ${dailyDate}.`}
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#e7e2d5] bg-[#faf9f6] text-[10px] font-black uppercase tracking-wider text-neutral-500 font-athletic">
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Check-in Time</th>
                  <th className="py-3 px-4">Check-out Time</th>
                  <th className="py-3 px-4">Workout Duration</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece2]">
                {dailySessions.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gold-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-neutral-900 uppercase font-athletic">{row.Member}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-700">{row.Entry}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-700">{row.Exit}</td>
                    <td className="py-3.5 px-4 font-black text-neutral-900">{row.Duration}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        row.Status === 'open' 
                          ? 'bg-blue-100 text-blue-800' 
                          : row.Status === 'no-exit' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {row.Status === 'open' ? 'Active' : row.Status === 'no-exit' ? 'Auto-closed' : 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default Reports;
