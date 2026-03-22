import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, getDocs, doc, setDoc, updateDoc, query, orderBy, Timestamp
} from 'firebase/firestore';
import { 
  Calendar, Users, ChevronLeft, ChevronRight, Edit3, Save, X, 
  Dumbbell, Coffee, Info, Loader2, Plus, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      
      if (scheduleData.length === 0) {
        // Initialize from default if empty (Simplified version of sch.txt parsing)
        const initial = Array.from({ length: 30 }, (_, i) => {
          const day = i + 1;
          let title = "PUSH DAY";
          let muscles = "Chest · Shoulders · Triceps";
          let isRest = false;
          
          if (day % 7 === 0) {
            title = "REST DAY";
            muscles = "Recovery & Stretching";
            isRest = true;
          } else if (day % 3 === 2) {
            title = "PULL DAY";
            muscles = "Back · Biceps · Rear Delts";
          } else if (day % 3 === 0) {
            title = "LEG DAY";
            muscles = "Quads · Hamstrings · Glutes · Calves";
          }
          
          return {
            day,
            title,
            muscles,
            exercises: [
              { name: "Exercise 1", sets: "3", reps: "12", notes: "Master form" },
              { name: "Exercise 2", sets: "3", reps: "12", notes: "Control tempo" }
            ],
            isRest
          };
        });
        
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
    const start = member.workoutStartDate.toDate();
    const diffTime = date.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
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
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-[#444] uppercase py-2 transition-colors">{d}</div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="aspect-square bg-white/[0.01] border border-[#1a1a1a]/50 rounded-sm"></div>;
          
          const workout = getDayWorkout(date, selectedMember);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <button
              key={i}
              onClick={() => workout && setViewingWorkout({ date, workout })}
              className={`aspect-square p-2 border rounded-sm flex flex-col items-start justify-between transition-all group ${
                workout 
                  ? workout.isRest 
                    ? 'bg-[#111] border-[#1a1a1a] hover:border-info/30' 
                    : 'bg-[#111] border-[#1a1a1a] hover:border-primary/50'
                  : 'bg-black/20 border-[#1a1a1a] opacity-40 cursor-default'
              } ${isToday ? 'scale-105 border-primary shadow-[0_0_15px_rgba(232,201,126,0.1)] z-10' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[10px] font-black ${isToday ? 'text-primary' : 'text-[#444]'}`}>{date.getDate()}</span>
                {workout && (
                  <span className={`text-[8px] font-black uppercase tracking-tighter ${workout.isRest ? 'text-info' : 'text-primary/60'}`}>
                    Day {workout.day}
                  </span>
                )}
              </div>
              {workout && (
                <div className="w-full truncate text-left pt-1">
                  <p className={`text-[8px] font-bold uppercase tracking-widest truncate ${workout.isRest ? 'text-info' : 'text-primary'}`}>
                    {workout.isRest ? 'Recovery' : workout.title.replace(' DAY', '')}
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
      for (const item of updatedSchedule) {
        await updateDoc(doc(db, 'workout_schedule', `day-${item.day}`), item);
      }
      setBaseSchedule(updatedSchedule);
      setEditingSchedule(false);
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
          <h1 className="text-4xl font-black text-primary tracking-tight uppercase">
            {selectedMember ? 'Workout Schedule' : 'Schedules'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setEditingSchedule(true)}
            className="bg-[#111] border border-[#1a1a1a] text-primary px-6 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase hover:text-white transition-all flex items-center gap-2"
          >
            <Edit3 size={14} /> Edit Master Schedule
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
        <div className="flex-1 bg-[#111] border border-[#1a1a1a] rounded-sm p-8 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#1a1a1a]">
            <div>
              <p className="text-info text-[10px] font-bold tracking-[0.3em] uppercase mb-1">Personal Calendar</p>
              <h2 className="text-2xl font-black text-primary uppercase tracking-[0.1em]">{selectedMember.name}</h2>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-2 text-[#444] hover:text-primary transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-primary font-black text-lg uppercase tracking-widest min-w-[150px] text-center">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
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
                className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] hover:text-primary transition-colors"
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
              <button onClick={() => setEditingSchedule(false)} className="p-2 text-[#444] hover:text-white transition-colors">
                <X size={24} />
              </button>
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
