import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, Timestamp
} from 'firebase/firestore';
import { 
  Calendar, ChevronLeft, ChevronRight, Edit3, Save, X, 
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
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [modalExercises, setModalExercises] = useState([]);
  
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
      <div className="grid grid-cols-7 gap-1 md:gap-3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={idx} className="text-center text-[9px] md:text-[11px] font-black text-[#222] uppercase py-3 tracking-[0.2em]">
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
              onClick={() => {
                if (workout) {
                  setViewingWorkout({ date, workout });
                  setModalExercises(workout.exercises || []);
                  setIsModalEditing(false);
                }
              }}
              className={`aspect-[4/3] p-1.5 md:p-3 border rounded-sm flex flex-col items-start justify-between transition-all group relative ${
                workout 
                  ? workout.isRest 
                    ? 'bg-[#0d0d0d] border-[#1a1a1a] hover:border-info/30' 
                    : 'bg-[#0d0d0d] border-[#1a1a1a] hover:border-primary/50'
                  : 'bg-black/10 border-[#1a1a1a]/40 opacity-30 cursor-default'
              } ${isToday ? 'scale-105 border-primary shadow-[0_0_20px_rgba(232,201,126,0.1)] z-10' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[9px] md:text-[11px] font-black ${isToday ? 'text-primary' : 'text-[#333]'}`}>{date.getDate()}</span>
                {workout && (
                  <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest ${workout.isRest ? 'text-info/40' : 'text-primary/30'}`}>
                    Day {workout.day}
                  </span>
                )}
              </div>
              {workout && (
                <div className="w-full truncate text-left pt-1">
                  <p className={`text-[7px] md:text-[10px] font-black uppercase tracking-[0.1em] truncate ${workout.isRest ? 'text-info/80' : 'text-primary'}`}>
                    <span className="md:hidden">{workout.isRest ? 'R' : workout.title.charAt(0)}</span>
                    <span className="hidden md:inline">{workout.isRest ? 'Recovery' : workout.title.replace(' WORKOUT', '')}</span>
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

  const handleUpdateDayExercises = async () => {
    if (!viewingWorkout) return;
    setLoading(true);
    try {
      const updatedWorkout = {
        ...viewingWorkout.workout,
        exercises: modalExercises
      };
      
      // Update the master schedule for that day
      await setDoc(doc(db, 'workout_schedule', `day-${updatedWorkout.day}`), updatedWorkout);
      
      // Update local state
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
              className="group bg-[#111] border border-[#1a1a1a] p-6 rounded-sm text-left hover:border-primary/50 transition-all hover:translate-x-1 relative overflow-hidden flex flex-col justify-center min-h-[100px]"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/10 group-hover:bg-primary transition-colors" />
              <p className="text-sm font-black text-primary uppercase tracking-[0.1em] group-hover:tracking-[0.15em] transition-all">{m.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1 h-1 rounded-full bg-primary/30" />
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
                  {m.workoutStartDate ? `Started: ${m.workoutStartDate.toDate().toLocaleDateString('en-GB')}` : 'No start date'}
                </p>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:right-2">
                <ChevronRight size={18} className="text-primary/60" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Calendar View (Full width) */
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-5xl bg-[#111] border border-[#1a1a1a] rounded-sm p-4 md:p-10 flex flex-col shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#1a1a1a] gap-4">
              <div>
                <p className="text-primary/30 text-[9px] font-black tracking-[0.4em] uppercase mb-2">Member Schedule</p>
                <h2 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-[0.05em] leading-none">{selectedMember.name}</h2>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-black/40 border border-[#1a1a1a] p-1 rounded-sm">
                  <button 
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                    className="p-2 text-[#444] hover:text-primary transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="text-primary font-black text-xs md:text-sm uppercase tracking-[0.2em] min-w-[100px] md:min-w-[140px] text-center">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button 
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                    className="p-2 text-[#444] hover:text-primary transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="text-[9px] font-black text-[#333] uppercase tracking-[0.3em] hover:text-primary transition-all px-2 py-3 border-l border-[#1a1a1a]"
                >
                  Today
                </button>
              </div>
            </div>
            <div className="flex-1">
              {renderCalendar()}
            </div>
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
              <div className="flex items-center gap-2">
                {!viewingWorkout.workout.isRest && (
                  <button 
                    onClick={() => setIsModalEditing(!isModalEditing)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all ${
                      isModalEditing 
                        ? 'bg-primary text-black' 
                        : 'text-[#444] hover:text-primary border border-[#1a1a1a] hover:border-primary/30'
                    }`}
                    title="Edit Exercises"
                  >
                    <Edit3 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                      {isModalEditing ? 'Finish' : 'Edit'}
                    </span>
                  </button>
                )}
                <button onClick={() => setViewingWorkout(null)} className="p-2 text-[#444] hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="grid grid-cols-12 w-full text-[10px] font-bold text-[#444] uppercase tracking-widest px-2">
                      <div className="col-span-6">Exercise</div>
                      <div className="col-span-2 text-center">Sets</div>
                      <div className="col-span-2 text-center">Reps</div>
                      <div className="col-span-2"></div>
                    </div>
                  </div>
                  
                  {isModalEditing ? (
                    <div className="space-y-3">
                      {modalExercises.map((ex, i) => (
                        <div key={i} className="grid grid-cols-12 items-center bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded-sm gap-2">
                          <div className="col-span-6">
                            <input 
                              value={ex.name}
                              onChange={e => {
                                const newExs = [...modalExercises];
                                newExs[i].name = e.target.value;
                                setModalExercises(newExs);
                              }}
                              className="bg-transparent text-xs font-bold text-primary uppercase w-full focus:outline-none"
                              placeholder="Name"
                            />
                            <input 
                              value={ex.notes}
                              onChange={e => {
                                const newExs = [...modalExercises];
                                newExs[i].notes = e.target.value;
                                setModalExercises(newExs);
                              }}
                              className="bg-transparent text-[10px] text-[#444] font-bold mt-1 w-full focus:outline-none"
                              placeholder="Notes"
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
                              className="bg-transparent text-sm font-black text-[#555] text-center w-full focus:outline-none"
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
                              className="bg-transparent text-sm font-black text-[#555] text-center w-full focus:outline-none"
                              placeholder="Reps"
                            />
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <button 
                              onClick={() => setModalExercises(modalExercises.filter((_, idx) => idx !== i))}
                              className="p-1 text-[#333] hover:text-error transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => setModalExercises([...modalExercises, { name: "", sets: "", reps: "", notes: "" }])}
                        className="w-full py-4 border-2 border-dashed border-primary/20 rounded-sm text-primary/60 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2 mt-2 bg-primary/5"
                      >
                        <Plus size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Exercise Row</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                      
                      <button 
                        onClick={() => {
                          setModalExercises([...(viewingWorkout.workout.exercises || []), { name: "", sets: "", reps: "", notes: "" }]);
                          setIsModalEditing(true);
                        }}
                        className="w-full py-5 border-2 border-dashed border-primary/30 rounded-sm text-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 mt-4 bg-primary/5 group/add"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover/add:scale-110 transition-transform">
                          <Plus size={24} className="text-primary" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Add New Exercise</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {viewingWorkout.workout.isRest && (
                <div className="bg-info/5 border border-info/10 p-6 rounded-sm text-center">
                  <p className="text-info text-xs font-bold tracking-widest uppercase">Active Recovery Day</p>
                  <p className="text-[#444] text-[10px] mt-2 leading-relaxed">Focus on light stretching, hydration, and 7-9 hours of quality sleep to maximize muscle repair.</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-[#0a0a0a] border-t border-[#1a1a1a] flex gap-4">
              {isModalEditing ? (
                <>
                  <button 
                    onClick={() => {
                      setIsModalEditing(false);
                      setModalExercises(viewingWorkout.workout.exercises || []);
                    }}
                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] border border-[#1a1a1a] text-[#555] hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateDayExercises}
                    disabled={loading}
                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] bg-primary text-black hover:bg-white transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />} Save Changes
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setViewingWorkout(null)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] bg-primary text-black hover:bg-white transition-all"
                >
                  Close View
                </button>
              )}
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

                  {/* Exercises Editing Section */}
                  {!day.isRest && (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em]">Exercises</h4>
                        <button 
                          onClick={() => {
                            const newSched = [...baseSchedule];
                            if (!newSched[idx].exercises) newSched[idx].exercises = [];
                            newSched[idx].exercises.push({ name: "", sets: "", reps: "", notes: "" });
                            setBaseSchedule(newSched);
                          }}
                          className="flex items-center gap-1 text-[8px] font-black text-primary uppercase hover:text-white transition-colors"
                        >
                          <Plus size={10} /> Add Exercise
                        </button>
                      </div>
                      <div className="space-y-2">
                        {day.exercises?.map((ex, exIdx) => (
                          <div key={exIdx} className="grid grid-cols-12 gap-2 bg-[#111] p-3 rounded-sm border border-[#1a1a1a] group/ex">
                            <div className="col-span-5">
                              <input 
                                value={ex.name}
                                onChange={e => {
                                  const newSched = [...baseSchedule];
                                  newSched[idx].exercises[exIdx].name = e.target.value;
                                  setBaseSchedule(newSched);
                                }}
                                className="w-full bg-transparent text-[10px] font-bold text-primary uppercase focus:outline-none"
                                placeholder="Exercise Name"
                              />
                              <input 
                                value={ex.notes}
                                onChange={e => {
                                  const newSched = [...baseSchedule];
                                  newSched[idx].exercises[exIdx].notes = e.target.value;
                                  setBaseSchedule(newSched);
                                }}
                                className="w-full bg-transparent text-[8px] font-bold text-[#444] mt-1 focus:outline-none"
                                placeholder="Notes (optional)"
                              />
                            </div>
                            <div className="col-span-2">
                              <input 
                                value={ex.sets}
                                onChange={e => {
                                  const newSched = [...baseSchedule];
                                  newSched[idx].exercises[exIdx].sets = e.target.value;
                                  setBaseSchedule(newSched);
                                }}
                                className="w-full bg-transparent text-[10px] font-black text-center text-[#555] focus:outline-none"
                                placeholder="Sets"
                              />
                            </div>
                            <div className="col-span-3">
                              <input 
                                value={ex.reps}
                                onChange={e => {
                                  const newSched = [...baseSchedule];
                                  newSched[idx].exercises[exIdx].reps = e.target.value;
                                  setBaseSchedule(newSched);
                                }}
                                className="w-full bg-transparent text-[10px] font-black text-center text-[#555] focus:outline-none"
                                placeholder="Reps"
                              />
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <button 
                                onClick={() => {
                                  const newSched = [...baseSchedule];
                                  newSched[idx].exercises = newSched[idx].exercises.filter((_, i) => i !== exIdx);
                                  setBaseSchedule(newSched);
                                }}
                                className="p-1 text-[#333] hover:text-error transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
