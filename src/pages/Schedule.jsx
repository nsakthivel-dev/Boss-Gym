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
    if (!member || !member.workoutStartDate) return null;
    
    const start = member.workoutStartDate.toDate();
    start.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return null;
    
    const cycleIndex = diffDays % baseSchedule.length;
    return baseSchedule[cycleIndex];
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-[#faf9f6]/40 border border-[#e7e2d5]/60 rounded-2xl" />);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isToday = new Date().toDateString() === date.toDateString();
      const workout = getDayWorkout(date, selectedMember);
      
      days.push(
        <div 
          key={d} 
          onClick={() => {
            if (workout) {
              setViewingWorkout({ date, workout });
              setModalExercises(workout.exercises || []);
              setIsModalEditing(false);
            }
          }}
          className={`min-h-[110px] p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            isToday 
              ? 'border-2 border-gold-500 bg-gold-50/20 shadow-md' 
              : 'border-[#e7e2d5] bg-white hover:border-gold-300 hover:shadow-xs'
          } ${workout ? 'hover:-translate-y-0.5' : 'opacity-60'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-black font-athletic ${isToday ? 'text-neutral-950 font-black' : 'text-neutral-700'}`}>
              {d}
            </span>
            {isToday && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500 text-neutral-950">
                Today
              </span>
            )}
          </div>

          {workout ? (
            <div className={`p-2.5 rounded-xl border text-left ${
              workout.isRest 
                ? 'bg-blue-50 border-blue-200 text-blue-900' 
                : 'bg-[#171717] border-[#2a2a2a] text-white shadow-xs'
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                {workout.isRest ? (
                  <Coffee size={12} className="text-blue-600 shrink-0" />
                ) : (
                  <Flame size={12} className="text-gold-400 shrink-0" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-tight truncate font-athletic ${workout.isRest ? 'text-blue-900' : 'text-gold-400'}`}>
                  {workout.title}
                </span>
              </div>
              <p className={`text-[9px] truncate font-medium ${workout.isRest ? 'text-blue-700' : 'text-neutral-400'}`}>
                {workout.muscles}
              </p>
            </div>
          ) : (
            <div className="text-[10px] text-neutral-400 italic">No cycle assigned</div>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 gap-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
          <div key={i} className="text-center py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 font-athletic">
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

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e7e2d5]">
        <div className="flex items-center gap-3">
          {selectedMember && (
            <button 
              onClick={() => setSelectedMember(null)}
              className="p-2.5 rounded-2xl bg-white border border-[#e7e2d5] text-neutral-600 hover:text-neutral-900 transition-colors shadow-xs active:scale-95"
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
          <div className="mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-500 font-athletic">
              Select Athlete to View Personalized Schedule
            </h2>
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
        /* Calendar View */
        <div className="bg-white border border-[#e7e2d5] rounded-3xl p-5 sm:p-7 md:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#e7e2d5]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gold-700 font-athletic">Athlete Calendar</span>
              <h2 className="text-xl md:text-2xl font-black text-neutral-900 uppercase font-athletic">{selectedMember.name}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl p-1 shadow-2xs">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black uppercase tracking-wider text-neutral-900 px-3 min-w-[120px] text-center font-athletic">
                  {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-neutral-900 text-gold-400 rounded-2xl text-xs font-bold hover:bg-neutral-800 transition-colors uppercase tracking-wider font-athletic active:scale-95"
              >
                Today
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {renderCalendar()}
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
