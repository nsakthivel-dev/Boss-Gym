import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getDistanceMeters } from '../utils/distance';
import { 
  MapPin, XCircle, AlertTriangle, Ban, CheckCircle, 
  LogOut, Hourglass, Loader2, Dumbbell, ArrowRight, RefreshCw, Smartphone,
  Flame, ShieldCheck, Zap
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const CheckinPage = () => {
  const { settings: gymSettings, loading: settingsLoading } = useSettings();
  const [pageState, setPageState] = useState('locating');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [memberData, setMemberData] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    if (pageState === 'locating' && !settingsLoading && gymSettings) {
      verifyLocation();
    }
  }, [pageState, settingsLoading, gymSettings]);

  const verifyLocation = () => {
    if (!navigator.geolocation) {
      setPageState('location_error');
      return;
    }

    const gymLat = parseFloat(gymSettings?.latitude || 0);
    const gymLng = parseFloat(gymSettings?.longitude || 0);
    const gymRadius = parseFloat(gymSettings?.radius || 500);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceMeters(latitude, longitude, gymLat, gymLng);
        
        setDebug({
          dist: Math.round(distance),
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          gymLat,
          gymLng,
          gymRadius
        });

        if (distance <= gymRadius) {
          setPageState('form');
        } else {
          setPageState('location_outside');
        }
      },
      (error) => {
        console.log("GPS Error Code:", error.code);
        if (error.code === 1) {
          setPageState("location_denied");
        } else {
          setPageState("location_error");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleCheckin = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.trim();
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      setError('Please enter your valid 10-digit mobile number');
      return;
    }

    setError('');
    setPageState('loading');

    try {
      const q = query(collection(db, 'members'), where('phone', '==', cleanPhone));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setPageState('error_notregistered');
        return;
      }

      const memberDoc = querySnapshot.docs[0];
      const member = { id: memberDoc.id, ...memberDoc.data() };

      let todaysWorkout = null;
      try {
        const scheduleSnap = await getDocs(collection(db, 'workout_schedule'));
        const baseSchedule = scheduleSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.day - b.day);

        if (baseSchedule.length > 0 && member.workoutStartDate) {
          const start = member.workoutStartDate.toDate();
          start.setHours(0, 0, 0, 0);
          
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          
          const diffTime = todayDate.getTime() - start.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0) {
            const cycleIndex = diffDays % baseSchedule.length;
            todaysWorkout = baseSchedule[cycleIndex];
          }
        }
      } catch (workoutErr) {
        console.error("Workout fetch failed:", workoutErr);
      }

      // Check expiry
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = member.endDate?.toDate ? member.endDate.toDate() : new Date(member.endDate);
      if (endDate < today) {
        setMemberData({ name: member.name });
        setPageState('error_expired');
        return;
      }

      // Check cooldown
      const cooldownRef = doc(db, 'cooldowns', member.id);
      const cooldownSnap = await getDoc(cooldownRef);
      if (cooldownSnap.exists()) {
        const lastScan = cooldownSnap.data().lastScan;
        if (lastScan) {
          const diff = Date.now() - lastScan.toDate().getTime();
          const secondsElapsed = diff / 1000;
          if (secondsElapsed < 120) {
            setSecondsRemaining(Math.ceil(120 - secondsElapsed));
            setMemberData({ name: member.name });
            setPageState('cooldown');
            return;
          }
        }
      }

      // Update cooldown
      await setDoc(cooldownRef, { lastScan: serverTimestamp() });

      const dateStr = new Date().toISOString().split('T')[0];

      // Query open session
      const sessionQ = query(
        collection(db, 'sessions'),
        where('memberId', '==', member.id),
        where('sessionDate', '==', dateStr),
        where('status', '==', 'open')
      );
      const sessionSnapshot = await getDocs(sessionQ);

      if (sessionSnapshot.empty) {
        // Entry flow
        const entryTime = new Date();
        await addDoc(collection(db, 'sessions'), {
          memberId: member.id,
          memberName: member.name,
          sessionDate: dateStr,
          entryTime: serverTimestamp(),
          exitTime: null,
          durationMinutes: null,
          status: 'open',
          edited: false,
          editedBy: null,
          createdAt: serverTimestamp()
        });
        setMemberData({ name: member.name, entryTime });
        setWorkout(todaysWorkout);
        setPageState('success_entry');
      } else {
        // Exit flow
        const openSession = { id: sessionSnapshot.docs[0].id, ...sessionSnapshot.docs[0].data() };
        const entryTime = openSession.entryTime.toDate();
        const exitTime = new Date();
        const durationMinutes = Math.round((exitTime - entryTime) / 60000);

        await updateDoc(doc(db, 'sessions', openSession.id), {
          exitTime: serverTimestamp(),
          durationMinutes: durationMinutes,
          status: 'closed'
        });
        setMemberData({ name: member.name, entryTime, exitTime, durationMinutes });
        setPageState('success_exit');
      }
    } catch (err) {
      console.error(err);
      setPageState('form');
      alert('Something went wrong. Please try again.');
    }
  };

  // Cooldown countdown
  useEffect(() => {
    let interval;
    if (pageState === 'cooldown' && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setPageState('form');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pageState, secondsRemaining]);

  const renderHeader = () => (
    <div className="text-center mb-6">
      <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-neutral-950 shadow-gold-sm">
        <Dumbbell className="w-7 h-7" />
      </div>
      <h1 className="text-neutral-900 text-2xl font-black uppercase tracking-tight font-athletic">
        {gymSettings?.gymName || 'New Boss Gym'}
      </h1>
      <p className="text-gold-700 text-xs font-black uppercase tracking-widest mt-1 font-athletic">
        Athlete Check-in Kiosk
      </p>
      <p className="text-neutral-500 text-xs mt-1 font-medium">
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );

  const containerClass = "min-h-screen bg-[#f8f7f3] flex items-center justify-center p-4 font-sans relative overflow-hidden";
  const cardClass = "w-full max-w-[440px] bg-white border border-[#e7e2d5] rounded-3xl p-6 sm:p-8 text-center shadow-xl animate-fade-in relative z-10";

  if (pageState === 'locating') {
    return (
      <div className={containerClass}>
        <div className="absolute w-96 h-96 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className={cardClass}>
          {renderHeader()}
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-gold-50 border border-gold-300 flex items-center justify-center mb-4 text-gold-700 animate-pulse">
              <MapPin className="w-8 h-8" />
            </div>
            <h2 className="text-neutral-900 text-base font-black uppercase font-athletic">Verifying Facility Geofence</h2>
            <div className="mt-3">
              <Loader2 className="w-6 h-6 text-gold-600 animate-spin" />
            </div>
            <p className="text-neutral-500 text-xs mt-3 max-w-xs font-medium">
              Confirming you are physically at New Boss Gym premises. Please allow location access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'location_denied') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          {renderHeader()}
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-neutral-900 text-base font-black uppercase font-athletic">Location Permission Required</h2>
            <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
              To verify on-site attendance, please allow location permission for this website in your browser settings.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic active:scale-95"
            >
              Retry Location Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'location_error') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          {renderHeader()}
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-neutral-900 text-base font-black uppercase font-athletic">Location Unavailable</h2>
            <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
              Unable to read device GPS coordinates. Please ensure phone location is enabled and try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'location_outside') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          {renderHeader()}
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <Ban className="w-8 h-8" />
            </div>
            <h2 className="text-neutral-900 text-base font-black uppercase font-athletic">Outside Gym Facility</h2>
            <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
              Self attendance can only be logged when you are physically on-site at New Boss Gym.
            </p>

            {debug && (
              <div className="mt-4 p-3.5 bg-[#faf9f6] rounded-2xl border border-[#e7e2d5] text-left w-full text-[11px] text-neutral-600 font-mono">
                <p className="font-bold text-neutral-900">Current Distance: {debug.dist}m away</p>
                <p>Permitted Perimeter: {debug.gymRadius}m</p>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic active:scale-95"
            >
              Recheck GPS Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'form' || pageState === 'loading') {
    return (
      <div className={containerClass}>
        <div className="absolute w-96 h-96 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className={cardClass}>
          {renderHeader()}
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6 font-athletic">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Facility Perimeter Verified</span>
          </div>

          <form onSubmit={handleCheckin} className="space-y-5">
            <div className="text-left">
              <label className="text-[10px] font-black text-neutral-600 uppercase tracking-wider block mb-2 font-athletic">
                Athlete Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input 
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-xl font-black bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl py-4 pl-10 pr-4 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-gold-500 focus:bg-white transition-all font-mono"
                  autoFocus
                  disabled={pageState === 'loading'}
                />
              </div>
              {error && <p className="text-red-600 text-xs mt-2 text-center font-bold">{error}</p>}
            </div>

            <button 
              type="submit"
              disabled={pageState === 'loading' || phone.length < 10}
              className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-gold-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 font-athletic"
            >
              {pageState === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Athlete...
                </>
              ) : (
                <>
                  <span>Log Gym Check-In / Check-Out</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (pageState === 'success_entry') {
    const time = memberData.entryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-emerald-300`}>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 font-athletic">Workout Check-in Confirmed</span>
            <h2 className="text-2xl font-black text-neutral-900 uppercase mt-1 mb-1 font-athletic">{memberData.name}</h2>
            <p className="text-neutral-500 text-xs font-mono mb-4">Entry Timestamp: {time}</p>
            
            {workout ? (
              <div className="bg-[#171717] border border-[#2a2a2a] rounded-3xl p-5 w-full my-3 text-center text-white shadow-lg">
                <div className="flex items-center justify-center gap-1.5 mb-1 text-gold-400">
                  <Flame size={14} />
                  <span className="text-[10px] font-black tracking-widest uppercase font-athletic">
                    Today's Target Routine
                  </span>
                </div>
                <p className="text-white font-black text-lg uppercase font-athletic">{workout.title}</p>
                <p className="text-xs text-neutral-400 mt-1">{workout.muscles}</p>
              </div>
            ) : (
              <div className="bg-gold-50 border border-gold-200 text-gold-800 rounded-2xl p-4 w-full my-2 text-xs font-bold uppercase tracking-wider">
                Welcome to Boss Gym! Have a powerful session 💪
              </div>
            )}

            <button 
              onClick={() => { setPhone(''); setPageState('form'); setWorkout(null); }}
              className="mt-6 w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-colors font-athletic active:scale-95"
            >
              Done / Mark Another Athlete
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'success_exit') {
    const time = memberData.exitTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const durationStr = memberData.durationMinutes >= 60 
      ? `${Math.floor(memberData.durationMinutes / 60)}h ${memberData.durationMinutes % 60}m`
      : `${memberData.durationMinutes}m`;
    
    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-blue-300`}>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <LogOut className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 font-athletic">Workout Check-out Logged</span>
            <h2 className="text-2xl font-black text-neutral-900 uppercase mt-1 mb-1 font-athletic">{memberData.name}</h2>
            <div className="my-2 bg-blue-50 border border-blue-200 text-blue-900 px-5 py-2 rounded-full font-black text-xs font-athletic">
              Total Workout Duration: {durationStr}
            </div>
            <p className="text-neutral-500 text-xs font-mono mb-4">Exit Time: {time}</p>
            <p className="text-xs text-neutral-500 font-medium">Great training today! Rest, refuel, and recover 👋</p>
            <button 
              onClick={() => { setPhone(''); setPageState('form'); }}
              className="mt-6 w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-colors font-athletic active:scale-95"
            >
              Done / Mark Another Athlete
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'error_expired') {
    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-red-300`}>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-3">
              <XCircle className="w-7 h-7" />
            </div>
            <h2 className="text-red-700 text-lg font-black uppercase font-athletic">Membership Expired</h2>
            {memberData?.name && <p className="text-neutral-900 font-bold text-sm my-1">{memberData.name}</p>}
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs mt-1">
              Your membership cycle has ended. Please visit the front desk to renew your subscription.
            </p>
            <button 
              onClick={() => setPageState('form')}
              className="mt-6 w-full py-3.5 bg-[#faf9f6] hover:bg-neutral-100 text-neutral-900 font-bold rounded-2xl text-xs uppercase tracking-wider border border-[#e7e2d5]"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'error_notregistered') {
    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-red-300`}>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-3">
              <XCircle className="w-7 h-7" />
            </div>
            <h2 className="text-red-700 text-lg font-black uppercase font-athletic">Athlete Number Not Found</h2>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs mt-1">
              This mobile number is not registered in our gym directory. Please see the front desk staff to enrol.
            </p>
            <button 
              onClick={() => setPageState('form')}
              className="mt-6 w-full py-3.5 bg-[#faf9f6] hover:bg-neutral-100 text-neutral-900 font-bold rounded-2xl text-xs uppercase tracking-wider border border-[#e7e2d5]"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'cooldown') {
    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-amber-300`}>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
              <Hourglass className="w-7 h-7 animate-pulse" />
            </div>
            <h2 className="text-amber-800 text-lg font-black uppercase font-athletic">Already Logged Recently</h2>
            {memberData?.name && <p className="text-neutral-900 font-bold text-sm my-1">{memberData.name}</p>}
            <p className="text-gold-700 font-black text-2xl my-2 font-athletic">Wait {secondsRemaining}s</p>
            <p className="text-neutral-500 text-xs">Preventing duplicate scans. You may re-scan in a moment.</p>
            <button 
              onClick={() => setPageState('form')}
              className="mt-6 w-full py-3.5 bg-[#faf9f6] hover:bg-neutral-100 text-neutral-900 font-bold rounded-2xl text-xs uppercase tracking-wider border border-[#e7e2d5]"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CheckinPage;
