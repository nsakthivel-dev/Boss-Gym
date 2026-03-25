import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, 
  serverTimestamp, Timestamp 
} from 'firebase/firestore';
import { getDistanceMeters } from '../utils/distance';
import { 
  MapPin, XCircle, AlertTriangle, Ban, CheckCircle, 
  LogOut, Hourglass, Loader2 
} from 'lucide-react';

const CheckinPage = () => {
  const [pageState, setPageState] = useState('locating');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [memberData, setMemberData] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [debug, setDebug] = useState(null);

  const gymLat = parseFloat(import.meta.env.VITE_GYM_LATITUDE || "0");
  const gymLng = parseFloat(import.meta.env.VITE_GYM_LONGITUDE || "0");
  const gymRadius = parseInt(import.meta.env.VITE_GYM_RADIUS_METERS || "150");
  const gymName = import.meta.env.VITE_GYM_NAME || 'GYMCORE';


  useEffect(() => {
    if (pageState === 'locating') {
      verifyLocation();
    }
  }, [pageState]);


  const verifyLocation = () => {
    if (!navigator.geolocation) {
      setPageState('location_error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceMeters(latitude, longitude, gymLat, gymLng);
        
        setDebug({
          dist: Math.round(distance),
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6)
        });

        if (distance <= gymRadius) {
          setPageState('form');
        } else {
          setPageState('location_outside');
        }
      },

      (error) => {
        console.log("GPS Error Code:", error.code);
        console.log("GPS Error Message:", error.message);

        if (error.code === 1) {
          // PERMISSION_DENIED — user blocked location
          setPageState("location_denied");
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE — GPS hardware failed
          setPageState("location_error");
        } else if (error.code === 3) {
          // TIMEOUT — took too long to get location
          setPageState("location_error");
        } else {
          // UNKNOWN ERROR
          setPageState("location_error");
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }

    );
  };

  const handleCheckin = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.trim();
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setError('');
    setPageState('loading');

    try {
      // Step 4: Query member
      const q = query(collection(db, 'members'), where('phone', '==', cleanPhone));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setPageState('error_notregistered');
        return;
      }

      const memberDoc = querySnapshot.docs[0];
      const member = { id: memberDoc.id, ...memberDoc.data() };

      // Step 6: Check expiry
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = member.endDate.toDate();
      if (endDate < today) {
        setMemberData({ name: member.name });
        setPageState('error_expired');
        return;
      }

      // Step 7: Check cooldown
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

      // Step 8: Update cooldown
      await setDoc(cooldownRef, { lastScan: serverTimestamp() });

      // Step 9: Today's date string
      const dateStr = new Date().toISOString().split('T')[0];

      // Step 10: Query open session
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
        const scheduleSnap = await getDocs(query(collection(db, 'workout_schedule'), orderBy('day', 'asc')));
        const baseSchedule = scheduleSnap.docs.map(d => d.data());

        if (baseSchedule.length > 0 && member.workoutStartDate) {
          const start = member.workoutStartDate.toDate();
          start.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffTime = today.getTime() - start.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0) {
            const cycleIndex = diffDays % baseSchedule.length;
            setWorkout(baseSchedule[cycleIndex]);
          }
        }

        setMemberData({ name: member.name, entryTime });
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
    <div className="text-center mb-8">
      <h1 className="text-[#e8c97e] text-[22px] font-bold uppercase tracking-tight">{gymName}</h1>
      <p className="text-[#a3a3a3] text-[13px]">Gym Attendance</p>
      <p className="text-[#a3a3a3] text-[13px] mt-1">
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );

  const containerClass = "min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 font-sans";
  const cardClass = "w-full max-w-[420px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[12px] p-6 text-center shadow-2xl";

  if (pageState === 'locating') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          {renderHeader()}
          <div className="flex flex-col items-center py-8">
            <MapPin className="text-[#e8c97e] w-12 h-12 animate-pulse mb-4" />
            <h2 className="text-white text-lg font-bold">Verifying your location...</h2>
            <div className="mt-4">
              <Loader2 className="w-6 h-6 text-[#e8c97e] animate-spin" />
            </div>
            <p className="text-[#a3a3a3] text-[13px] mt-4">Please allow location access when prompted</p>
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
          <div className="flex flex-col items-center py-8">
            <XCircle className="text-[#f87171] w-12 h-12 mb-4" />
            <h2 className="text-white text-lg font-bold">Location Access Required</h2>
            <p className="text-[#a3a3a3] text-sm mt-3 px-4 leading-relaxed">
              Please enable location permission for this site in your browser settings and try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 w-full h-[52px] bg-[#2a2a2a] text-white font-bold rounded-[8px] hover:bg-[#333333] transition-colors"
            >
              Try Again
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
          <div className="flex flex-col items-center py-8">
            <AlertTriangle className="text-[#fbbf24] w-12 h-12 mb-4" />
            <h2 className="text-white text-lg font-bold">Location Error</h2>
            <p className="text-[#a3a3a3] text-sm mt-3 px-4 leading-relaxed">
              Could not get your location. Please try the following:
            </p>
            <div className="text-[#a3a3a3] text-xs mt-2 space-y-1">
              <p>1. Make sure Location is enabled in phone settings</p>
              <p>2. Allow location permission for this site in your browser</p>
              <p>3. Make sure you have internet connection</p>
              <p>4. Try again after a few seconds</p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="mt-8 w-full h-[52px] bg-[#2a2a2a] text-white font-bold rounded-[8px] hover:bg-[#333333] transition-colors"
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
          <div className="flex flex-col items-center py-8">
            <Ban className="text-[#f87171] w-12 h-12 mb-4" />
            <h2 className="text-white text-lg font-bold">You're Not at the Gym</h2>
            <p className="text-[#a3a3a3] text-sm mt-3 px-4 leading-relaxed">
              Attendance can only be marked when you are physically present at the gym.
            </p>

            {debug && (
              <div className="mt-4 p-3 bg-black/20 rounded-lg border border-border/50 text-left">
                <p className="text-[#a3a3a3] text-[10px] font-mono">DEBUG INFO:</p>
                <p className="text-white text-[11px] font-mono mt-1">Dist: {debug.dist}m (Max {gymRadius}m)</p>
                <p className="text-[#a3a3a3] text-[11px] font-mono">Your Lat: {debug.lat}</p>
                <p className="text-[#a3a3a3] text-[11px] font-mono">Your Lng: {debug.lng}</p>
                <p className="text-[#a3a3a3] text-[11px] font-mono mt-1 italic">
                  Gym: {gymLat || 'NOT SET'}, {gymLng || 'NOT SET'}
                </p>

              </div>
            )}

            <button 
              onClick={() => window.location.reload()}
              className="mt-8 w-full h-[52px] bg-[#2a2a2a] text-white font-bold rounded-[8px] hover:bg-[#333333] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'form' || pageState === 'loading') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          {renderHeader()}
          <div className="flex items-center justify-center gap-1.5 text-[#4ade80] text-xs font-medium mb-6">
            <CheckCircle className="w-3.5 h-3.5" />
            Location Verified
          </div>
          <form onSubmit={handleCheckin} className="space-y-6">
            <div className="text-left">
              <label className="text-[#a3a3a3] text-[13px] mb-2 block ml-1">Enter your registered mobile number</label>
              <input 
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-[20px] bg-[#222222] border border-[#2a2a2a] rounded-[8px] p-[14px] text-white placeholder-[#555] focus:outline-none focus:border-[#e8c97e] transition-colors"
                autoFocus
                disabled={pageState === 'loading'}
              />
              {error && <p className="text-[#f87171] text-xs mt-2 text-center">{error}</p>}
            </div>
            <button 
              type="submit"
              disabled={pageState === 'loading' || phone.length < 10}
              className="w-full h-[52px] bg-[#e8c97e] text-[#0f0f0f] font-bold rounded-[8px] text-[16px] hover:bg-[#d9bc70] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pageState === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : 'Mark Attendance'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (pageState === 'success_entry') {
    const time = memberData.entryTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return (
      <div className={containerClass}>
        <div className={`${cardClass} bg-[#052e16] border-[#4ade80] !p-8`}>
          <div className="flex flex-col items-center">
            <CheckCircle className="text-[#4ade80] w-[56px] h-[56px] mb-4" />
            <h2 className="text-[#4ade80] text-[28px] font-bold tracking-[3px] mb-2 uppercase">ENTRY</h2>
            <p className="text-white text-[26px] font-bold mb-1">{memberData.name}</p>
            <p className="text-[#a3a3a3] text-[15px] mb-4">{time}</p>
            
            {workout ? (
              <div className="bg-black/20 border border-white/10 rounded-lg p-4 w-full my-4 text-center">
                <p className="text-primary text-sm font-bold tracking-widest uppercase">Today's Workout</p>
                <p className="text-white font-bold text-lg mt-1">{workout.title}</p>
                <p className="text-xs text-muted-foreground">{workout.muscles}</p>
              </div>
            ) : (
              <p className="text-[#a3a3a3] text-[14px]">Welcome! Have a great workout 💪</p>
            )}

            <button 
              onClick={() => { setPhone(''); setPageState('form'); setWorkout(null); }}
              className="mt-8 w-full h-[48px] bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-[8px] hover:bg-[#222] transition-colors"
            >
              Done / Mark Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'success_exit') {
    const time = memberData.exitTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const durationStr = memberData.durationMinutes >= 60 
      ? `${Math.floor(memberData.durationMinutes / 60)}h ${memberData.durationMinutes % 60}m`
      : `${memberData.durationMinutes}m`;
    
    return (
      <div className={containerClass}>
        <div className={`${cardClass} bg-[#0c1a2e] border-[#60a5fa] !p-8`}>
          <div className="flex flex-col items-center">
            <LogOut className="text-[#60a5fa] w-[56px] h-[56px] mb-4" />
            <h2 className="text-[#60a5fa] text-[28px] font-bold tracking-[3px] mb-2 uppercase">EXIT</h2>
            <p className="text-white text-[26px] font-bold mb-1">{memberData.name}</p>
            <p className="text-[#60a5fa] text-[20px] font-bold mb-2">{durationStr}</p>
            <p className="text-[#a3a3a3] text-[15px] mb-4">{time}</p>
            <p className="text-[#a3a3a3] text-[14px]">Great session! See you next time 👋</p>
            <button 
              onClick={() => { setPhone(''); setPageState('form'); }}
              className="mt-8 w-full h-[48px] bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-[8px] hover:bg-[#222] transition-colors"
            >
              Done / Mark Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'error_expired') {
    return (
      <div className={containerClass}>
        <div className={`${cardClass} bg-[#2d0a0a] border-[#f87171] !p-8`}>
          <div className="flex flex-col items-center">
            <XCircle className="text-[#f87171] w-[48px] h-[48px] mb-4" />
            <h2 className="text-[#f87171] text-[22px] font-bold mb-2 uppercase">Membership Expired</h2>
            {memberData?.name && <p className="text-white font-medium mb-3">{memberData.name}</p>}
            <p className="text-[#a3a3a3] text-[14px] leading-relaxed">
              Your membership has expired. Please renew at the front desk.
            </p>
            <button 
              onClick={() => setPageState('form')}
              className="mt-8 w-full h-[48px] bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-[8px] hover:bg-[#222] transition-colors"
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
        <div className={`${cardClass} bg-[#2d0a0a] border-[#f87171] !p-8`}>
          <div className="flex flex-col items-center">
            <XCircle className="text-[#f87171] w-[48px] h-[48px] mb-4" />
            <h2 className="text-[#f87171] text-[22px] font-bold mb-2 uppercase">Not Registered</h2>
            <p className="text-[#a3a3a3] text-[14px] leading-relaxed">
              This mobile number is not registered. Please contact the front desk.
            </p>
            <button 
              onClick={() => setPageState('form')}
              className="mt-8 w-full h-[48px] bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-[8px] hover:bg-[#222] transition-colors"
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
        <div className={`${cardClass} bg-[#2d2000] border-[#fbbf24] !p-8`}>
          <div className="flex flex-col items-center">
            <Hourglass className="text-[#fbbf24] w-[48px] h-[48px] mb-4 animate-spin-slow" />
            <h2 className="text-[#fbbf24] text-[22px] font-bold mb-2 uppercase">Already Marked Recently</h2>
            {memberData?.name && <p className="text-white font-medium mb-3">{memberData.name}</p>}
            <p className="text-white font-bold text-lg mb-2">Please wait {secondsRemaining} seconds</p>
            <p className="text-[#a3a3a3] text-[14px]">Scanning too quickly. Please wait.</p>
            <button 
              onClick={() => setPageState('form')}
              className="mt-8 w-full h-[48px] bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-[8px] hover:bg-[#222] transition-colors"
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
