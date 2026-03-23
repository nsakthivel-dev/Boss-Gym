import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, Timestamp
} from 'firebase/firestore';
import { 
  Calendar, Users, ChevronLeft, ChevronRight, Edit3, Save, X, 
  Dumbbell, Coffee, Info, Loader2, Plus, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_7_DAY_CYCLE = [
  { day: 1, title: 'CHEST WORKOUT', muscles: 'Chest · Upper Chest · Lower Chest', isRest: false },
  { day: 2, title: 'BACK WORKOUT', muscles: 'Lats · Traps · Lower Back', isRest: false },
  { day: 3, title: 'SHOULDER', muscles: 'Deltoids · Rear Delts', isRest: false },
  { day: 4, title: 'BICEPS', muscles: 'Biceps Brachii · Brachialis', isRest: false },
  { day: 5, title: 'LEGS', muscles: 'Quads · Hamstrings · Glutes · Calves', isRest: false },
  { day: 6, title: 'TRICEPS', muscles: 'Long Head · Lateral Head · Medial Head', isRest: false },
  { day: 7, title: 'REST', muscles: 'Recovery & Stretching', isRest: true }
].map(item => ({
  ...item,
  exercises: [
    { name: "Main Exercise 1", sets: "4", reps: "10-12", notes: "Heavy & Controlled" },
    { name: "Secondary Exercise 1", sets: "3", reps: "12-15", notes: "Focus on squeeze" }
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
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const loadData = async () => {
    setLoading(true);
    try {
      // Load Members
      const memberSnap = await getDocs(collection(db, 'members'));
      const memberList = memberSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembers(memberList);
      
      // Load Base Schedule
      const scheduleSnap = await getDocs(query(collection(db, 'workout_schedule'), orderBy('day', 'asc')));
      let scheduleData = scheduleSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Auto-migrate if it's the old 30-day schedule or empty
      if (scheduleData.length === 0 || scheduleData.length === 30) {
        console.log("Migrating to 7-day cycle...");
        // Clear existing if any
        if (scheduleData.length === 30) {
          for (const d of scheduleSnap.docs) {
            await deleteDoc(doc(db, 'workout_schedule', d.id));
          }
        }
        
        // Initialize with the new 7-day cycle
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
    if (!member || !member.workoutStartDate) return null;
    
    // Normalize both dates to midnight to get accurate day difference
    const start = member.workoutStartDate.toDate();
    start.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return null; // Before start date
    
    const cycleIndex = diffDays % baseSchedule.length;
    return baseSchedule[cycleIndex];
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return (
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={idx} className="text-center text-[8px] md:text-[10px] font-bold text-[#444] uppercase py-2 transition-colors">
            <span className="hidden md:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
            <span className="md:hidden">{d}</span>
          </div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="aspect-square bg-white/[0.01] border border-[#1a1a1a]/50 rounded-sm"></div>;
          
          const workout = getDayWorkout(date, selectedMember);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <button
              key={i}
              onClick={() => workout && setViewingWorkout({ date, workout })}
              className={`aspect-square p-1 md:p-2 border rounded-sm flex flex-col items-start justify-between transition-all group relative ${
                workout 
                  ? workout.isRest 
                    ? 'bg-[#111] border-[#1a1a1a] hover:border-info/30' 
                    : 'bg-[#111] border-[#1a1a1a] hover:border-primary/50'
                  : 'bg-black/20 border-[#1a1a1a] opacity-40 cursor-default'
              } ${isToday ? 'scale-105 border-primary shadow-[0_0_15px_rgba(232,201,126,0.1)] z-10' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[8px] md:text-[10px] font-black ${isToday ? 'text-primary' : 'text-[#444]'}`}>{date.getDate()}</span>
                {workout && (
                  <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-tighter ${workout.isRest ? 'text-info' : 'text-primary/60'}`}>
                    <span className="hidden md:inline">Day </span>{workout.day}
                  </span>
                )}
              </div>
              {workout && (
                <div className="w-full truncate text-left pt-0.5 md:pt-1">
                  <p className={`text-[7px] md:text-[8px] font-bold uppercase tracking-widest truncate ${workout.isRest ? 'text-info' : 'text-primary'}`}>
                    <span className="md:hidden">{workout.isRest ? 'R' : workout.title.charAt(0)}</span>
                    <span className="hidden md:inline">{workout.isRest ? 'Recovery' : workout.title.replace(' DAY', '')}</span>
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const handleUpdateSchedule = async (updatedSchedule) => {
    setLoading(true);
    try {
      // Get current schedule days to identify ones to delete
      const scheduleSnap = await getDocs(collection(db, 'workout_schedule'));
      const existingDays = scheduleSnap.docs.map(d => d.id);
      
      // Upsert current schedule items
      for (const item of updatedSchedule) {
        await setDoc(doc(db, 'workout_schedule', `day-${item.day}`), item);
      }
      
      // Delete any days that are no longer in the schedule (e.g. going from 30 to 7 days)
      const updatedDayIds = updatedSchedule.map(item => `day-${item.day}`);
      const daysToDelete = existingDays.filter(id => !updatedDayIds.includes(id));
      
      for (const dayId of daysToDelete) {
        await deleteDoc(doc(db, 'workout_schedule', dayId));
      }

      setBaseSchedule(updatedSchedule);
      setEditingSchedule(false);
    } catch (err) {
      console.error("Error updating schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && baseSchedule.length === 0) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {selectedMember && (
            <button 
              onClick={() => setSelectedMember(null)}
              className="p-2 -ml-2 text-[#444] hover:text-primary transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h1 className="text-xl md:text-4xl font-black text-primary tracking-tight uppercase">
            {selectedMember ? (
              <span className="flex flex-col md:flex-row md:items-baseline gap-1">
                <span className="text-xs md:text-4xl">Workout</span>
                <span>Schedule</span>
              </span>
            ) : 'Schedules'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setEditingSchedule(true)}
            className="bg-[#111] border border-[#1a1a1a] text-primary p-2.5 md:px-6 md:py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase hover:text-white transition-all flex items-center gap-2"
          >
            <Edit3 size={14} /> <span className="hidden md:inline">Edit Master Schedule</span>
          </button>
        </div>
      </div>

      {!selectedMember ? (
        /* Members Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMember(m)}
              className="group bg-[#111] border border-[#1a1a1a] p-8 rounded-sm text-center hover:border-primary/50 transition-all hover:scale-[1.02] relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-[#0a0a0a] border border-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:border-primary/20 transition-colors">
                <Users size={24} className="text-[#333] group-hover:text-primary/40 transition-colors" />
              </div>
              <p className="text-sm font-black text-primary uppercase tracking-[0.2em]">{m.name}</p>
              <p className="text-[10px] font-bold text-[#444] mt-2 uppercase tracking-widest">
                {m.workoutStartDate ? `Started: ${m.workoutStartDate.toDate().toLocaleDateString('en-GB')}` : 'No start date'}
              </p>
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-primary/40" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Calendar View (Full width) */
        <div className="flex-1 bg-[#111] border border-[#1a1a1a] rounded-sm p-4 md:p-8 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 pb-4 md:pb-6 border-b border-[#1a1a1a] gap-4">
            <div className="text-center md:text-left">
              <p className="text-info text-[8px] md:text-[10px] font-bold tracking-[0.3em] uppercase mb-1">Personal Calendar</p>
              <h2 className="text-xl md:text-2xl font-black text-primary uppercase tracking-[0.1em]">{selectedMember.name}</h2>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex items-center justify-center gap-4 md:gap-6 bg-[#0a0a0a] md:bg-transparent p-2 md:p-0 rounded-sm w-full md:w-auto">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-2 text-[#444] hover:text-primary transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-primary font-black text-sm md:text-lg uppercase tracking-widest min-w-[80px] md:min-w-[150px] text-center">
                  {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                </h3>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-2 text-[#444] hover:text-primary transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="text-[8px] md:text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] hover:text-primary transition-colors"
              >
                Today
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderCalendar()}
          </div>
        </div>
      )}

      {/* Workout Detail Modal */}
      {viewingWorkout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111] border border-[#1a1a1a] rounded-sm shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]">
              <div>
                <p className="text-[#555] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
                  {viewingWorkout.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <h3 className={`text-2xl font-black uppercase tracking-tight ${viewingWorkout.workout.isRest ? 'text-info' : 'text-primary'}`}>
                  {viewingWorkout.workout.title}
                </h3>
              </div>
              <button onClick={() => setViewingWorkout(null)} className="p-2 text-[#444] hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-sm ${viewingWorkout.workout.isRest ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>
                  {viewingWorkout.workout.isRest ? <Coffee size={18} /> : <Dumbbell size={18} />}
                </div>
                <p className="text-[#888] text-sm font-bold tracking-wide">{viewingWorkout.workout.muscles}</p>
              </div>
              
              {!viewingWorkout.workout.isRest && (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-[#444] uppercase tracking-widest px-2">
                    <div className="col-span-6">Exercise</div>
                    <div className="col-span-2 text-center">Sets</div>
                    <div className="col-span-2 text-center">Reps</div>
                  </div>
                  {viewingWorkout.workout.exercises?.map((ex, i) => (
                    <div key={i} className="grid grid-cols-12 items-center bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded-sm group hover:border-primary/30 transition-colors">
                      <div className="col-span-6">
                        <p className="text-xs font-bold text-primary uppercase">{ex.name}</p>
                        {ex.notes && <p className="text-[10px] text-[#444] font-bold mt-1">{ex.notes}</p>}
                      </div>
                      <div className="col-span-2 text-center text-sm font-black text-[#555]">{ex.sets}</div>
                      <div className="col-span-2 text-center text-sm font-black text-[#555]">{ex.reps}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {viewingWorkout.workout.isRest && (
                <div className="bg-info/5 border border-info/10 p-6 rounded-sm text-center">
                  <p className="text-info text-xs font-bold tracking-widest uppercase">Active Recovery Day</p>
                  <p className="text-[#444] text-[10px] mt-2 leading-relaxed">Focus on light stretching, hydration, and 7-9 hours of quality sleep to maximize muscle repair.</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-[#0a0a0a] border-t border-[#1a1a1a]">
              <button 
                onClick={() => setViewingWorkout(null)}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] bg-primary text-black hover:bg-white transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Master Schedule Modal (Simplified Admin View) */}
      {editingSchedule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95">
          <div className="w-full max-w-4xl bg-[#111] border border-[#1a1a1a] rounded-sm shadow-2xl h-[90vh] flex flex-col">
            <div className="p-8 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]">
              <div>
                <h3 className="text-2xl font-black text-primary uppercase tracking-tight">Edit Master Schedule</h3>
                <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest mt-1">Changes reflect across all members</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (window.confirm("This will reset the entire schedule to the default 7-day cycle. Continue?")) {
                      setBaseSchedule(DEFAULT_7_DAY_CYCLE);
                    }
                  }}
                  className="px-4 py-2 border border-primary/20 text-primary/60 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all rounded-sm"
                >
                  Reset to 7-Day Cycle
                </button>
                <button onClick={() => setEditingSchedule(false)} className="p-2 text-[#444] hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {baseSchedule.map((day, idx) => (
                <div key={day.id || idx} className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-sm space-y-4 relative group/day">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em]">Day {day.day}</span>
                      <button 
                        onClick={() => {
                          const newSched = baseSchedule.filter((_, i) => i !== idx)
                            .map((d, i) => ({ ...d, day: i + 1 }));
                          setBaseSchedule(newSched);
                        }}
                        className="opacity-0 group-hover/day:opacity-100 p-1 text-error hover:bg-error/10 rounded transition-all"
                        title="Delete Day"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={day.isRest} 
                        onChange={e => {
                          const newSched = [...baseSchedule];
                          newSched[idx].isRest = e.target.checked;
                          newSched[idx].title = e.target.checked ? "REST DAY" : "PUSH DAY";
                          setBaseSchedule(newSched);
                        }}
                        className="w-4 h-4 accent-primary" 
                      />
                      <span className="text-[10px] font-bold text-[#555] uppercase">Rest Day</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      value={day.title} 
                      onChange={e => {
                        const newSched = [...baseSchedule];
                        newSched[idx].title = e.target.value;
                        setBaseSchedule(newSched);
                      }}
                      className="bg-[#111] border border-[#1a1a1a] p-3 text-xs font-bold text-primary uppercase focus:outline-none focus:border-primary/40 rounded-sm"
                      placeholder="Title (e.g. PUSH DAY)"
                    />
                    <input 
                      value={day.muscles} 
                      onChange={e => {
                        const newSched = [...baseSchedule];
                        newSched[idx].muscles = e.target.value;
                        setBaseSchedule(newSched);
                      }}
                      className="bg-[#111] border border-[#1a1a1a] p-3 text-xs font-bold text-[#666] focus:outline-none focus:border-primary/40 rounded-sm"
                      placeholder="Muscles (e.g. Chest · Triceps)"
                    />
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => {
                  const nextDay = baseSchedule.length + 1;
                  setBaseSchedule([...baseSchedule, {
                    day: nextDay,
                    title: "NEW WORKOUT",
                    muscles: "Add muscle groups...",
                    exercises: [],
                    isRest: false
                  }]);
                }}
                className="w-full py-6 border-2 border-dashed border-[#1a1a1a] rounded-sm text-[#444] hover:border-primary/30 hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
              >
                <Plus size={24} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Add Day {baseSchedule.length + 1}</span>
              </button>
            </div>
            <div className="p-8 bg-[#0a0a0a] border-t border-[#1a1a1a] flex gap-4">
              <button 
                onClick={() => setEditingSchedule(false)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] border border-[#1a1a1a] text-[#555] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateSchedule(baseSchedule)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] bg-primary text-black hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                <Save size={16} /> Save All Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
