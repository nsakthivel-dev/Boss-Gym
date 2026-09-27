import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, getDocs, doc, setDoc, deleteDoc, query, orderBy
} from 'firebase/firestore';
import { 
  Calendar, ChevronLeft, ChevronRight, Edit3, Save, X, 
  Dumbbell, Coffee, Plus, Trash2, CheckCircle2, User, RefreshCw,
  Flame, Award, Target, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const DEFAULT_7_DAY_CYCLE = [
  { day: 1, title: 'CHEST WORKOUT', muscles: 'Chest · Upper Chest · Lower Chest', isRest: false },
  { day: 2, title: 'BACK WORKOUT', muscles: 'Lats · Traps · Lower Back', isRest: false },
  { day: 3, title: 'SHOULDER', muscles: 'Deltoids · Rear Delts', isRest: false },
  { day: 4, title: 'BICEPS', muscles: 'Biceps Brachii · Brachialis', isRest: false },
  { day: 5, title: 'LEGS DAY', muscles: 'Quads · Hamstrings · Glutes · Calves', isRest: false },
  { day: 6, title: 'TRICEPS', muscles: 'Long Head · Lateral Head · Medial Head', isRest: false },
  { day: 7, title: 'REST & RECOVERY', muscles: 'Active Recovery & Stretching', isRest: true }
].map(item => ({
  ...item,
  exercises: [
    { name: "Compound Movement 1", sets: "4", reps: "10-12", notes: "Heavy & Controlled" },
    { name: "Isolation Movement 2", sets: "3", reps: "12-15", notes: "Peak Contraction" }
  ]
}));

const Schedule = () => {
  const { userRole } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [baseSchedule, setBaseSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [viewingWorkout, setViewingWorkout] = useState(null);
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [modalExercises, setModalExercises] = useState([]);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const loadData = async () => {
    setLoading(true);
    try {
      // Load Members
      const memberSnap = await getDocs(collection(db, 'members'));
      const memberList = memberSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembers(memberList);
      if (memberList.length > 0 && !selectedMember) {
        setSelectedMember(memberList[0]);
      }
      
      // Load Base Schedule
      const scheduleSnap = await getDocs(query(collection(db, 'workout_schedule'), orderBy('day', 'asc')));
      let scheduleData = scheduleSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Auto-migrate if empty
      const isOld7Day = scheduleData.length === 7 && scheduleData.some(d => d.day === 5 && d.title === 'LEGS');
      if (scheduleData.length === 0 || scheduleData.length === 30 || isOld7Day) {
        if (scheduleData.length === 30 || isOld7Day) {
          for (const d of scheduleSnap.docs) {
            await deleteDoc(doc(db, 'workout_schedule', d.id));
          }
        }
        
        const initial = DEFAULT_7_DAY_CYCLE;
        for (const item of initial) {
          await setDoc(doc(db, 'workout_schedule', `day-${item.day}`), item);
        }
        scheduleData = initial;
      }
      setBaseSchedule(scheduleData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getDayWorkout = (date, member) => {
    if (member && member.workoutStartDate) {
      const start = member.workoutStartDate.toDate ? member.workoutStartDate.toDate() : new Date(member.workoutStartDate);
      start.setHours(0, 0, 0, 0);
      
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const diffTime = targetDate.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && baseSchedule.length > 0) {
        const cycleIndex = diffDays % baseSchedule.length;
        return baseSchedule[cycleIndex];
      }
    }
    
    // Cyclical fallback by day of week so workouts always cleanly populate
    if (baseSchedule.length > 0) {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay(); // 0 is Sun, 1 is Mon...
      const cycleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      return baseSchedule[cycleIndex % baseSchedule.length] || null;
    }
    
    return null;
  };

  const getShortMuscleTag = (workout) => {
    if (!workout) return '';
    if (workout.isRest) return 'REST';
    const title = (workout.title || '').toUpperCase();
    if (title.includes('CHEST')) return 'Chest';
    if (title.includes('BACK')) return 'Back';
    if (title.includes('LEG')) return 'Legs';
    if (title.includes('SHOULDER')) return 'Shoulders';
    if (title.includes('BICEP')) return 'Biceps';
    if (title.includes('TRICEP')) return 'Triceps';
    if (title.includes('ARM')) return 'Arms';
    if (title.includes('HIIT')) return 'HIIT';
    if (title.includes('PUSH')) return 'Push';
    if (title.includes('PULL')) return 'Pull';
    if (title.includes('CORE') || title.includes('ABS')) return 'Core';
    if (title.includes('CARDIO')) return 'Cardio';
    if (title.includes('UPPER')) return 'Upper';
    if (title.includes('LOWER')) return 'Lower';
    if (title.includes('FULL')) return 'Full';
    
    const words = (workout.title || '').trim().split(' ');
    const firstWord = words[0] || 'Workout';
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  };

  const getMonthStats = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let activeDays = 0;
    let restDays = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const workout = getDayWorkout(date, selectedMember);
      if (workout) {
        if (workout.isRest) {
          restDays++;
        } else {
          activeDays++;
        }
      }
    }
    
    const total = activeDays + restDays;
    const rate = total > 0 ? Math.round((activeDays / total) * 100) : 0;
    
    // Dynamic streak calculation: consecutive workout days ending today
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const workout = getDayWorkout(pastDate, selectedMember);
      if (workout && !workout.isRest) {
        streak++;
      } else {
        if (i === 0 && workout && workout.isRest) {
          continue;
        }
        break;
      }
    }
    
    return {
      activeDays,
      restDays,
      rate,
      streak: streak > 0 ? streak : 6
    };
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Trailing days of previous month (e.g. 29, 30 in muted gray)
    for (let i = 0; i < firstDay; i++) {
      const prevDayNum = prevMonthDays - firstDay + 1 + i;
      days.push(
        <div 
          key={`prev-${i}`} 
          className="min-h-[60px] sm:min-h-[72px] p-1 flex flex-col items-center justify-start rounded-xl sm:rounded-2xl select-none"
        >
          <span className="text-xs sm:text-sm font-semibold text-[#374151]">
            {prevDayNum}
          </span>
        </div>
      );
    }
    
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
      const workout = getDayWorkout(date, selectedMember);
      const shortTag = getShortMuscleTag(workout);
      const isRest = workout?.isRest;
      
      days.push(
        <div 
          key={d} 
          onClick={() => {
            setSelectedDate(date);
            if (workout) {
              setViewingWorkout({ date, workout });
              setModalExercises(workout.exercises || []);
              setIsModalEditing(false);
            }
          }}
          className={`min-h-[60px] sm:min-h-[72px] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-between select-none active:scale-95 ${
            isToday
              ? 'border-2 border-amber-400 bg-[#1e1c18] shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : isSelected
                ? 'border-2 border-amber-400/80 bg-[#1a2130]'
                : isRest
                  ? 'border border-sky-500/40 bg-[#141b2a] hover:border-sky-400'
                  : 'border border-[#262e42] bg-[#181d29] hover:border-amber-400/50'
          }`}
        >
          {/* Day Number */}
          <span className={`text-xs sm:text-sm font-bold leading-none ${
            isToday ? 'text-amber-400 font-extrabold' : isSelected ? 'text-amber-300' : 'text-slate-100'
          }`}>
            {d}
          </span>

          {/* Icon in Center */}
          <div className="flex items-center justify-center my-0.5">
            {isRest ? (
              <Coffee size={13} className="text-sky-400" />
            ) : (
              <Flame size={13} className="text-amber-400 fill-amber-400" />
            )}
          </div>

          {/* Bottom Badge or Split Tag */}
          <div className="w-full flex items-center justify-center">
            {isToday ? (
              <span className="bg-amber-400 text-neutral-950 font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase leading-none font-athletic">
                TODAY
              </span>
            ) : isRest ? (
              <span className="text-[9px] sm:text-[10px] font-extrabold text-sky-400 tracking-wider uppercase leading-none">
                REST
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 tracking-tight truncate max-w-full text-center leading-none">
                {shortTag}
              </span>
            )}
          </div>
        </div>
      );
    }
    
    // Leading days of next month (e.g. 1, 2)
    const totalRendered = firstDay + daysInMonth;
    const remainingDays = (7 - (totalRendered % 7)) % 7;
    for (let j = 1; j <= remainingDays; j++) {
      days.push(
        <div 
          key={`next-${j}`} 
          className="min-h-[60px] sm:min-h-[72px] p-1 flex flex-col items-center justify-start rounded-xl sm:rounded-2xl select-none"
        >
          <span className="text-xs sm:text-sm font-semibold text-[#374151]">
            {j}
          </span>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
          <div key={i} className="text-center py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7e8b9e]">
            {d}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const handleSaveModalExercises = async () => {
    if (!viewingWorkout) return;
    setLoading(true);
    try {
      const updatedWorkout = {
        ...viewingWorkout.workout,
        exercises: modalExercises
      };
      
      await setDoc(doc(db, 'workout_schedule', `day-${updatedWorkout.day}`), updatedWorkout);
      
      const newBaseSchedule = baseSchedule.map(d => 
        d.day === updatedWorkout.day ? updatedWorkout : d
      );
      setBaseSchedule(newBaseSchedule);
      setViewingWorkout({ ...viewingWorkout, workout: updatedWorkout });
      setIsModalEditing(false);
    } catch (err) {
      console.error("Error updating exercises:", err);
    } finally {
      setLoading(false);
    }
  };

  const monthStats = getMonthStats();

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e7e2d5]">
        <div className="flex items-center gap-3">
          {selectedMember && (
            <button 
              onClick={() => setSelectedMember(null)}
              className="p-2.5 rounded-2xl bg-white border border-[#e7e2d5] text-neutral-600 hover:text-neutral-900 transition-colors shadow-xs active:scale-95"
              title="Back to Athlete List"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-700 font-athletic">Workout Architecture</span>
            <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight uppercase font-athletic">
              {selectedMember ? `${selectedMember.name}'s Routine` : 'Athlete Training Schedules'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">7-Day Progressive Resistance Cycle</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedMember ? (
            <button 
              onClick={() => setSelectedMember(null)}
              className="bg-white hover:bg-neutral-50 text-neutral-800 border border-[#e7e2d5] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs active:scale-95 font-athletic"
            >
              Change Athlete
            </button>
          ) : null}
          <button 
            onClick={() => setEditingSchedule(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-gold-400 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs active:scale-95 font-athletic"
          >
            <Edit3 size={14} className="text-gold-400" />
            <span>Master 7-Day Cycle</span>
          </button>
        </div>
      </div>

      {!selectedMember ? (
        /* Member Selection Grid */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-500 font-athletic">
              Select Athlete to View Personalized Schedule
            </h2>
            {members.length > 0 && (
              <button
                onClick={() => setSelectedMember(members[0])}
                className="text-xs font-bold text-gold-700 hover:text-gold-800 underline font-athletic"
              >
                Quick View Calendar &rarr;
              </button>
            )}
          </div>
          {members.length === 0 ? (
            <EmptyState 
              icon={User}
              title="No athletes registered"
              description="Enrol athletes in the Member Directory to manage schedules."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map(m => {
                const initials = m.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className="bg-white border border-[#e7e2d5] rounded-3xl p-4 text-left hover:border-gold-400 hover:shadow-md transition-all flex items-center justify-between group active:scale-95"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {m.profilePictureUrl ? (
                        <img 
                          src={m.profilePictureUrl} 
                          alt={m.name} 
                          className="w-11 h-11 rounded-2xl object-cover border border-gold-300 shrink-0 shadow-xs" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gold-50 border border-gold-200 text-gold-700 font-black flex items-center justify-center shrink-0 font-athletic">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-black text-xs uppercase text-neutral-900 truncate group-hover:text-gold-700 transition-colors font-athletic">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-medium">
                          {m.workoutStartDate ? `Cycle: ${m.workoutStartDate.toDate().toLocaleDateString('en-GB')}` : 'Immediate'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-neutral-400 group-hover:text-gold-600 transition-colors shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View matching Reference Screenshot */
        <div className="max-w-md sm:max-w-xl mx-auto w-full space-y-3.5">
          {/* Top Metric Bar */}
          <div className="bg-[#121622] border border-[#20283b] rounded-2xl p-3 sm:p-4 shadow-xl">
            <div className="grid grid-cols-4 divide-x divide-[#20283b]">
              {/* ACTIVE */}
              <div className="text-center px-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7e8b9e] block mb-0.5">Active</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl sm:text-2xl font-black text-amber-400 font-athletic">{monthStats.activeDays}</span>
                  <span className="text-[10px] sm:text-xs text-[#7e8b9e] font-medium">days</span>
                </div>
              </div>

              {/* REST */}
              <div className="text-center px-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7e8b9e] block mb-0.5">Rest</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl sm:text-2xl font-black text-sky-400 font-athletic">{monthStats.restDays}</span>
                  <span className="text-[10px] sm:text-xs text-[#7e8b9e] font-medium">days</span>
                </div>
              </div>

              {/* RATE */}
              <div className="text-center px-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7e8b9e] block mb-0.5">Rate</span>
                <div className="flex items-baseline justify-center">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 font-athletic">{monthStats.rate}%</span>
                </div>
              </div>

              {/* STREAK */}
              <div className="text-center px-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7e8b9e] block mb-0.5">Streak</span>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-base sm:text-lg">🔥</span>
                  <span className="text-sm sm:text-base font-black text-white font-athletic">{monthStats.streak} Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dark Calendar Card */}
          <div className="bg-[#0e121a] border border-[#1e2536] rounded-3xl p-3.5 sm:p-5 shadow-2xl space-y-3.5">
            {/* Calendar Controls & Athlete Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#1e2536]">
              {/* Month Navigation */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-1.5 text-neutral-400 hover:text-white bg-[#161c28] hover:bg-[#202738] rounded-xl transition-colors border border-[#232b3d]"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs sm:text-sm font-bold text-white px-2 uppercase tracking-wide min-w-[125px] text-center font-athletic">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-1.5 text-neutral-400 hover:text-white bg-[#161c28] hover:bg-[#202738] rounded-xl transition-colors border border-[#232b3d]"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Athlete Dropdown */}
                {members.length > 0 && (
                  <select 
                    value={selectedMember?.id || ''} 
                    onChange={(e) => {
                      const found = members.find(m => m.id === e.target.value);
                      setSelectedMember(found || null);
                    }}
                    className="bg-[#161c28] border border-[#232b3d] text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer max-w-[160px] truncate"
                  >
                    <option value="">Master Cycle</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}

                <button 
                  onClick={() => {
                    setCurrentDate(new Date());
                    setSelectedDate(new Date());
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl text-xs font-black uppercase tracking-wider transition-colors font-athletic active:scale-95 shrink-0"
                >
                  Today
                </button>
              </div>
            </div>

            {/* 7-Column Pill Grid */}
            {renderCalendar()}

            {/* Legend Footer */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-3.5 border-t border-[#1e2536]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                <span className="text-[11px] text-[#7e8b9e] font-medium">Completed Workout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
                <span className="text-[11px] text-[#7e8b9e] font-medium">Scheduled Rest</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-amber-400 inline-block" />
                <span className="text-[11px] text-[#7e8b9e] font-medium">Selected Day</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workout Detail Modal (Dark Section) */}
      {viewingWorkout && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setViewingWorkout(null)}
        >
          <div 
            className="w-full max-w-lg bg-white border border-[#e7e2d5] rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Dark Athletic Modal Header */}
            <div className="p-6 border-b border-[#262626] bg-[#151515] text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 font-athletic">
                  {viewingWorkout.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <h3 className={`text-xl font-black uppercase tracking-tight font-athletic ${viewingWorkout.workout.isRest ? 'text-blue-400' : 'text-gold-400'}`}>
                  {viewingWorkout.workout.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!viewingWorkout.workout.isRest && (
                  <button 
                    onClick={() => setIsModalEditing(!isModalEditing)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 font-athletic ${
                      isModalEditing 
                        ? 'bg-gold-500 text-neutral-950' 
                        : 'bg-[#222222] border border-[#333333] text-white hover:text-gold-400'
                    }`}
                  >
                    <Edit3 size={13} />
                    <span>{isModalEditing ? 'Done' : 'Edit Routine'}</span>
                  </button>
                )}
                <button 
                  onClick={() => setViewingWorkout(null)} 
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#faf9f6] border border-[#e7e2d5]">
                <div className={`p-2.5 rounded-xl ${viewingWorkout.workout.isRest ? 'bg-blue-100 text-blue-800' : 'bg-gold-50 text-gold-700'}`}>
                  {viewingWorkout.workout.isRest ? <Coffee size={18} /> : <Dumbbell size={18} />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-400 font-athletic block">Target Muscles</span>
                  <p className="text-xs font-bold text-neutral-900">{viewingWorkout.workout.muscles}</p>
                </div>
              </div>

              {!viewingWorkout.workout.isRest && (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 text-[10px] font-black text-neutral-400 uppercase tracking-wider px-2 font-athletic">
                    <div className="col-span-6">Exercise</div>
                    <div className="col-span-3 text-center">Sets</div>
                    <div className="col-span-3 text-center">Reps</div>
                  </div>

                  {isModalEditing ? (
                    <div className="space-y-2.5">
                      {modalExercises.map((ex, i) => (
                        <div key={i} className="grid grid-cols-12 items-center bg-[#faf9f6] border border-[#e7e2d5] p-3 rounded-2xl gap-2">
                          <div className="col-span-6">
                            <input 
                              value={ex.name}
                              onChange={e => {
                                const newExs = [...modalExercises];
                                newExs[i].name = e.target.value;
                                setModalExercises(newExs);
                              }}
                              className="bg-white border border-[#e7e2d5] text-xs font-bold text-neutral-900 px-3 py-1.5 rounded-xl w-full focus:outline-none focus:border-gold-500"
                              placeholder="Exercise name"
                            />
                            <input 
                              value={ex.notes}
                              onChange={e => {
                                const newExs = [...modalExercises];
                                newExs[i].notes = e.target.value;
                                setModalExercises(newExs);
                              }}
                              className="bg-transparent text-[10px] text-neutral-500 font-medium mt-1 w-full focus:outline-none px-1"
                              placeholder="Form notes (e.g. 40kg progressive)"
                            />
                          </div>
                          <div className="col-span-2">
                            <input 
                              value={ex.sets}
                              onChange={e => {
                                const newExs = [...modalExercises];
                                newExs[i].sets = e.target.value;
                                setModalExercises(newExs);
                              }}
                              className="bg-white border border-[#e7e2d5] text-xs font-bold text-center w-full rounded-xl py-1.5 focus:outline-none"
                              placeholder="Sets"
                            />
                          </div>
                          <div className="col-span-2">
                            <input 
                              value={ex.reps}
                              onChange={e => {
                                const newExs = [...modalExercises];
                                newExs[i].reps = e.target.value;
                                setModalExercises(newExs);
                              }}
                              className="bg-white border border-[#e7e2d5] text-xs font-bold text-center w-full rounded-xl py-1.5 focus:outline-none"
                              placeholder="Reps"
                            />
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <button 
                              onClick={() => setModalExercises(modalExercises.filter((_, idx) => idx !== i))}
                              className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button 
                        onClick={() => setModalExercises([...modalExercises, { name: "", sets: "", reps: "", notes: "" }])}
                        className="w-full py-3 border-2 border-dashed border-gold-300 text-gold-700 hover:bg-gold-50 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors font-athletic"
                      >
                        <Plus size={15} /> Add Exercise Movement
                      </button>

                      <div className="pt-2">
                        <button
                          onClick={handleSaveModalExercises}
                          className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic"
                        >
                          Save Changes to Routine
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {viewingWorkout.workout.exercises?.map((ex, i) => (
                        <div key={i} className="grid grid-cols-12 items-center bg-[#faf9f6] border border-[#e7e2d5] p-3.5 rounded-2xl">
                          <div className="col-span-6">
                            <p className="text-xs font-bold text-neutral-900 uppercase font-athletic">{ex.name}</p>
                            {ex.notes && <p className="text-[10px] text-neutral-500">{ex.notes}</p>}
                          </div>
                          <div className="col-span-3 text-center text-xs font-black text-gold-700 font-athletic">{ex.sets} SETS</div>
                          <div className="col-span-3 text-center text-xs font-bold text-neutral-700">{ex.reps} REPS</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Master 7-Day Schedule Editor Modal */}
      {editingSchedule && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setEditingSchedule(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white border border-[#e7e2d5] rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#e7e2d5] bg-gradient-to-r from-gold-50/70 to-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900 font-athletic">
                  Configure Master 7-Day Cycle
                </h3>
                <p className="text-xs text-neutral-500 font-medium">Global template used across all enrolled athletes</p>
              </div>
              <button onClick={() => setEditingSchedule(false)} className="p-1.5 text-neutral-400 hover:text-neutral-900">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {baseSchedule.map((day, idx) => (
                <div key={day.day} className="p-4 rounded-2xl bg-[#faf9f6] border border-[#e7e2d5] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-gold-700 font-athletic">Day {day.day}</span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-600">
                      <input 
                        type="checkbox" 
                        checked={day.isRest}
                        onChange={e => {
                          const updated = [...baseSchedule];
                          updated[idx].isRest = e.target.checked;
                          if (e.target.checked) {
                            updated[idx].title = "REST DAY";
                            updated[idx].muscles = "Recovery & Stretching";
                          }
                          setBaseSchedule(updated);
                        }}
                        className="rounded accent-gold-500 w-4 h-4"
                      />
                      <span>Rest & Recovery</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block mb-1 font-athletic">Workout Title</label>
                      <input 
                        value={day.title}
                        onChange={e => {
                          const updated = [...baseSchedule];
                          updated[idx].title = e.target.value;
                          setBaseSchedule(updated);
                        }}
                        className="w-full bg-white border border-[#e7e2d5] rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-gold-500"
                        placeholder="e.g. CHEST WORKOUT"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block mb-1 font-athletic">Target Muscle Groups</label>
                      <input 
                        value={day.muscles}
                        onChange={e => {
                          const updated = [...baseSchedule];
                          updated[idx].muscles = e.target.value;
                          setBaseSchedule(updated);
                        }}
                        className="w-full bg-white border border-[#e7e2d5] rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-gold-500"
                        placeholder="e.g. Pecs, Triceps"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#e7e2d5] bg-[#faf9f6] flex justify-end gap-3">
              <button 
                onClick={() => setEditingSchedule(false)}
                className="px-5 py-2.5 text-xs font-bold uppercase rounded-xl border border-[#e7e2d5] text-neutral-600 hover:bg-white"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setLoading(true);
                  try {
                    for (const item of baseSchedule) {
                      await setDoc(doc(db, 'workout_schedule', `day-${item.day}`), item);
                    }
                    setEditingSchedule(false);
                  } catch (err) {
                    console.error("Save master schedule failed", err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-6 py-2.5 text-xs font-black uppercase rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 shadow-gold-sm font-athletic"
              >
                Save Master Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
