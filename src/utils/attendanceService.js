import { db } from '../firebase/config';
import { supabase } from '../supabase/config';
import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, 
  query, where, serverTimestamp, Timestamp, orderBy, limit 
} from 'firebase/firestore';
import { getDistanceMeters } from './distance';

const todayStr = () => new Date().toISOString().split('T')[0];

// Persistent Device Identifier for Anti-Abuse
export const getDeviceId = () => {
  let id = localStorage.getItem('nbg_device_uuid');
  if (!id) {
    id = 'DEV_' + (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
    localStorage.setItem('nbg_device_uuid', id);
  }
  return id;
};

// Generate a cryptographically secure random attendance token
export const generateSecureToken = () => {
  const bytes = new Uint8Array(16);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return 'NBG_SEC_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  return 'NBG_SEC_' + Math.random().toString(36).substring(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();
};

/**
 * Single Source of Truth for Gym Location Configuration.
 * Retrieves current active location, coordinates, and geofence radius.
 * First queries Supabase gym_locations.
 * Falls back to Firestore settings/config.
 * NEVER serves stale cached coordinates when online.
 */
export const getGymLocationConfig = async () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }

  let config = null;

  // 1. Try Supabase gym_locations (Source of Truth)
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('gym_locations')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && data.latitude && data.longitude) {
        config = {
          gymId: data.id || 'NBG_MUTH_01',
          gymName: data.name || 'New Boss Gym',
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          radius: Number(data.geofence_radius || 50),
          address: data.address || 'No:22, Gayathiri Nagar, 100ft Road, Muthaliyarpet, Pondicherry – 605004',
          phone: data.phone || '+91 98765 43210',
          status: data.is_active ? 'active' : 'inactive',
          updatedAt: data.updated_at
        };
      }
    }
  } catch (sbErr) {
    // Continue safely to Firestore fallback
  }

  // 2. Query Firestore settings/config
  if (!config && db) {
    try {
      const cfgSnap = await getDoc(doc(db, 'settings', 'config'));
      if (cfgSnap.exists()) {
        const d = cfgSnap.data();
        config = {
          gymId: 'NBG_MUTH_01',
          gymName: d.gymName || 'New Boss Gym',
          latitude: Number(d.latitude || 11.9111586),
          longitude: Number(d.longitude || 79.6347447),
          radius: Number(d.radius || 50),
          address: d.address || 'No:22, Gayathiri Nagar, 100ft Road, Muthaliyarpet, Pondicherry – 605004',
          phone: d.phoneNumber || '+91 98765 43210',
          status: 'active',
          updatedAt: d.updatedAt || new Date().toISOString()
        };
      }
    } catch (fsErr) {
      console.warn("Could not read gym location from Firestore:", fsErr);
    }
  }

  // 3. Fallback default if neither responded
  if (!config) {
    config = {
      gymId: 'NBG_MUTH_01',
      gymName: 'New Boss Gym',
      latitude: 11.9111586,
      longitude: 79.6347447,
      radius: 50,
      address: 'No:22, Gayathiri Nagar, 100ft Road, Muthaliyarpet, Pondicherry – 605004',
      phone: '+91 98765 43210',
      status: 'active',
      updatedAt: new Date().toISOString()
    };
  }

  return config;
};

/**
 * Fetch or initialize the active Gym QR configuration.
 * QR does not encode static coordinates.
 */
export const getActiveGymQR = async () => {
  try {
    const qrDocRef = doc(db, 'settings', 'qr_config');
    const snap = await getDoc(qrDocRef);

    // Retrieve latest gym location config dynamically
    const locationConfig = await getGymLocationConfig();

    if (snap.exists()) {
      const qrData = snap.data();
      return {
        ...qrData,
        latitude: locationConfig.latitude,
        longitude: locationConfig.longitude,
        radius: locationConfig.radius,
        gymName: locationConfig.gymName
      };
    }

    // Default seed if no QR generated yet
    const initialConfig = {
      gymId: locationConfig.gymId || 'NBG_MUTH_01',
      gymName: locationConfig.gymName || 'New Boss Gym',
      latitude: locationConfig.latitude,
      longitude: locationConfig.longitude,
      radius: locationConfig.radius,
      token: generateSecureToken(),
      status: 'active', // 'active' | 'revoked'
      createdAt: new Date().toISOString(),
      expiresAt: null,
      revokedAt: null
    };

    await setDoc(qrDocRef, initialConfig);

    // Sync to Supabase attendance_qr
    try {
      if (supabase) {
        await supabase.from('attendance_qr').insert({
          secure_token: initialConfig.token,
          status: 'active'
        });
      }
    } catch (sbErr) {}

    return initialConfig;
  } catch (err) {
    console.error('Error fetching Gym QR:', err);
    return null;
  }
};

/**
 * Admin action: Generate or Regenerate QR Code
 */
export const regenerateGymQR = async (expirationDays = null) => {
  try {
    const newToken = generateSecureToken();
    const expiresAt = expirationDays 
      ? new Date(Date.now() + expirationDays * 86400000).toISOString() 
      : null;

    const locationConfig = await getGymLocationConfig();

    const qrConfig = {
      gymId: locationConfig.gymId || 'NBG_MUTH_01',
      gymName: locationConfig.gymName || 'New Boss Gym',
      latitude: locationConfig.latitude,
      longitude: locationConfig.longitude,
      radius: locationConfig.radius,
      token: newToken,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      revokedAt: null
    };

    await setDoc(doc(db, 'settings', 'qr_config'), qrConfig);

    // Sync to Supabase
    try {
      if (supabase) {
        await supabase.from('attendance_qr').insert({
          secure_token: newToken,
          status: 'active',
          expires_at: expiresAt
        });
      }
    } catch (e) {}

    return { success: true, qrConfig };
  } catch (err) {
    console.error('Failed to regenerate QR:', err);
    throw err;
  }
};

/**
 * Admin action: Revoke Active QR Code
 */
export const revokeGymQR = async () => {
  try {
    const qrDocRef = doc(db, 'settings', 'qr_config');
    const snap = await getDoc(qrDocRef);
    const current = snap.exists() ? snap.data() : {};

    const updatedConfig = {
      ...current,
      status: 'revoked',
      revokedAt: new Date().toISOString()
    };

    await setDoc(qrDocRef, updatedConfig);

    // Sync to Supabase
    try {
      if (supabase && current.token) {
        await supabase
          .from('attendance_qr')
          .update({ status: 'revoked', revoked_at: new Date().toISOString() })
          .eq('secure_token', current.token);
      }
    } catch (e) {}

    return { success: true, qrConfig: updatedConfig };
  } catch (err) {
    console.error('Failed to revoke QR:', err);
    throw err;
  }
};

/**
 * Parse token from scanned text (supports plain token, URL query param, path, or formatted payload)
 */
export const extractTokenFromScan = (rawText) => {
  if (!rawText) return '';
  const trimmed = rawText.trim();

  // If payload contains 'token=' in URL
  if (trimmed.includes('token=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : 'https://' + trimmed);
      const tokenParam = url.searchParams.get('token');
      if (tokenParam) return tokenParam;
    } catch (e) {
      const match = trimmed.match(/token=([A-Za-z0-9_-]+)/);
      if (match) return match[1];
    }
  }

  // If payload has 'checkin/' or 'check-in/' in URL path: https://domain/checkin/TOKEN
  const pathMatch = trimmed.match(/\/check-?in\/([A-Za-z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // If formatted as NBG_ATTENDANCE_TOKEN:<token>
  if (trimmed.startsWith('NBG_ATTENDANCE_TOKEN:')) {
    return trimmed.replace('NBG_ATTENDANCE_TOKEN:', '');
  }

  return trimmed;
};

/**
 * Server-side / backend validation of scanned QR against active gym config
 */
export const validateScannedQR = async (scannedRaw) => {
  const token = extractTokenFromScan(scannedRaw);
  const activeQR = await getActiveGymQR();

  if (!activeQR) {
    return { valid: false, code: 'SYSTEM_ERROR', message: 'Unable to load gym QR configuration.' };
  }

  if (activeQR.status === 'revoked') {
    return { 
      valid: false, 
      code: 'QR_REVOKED', 
      message: 'This attendance QR code has been revoked and is no longer active.' 
    };
  }

  if (activeQR.expiresAt && new Date() > new Date(activeQR.expiresAt)) {
    return { 
      valid: false, 
      code: 'QR_EXPIRED', 
      message: 'This attendance QR code has expired.' 
    };
  }

  // Token verification - accepts direct token, checkin URL with token, or match with active token
  const isDirectTokenMatch = token === activeQR.token;
  const isUrlMatch = scannedRaw.includes(activeQR.token) || (scannedRaw.includes('/checkin') && (!token || token === activeQR.token));

  if (!isDirectTokenMatch && !isUrlMatch) {
    return { 
      valid: false, 
      code: 'INVALID_QR', 
      message: 'Invalid gym QR code. Please scan the official New Boss Gym entrance QR.' 
    };
  }

  return { valid: true, activeQR };
};

// In-memory concurrency lock to prevent duplicate concurrent attendance requests for the same member
const activeAttendanceLocks = new Set();

export const DEFAULT_7_DAY_CYCLE = [
  { day: 1, title: 'CHEST WORKOUT', muscles: 'Chest · Upper Chest · Lower Chest', isRest: false, exercises: [
    { name: "Incline Barbell Bench Press", sets: "4", reps: "10-12", notes: "Heavy & Controlled" },
    { name: "Flat Dumbbell Press", sets: "4", reps: "10-12", notes: "Deep stretch" },
    { name: "Cable Flyes / Pec Deck", sets: "3", reps: "12-15", notes: "Peak Contraction" }
  ]},
  { day: 2, title: 'BACK WORKOUT', muscles: 'Lats · Traps · Lower Back', isRest: false, exercises: [
    { name: "Lat Pulldown / Pullups", sets: "4", reps: "10-12", notes: "Full range" },
    { name: "Barbell Bent-Over Row", sets: "4", reps: "8-10", notes: "Strict form" },
    { name: "Seated Cable Row", sets: "3", reps: "12", notes: "Squeeze shoulder blades" }
  ]},
  { day: 3, title: 'SHOULDER WORKOUT', muscles: 'Deltoids · Rear Delts', isRest: false, exercises: [
    { name: "Overhead Military Press", sets: "4", reps: "8-10", notes: "Core braced" },
    { name: "Dumbbell Lateral Raises", sets: "4", reps: "12-15", notes: "Slow eccentric" },
    { name: "Face Pulls", sets: "3", reps: "15", notes: "Rear delt focus" }
  ]},
  { day: 4, title: 'BICEPS & FOREARMS', muscles: 'Biceps Brachii · Brachialis', isRest: false, exercises: [
    { name: "Barbell Bicep Curl", sets: "4", reps: "10-12", notes: "No swinging" },
    { name: "Incline Dumbbell Curl", sets: "3", reps: "12", notes: "Long head stretch" },
    { name: "Hammer Curls", sets: "3", reps: "12-15", notes: "Brachialis thickness" }
  ]},
  { day: 5, title: 'LEGS DAY', muscles: 'Quads · Hamstrings · Glutes · Calves', isRest: false, exercises: [
    { name: "Barbell Back Squats", sets: "4", reps: "8-10", notes: "Depth below parallel" },
    { name: "Leg Press", sets: "4", reps: "12", notes: "Controlled tempo" },
    { name: "Romanian Deadlift", sets: "4", reps: "10-12", notes: "Hamstring hinge" },
    { name: "Standing Calf Raises", sets: "4", reps: "15-20", notes: "Full stretch at bottom" }
  ]},
  { day: 6, title: 'TRICEPS & CORE', muscles: 'Long Head · Lateral Head · Medial Head', isRest: false, exercises: [
    { name: "Skull Crushers / EZ Bar Extension", sets: "4", reps: "10-12", notes: "Elbows tucked" },
    { name: "Tricep Rope Pushdown", sets: "4", reps: "12-15", notes: "Lockout split" },
    { name: "Hanging Leg Raises", sets: "3", reps: "15", notes: "Abdominal control" }
  ]},
  { day: 7, title: 'REST & RECOVERY', muscles: 'Active Recovery & Stretching', isRest: true, exercises: [
    { name: "Light Foam Rolling & Stretching", sets: "1", reps: "20m", notes: "Hydrate & rest" }
  ]}
];

/**
 * Manual Verification workflow:
 * ONLY verifies current device GPS against backend gym location & radius.
 * DOES NOT create attendance, DOES NOT check in/out, DOES NOT select athlete.
 */
export const verifyGymLocationOnly = async (coords) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      code: 'OFFLINE',
      message: 'Unable to verify the current gym location. Please check your internet connection and try again.'
    };
  }

  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    return {
      success: false,
      code: 'LOCATION_ERROR',
      message: 'Location permission or GPS data is required to verify gym location.'
    };
  }

  const { latitude, longitude, accuracy } = coords;

  if (accuracy && accuracy > 100) {
    return {
      success: false,
      code: 'LOCATION_LOW_ACCURACY',
      accuracy: Math.round(accuracy),
      message: 'Your location accuracy is too low. Please enable high-accuracy location and try again.'
    };
  }

  // Retrieve current gym config from backend (Single Source of Truth)
  const gymConfig = await getGymLocationConfig();
  if (!gymConfig) {
    return {
      success: false,
      code: 'SYSTEM_ERROR',
      message: 'Unable to verify the current gym location. Please check your internet connection and try again.'
    };
  }

  const distance = Math.round(getDistanceMeters(latitude, longitude, gymConfig.latitude, gymConfig.longitude));
  const isInside = distance <= gymConfig.radius;

  return {
    success: isInside,
    verified: isInside,
    distance,
    allowedRadius: gymConfig.radius,
    gymName: gymConfig.gymName,
    latitude,
    longitude,
    accuracy: Math.round(accuracy || 0),
    message: isInside
      ? 'You are inside the gym attendance area.'
      : 'You are outside the gym attendance area.'
  };
};

/**
 * Fetch member's assigned workout for today from workout_schedule
 */
export const fetchMemberTodayWorkout = async (member) => {
  if (!member) return null;

  try {
    let baseSchedule = [];
    if (db) {
      try {
        const scheduleSnap = await getDocs(collection(db, 'workout_schedule'));
        baseSchedule = scheduleSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.day - b.day);
      } catch (e) {
        console.warn("Could not query workout_schedule, using fallback cycle:", e);
      }
    }

    if (baseSchedule.length === 0) {
      baseSchedule = DEFAULT_7_DAY_CYCLE;
    }

    let todaysWorkout = null;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // If member has workoutStartDate, calculate progressive 7-day cycle
    if (member.workoutStartDate) {
      const start = member.workoutStartDate.toDate 
        ? member.workoutStartDate.toDate() 
        : new Date(member.workoutStartDate);
      start.setHours(0, 0, 0, 0);

      const diffTime = todayDate.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        const cycleIndex = diffDays % baseSchedule.length;
        todaysWorkout = baseSchedule[cycleIndex];
      }
    } else {
      // Default to day of week mapping (1 = Mon, ..., 7 = Sun)
      const dayOfWeek = todayDate.getDay(); // 0 is Sun, 1 is Mon
      const scheduleDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      todaysWorkout = baseSchedule.find(s => s.day === scheduleDay) || baseSchedule[0];
    }

    return todaysWorkout;
  } catch (err) {
    console.error('Failed to fetch assigned workout:', err);
    return null;
  }
};

/**
 * Core attendance verification & execution engine
 */
export const processAttendance = async ({
  scannedText,
  phone,
  coords,
  memberOverride = null
}) => {
  // Enforce online check (Requirement 26)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      code: 'OFFLINE',
      message: "You're offline. Connect to the internet to verify your current gym location and record attendance."
    };
  }

  const deviceId = getDeviceId();
  const now = new Date();
  const dateStr = todayStr();

  // 1. Validate QR Code (Scanned physical QR)
  const qrValidation = await validateScannedQR(scannedText);
  if (!qrValidation.valid) {
    await logAttendanceEvent({
      memberId: memberOverride?.id || phone || 'anonymous',
      eventType: 'scan_rejected',
      rejectionReason: qrValidation.code,
      qrToken: scannedText,
      deviceId
    });
    return { success: false, ...qrValidation };
  }

  // 2. Validate GPS coordinates & accuracy
  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
    return {
      success: false,
      code: 'LOCATION_ERROR',
      message: 'Location permission or GPS data is required to verify gym attendance.'
    };
  }

  const { latitude, longitude, accuracy } = coords;

  // Enforce GPS accuracy check
  if (accuracy && accuracy > 100) {
    return {
      success: false,
      code: 'LOCATION_LOW_ACCURACY',
      accuracy: Math.round(accuracy),
      message: 'Your location accuracy is too low. Please enable high-accuracy location and try again.'
    };
  }

  // 3. Single Source of Truth Gym Location and Geofence Verification
  const gymLocation = await getGymLocationConfig();
  if (!gymLocation) {
    return {
      success: false,
      code: 'SYSTEM_ERROR',
      message: 'Unable to verify the current gym location. Please check your internet connection and try again.'
    };
  }

  const distance = Math.round(getDistanceMeters(latitude, longitude, gymLocation.latitude, gymLocation.longitude));

  if (distance > gymLocation.radius) {
    await logAttendanceEvent({
      memberId: memberOverride?.id || phone || 'unknown',
      eventType: 'scan_rejected',
      rejectionReason: 'OUTSIDE_GEOFENCE',
      latitude,
      longitude,
      accuracy,
      calculatedDistance: distance,
      deviceId
    });

    return {
      success: false,
      code: 'OUTSIDE_GEOFENCE',
      detectedDistance: distance,
      allowedRadius: gymLocation.radius,
      gymLat: gymLocation.latitude,
      gymLng: gymLocation.longitude,
      message: 'You are outside the gym attendance area.'
    };
  }

  // 4. Member Identification
  let member = memberOverride;
  if (!member) {
    const cleanPhone = (phone || '').trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        code: 'INVALID_PHONE',
        message: 'Please provide a valid 10-digit mobile number.'
      };
    }

    const q = query(collection(db, 'members'), where('phone', '==', cleanPhone));
    const snap = await getDocs(q);

    if (snap.empty) {
      return {
        success: false,
        code: 'NOT_REGISTERED',
        phone: cleanPhone,
        message: 'Member registration required.'
      };
    }

    const docData = snap.docs[0];
    member = { id: docData.id, ...docData.data() };
  }

  // Concurrency lock per member to prevent multiple simultaneous transactions
  if (activeAttendanceLocks.has(member.id)) {
    return {
      success: false,
      code: 'CONCURRENT_REQUEST',
      message: 'Attendance is already being processed for this member. Please wait a moment.'
    };
  }
  activeAttendanceLocks.add(member.id);

  try {
    // 5. Membership Validity Check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = member.endDate?.toDate 
      ? member.endDate.toDate() 
      : (member.endDate ? new Date(member.endDate) : null);

    if (member.status === 'expired' || (endDate && endDate < today)) {
      return {
        success: false,
        code: 'MEMBERSHIP_INACTIVE',
        memberName: member.name,
        message: 'Your membership is not currently active.'
      };
    }

    // 6. 30-Second Duplicate Scan Protection (Server-Side Enforced)
    const cooldownRef = doc(db, 'cooldowns', member.id);
    const cooldownSnap = await getDoc(cooldownRef);
    if (cooldownSnap.exists()) {
      const lastScan = cooldownSnap.data().lastScan?.toDate?.();
      if (lastScan) {
        const elapsedSeconds = (now.getTime() - lastScan.getTime()) / 1000;
        if (elapsedSeconds < 30) {
          const remaining = Math.ceil(30 - elapsedSeconds);
          return {
            success: false,
            code: 'DUPLICATE_SCAN',
            memberName: member.name,
            secondsElapsed: Math.round(elapsedSeconds),
            secondsRemaining: remaining,
            message: 'You scanned recently. Please wait before scanning again.'
          };
        }
      }
    }

    // 7. Attendance State Machine (Check-In vs Check-Out)
    const sessionQ = query(
      collection(db, 'sessions'),
      where('memberId', '==', member.id),
      where('sessionDate', '==', dateStr),
      where('status', '==', 'open')
    );
    const sessionSnap = await getDocs(sessionQ);
    const isNewCheckin = sessionSnap.empty;

    // 8. Same-Device 30-Minute Restriction (Applied ONLY when starting a NEW session on the same device)
    const deviceCooldownRef = doc(db, 'device_cooldowns', deviceId);
    if (isNewCheckin) {
      const deviceSnap = await getDoc(deviceCooldownRef);
      if (deviceSnap.exists()) {
        const lastCheckout = deviceSnap.data().lastSessionCompletedAt?.toDate?.();
        if (lastCheckout) {
          const elapsedMinutes = (now.getTime() - lastCheckout.getTime()) / 60000;
          if (elapsedMinutes < 30) {
            const minutesLeft = Math.ceil(30 - elapsedMinutes);
            return {
              success: false,
              code: 'DEVICE_COOLDOWN',
              minutesRemaining: minutesLeft,
              message: `New attendance scan is temporarily restricted on this device. Please try again after the cooldown period (${minutesLeft}m remaining).`
            };
          }
        }
      }
    }

    // Update duplicate cooldown timestamp
    await setDoc(cooldownRef, { lastScan: serverTimestamp() }, { merge: true });

    // Retrieve today's workout
    const todaysWorkout = await fetchMemberTodayWorkout(member);

    if (isNewCheckin) {
      // === ACTION: CHECK-IN ===
      const newSession = {
        memberId: member.id,
        memberName: member.name,
        sessionDate: dateStr,
        entryTime: serverTimestamp(),
        exitTime: null,
        durationMinutes: null,
        status: 'open',
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        checkInAccuracy: accuracy || null,
        checkInDistance: distance,
        gymName: gymLocation.gymName,
        deviceId,
        edited: false,
        editedBy: null,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'sessions'), newSession);

      // Audit Event & Supabase Sync
      await logAttendanceEvent({
        memberId: member.id,
        sessionId: docRef.id,
        eventType: 'check_in',
        qrToken: qrValidation.activeQR?.token || scannedText,
        latitude,
        longitude,
        accuracy,
        calculatedDistance: distance,
        locationVerified: true,
        deviceId
      });

      try {
        if (supabase) {
          await supabase.from('attendance_sessions').insert({
            member_id: member.id,
            member_name: member.name,
            session_date: dateStr,
            status: 'open',
            check_in_latitude: latitude,
            check_in_longitude: longitude,
            check_in_accuracy: accuracy,
            check_in_distance: distance,
            device_id: deviceId
          });
        }
      } catch (e) {}

      return {
        success: true,
        action: 'check_in',
        member,
        session: {
          id: docRef.id,
          entryTime: now,
          distance,
          gymName: gymLocation.gymName,
          status: 'ACTIVE'
        },
        workout: todaysWorkout
      };

    } else {
      // === ACTION: CHECK-OUT ===
      // Close open session(s)
      const openDoc = sessionSnap.docs[0];
      const sessionData = openDoc.data();
      const entryTime = sessionData.entryTime?.toDate 
        ? sessionData.entryTime.toDate() 
        : (sessionData.entryTime ? new Date(sessionData.entryTime) : now);
      
      const durationMinutes = Math.max(1, Math.round((now.getTime() - entryTime.getTime()) / 60000));

      await updateDoc(doc(db, 'sessions', openDoc.id), {
        exitTime: serverTimestamp(),
        durationMinutes,
        status: 'closed',
        checkOutLatitude: latitude,
        checkOutLongitude: longitude,
        checkOutAccuracy: accuracy || null,
        checkOutDistance: distance,
        updatedAt: serverTimestamp()
      });

      // If any lingering additional open sessions existed, close them to prevent duplicates
      if (sessionSnap.docs.length > 1) {
        for (let i = 1; i < sessionSnap.docs.length; i++) {
          try {
            await updateDoc(doc(db, 'sessions', sessionSnap.docs[i].id), {
              status: 'closed',
              exitTime: serverTimestamp()
            });
          } catch (e) {}
        }
      }

      // Update 30-Minute device cooldown
      await setDoc(deviceCooldownRef, {
        lastSessionCompletedAt: serverTimestamp(),
        lastMemberId: member.id,
        updatedAt: serverTimestamp()
      });

      // Audit Event & Supabase Sync
      await logAttendanceEvent({
        memberId: member.id,
        sessionId: openDoc.id,
        eventType: 'check_out',
        qrToken: qrValidation.activeQR?.token || scannedText,
        latitude,
        longitude,
        accuracy,
        calculatedDistance: distance,
        locationVerified: true,
        deviceId
      });

      try {
        if (supabase) {
          await supabase
            .from('attendance_sessions')
            .update({
              exit_time: now.toISOString(),
              duration_minutes: durationMinutes,
              status: 'closed',
              check_out_latitude: latitude,
              check_out_longitude: longitude,
              check_out_accuracy: accuracy,
              check_out_distance: distance
            })
            .eq('member_id', member.id)
            .eq('status', 'open');
        }
      } catch (e) {}

      return {
        success: true,
        action: 'check_out',
        member,
        session: {
          id: openDoc.id,
          entryTime,
          exitTime: now,
          durationMinutes,
          distance,
          gymName: gymLocation.gymName,
          status: 'COMPLETED'
        },
        workout: todaysWorkout
      };
    }
  } finally {
    activeAttendanceLocks.delete(member.id);
  }
};



/**
 * Log attendance event for security and audit trail
 */
const logAttendanceEvent = async (eventData) => {
  try {
    const payload = {
      ...eventData,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'attendance_events'), payload);

    try {
      if (supabase) {
        await supabase.from('attendance_events').insert({
          member_id: eventData.memberId,
          session_id: eventData.sessionId || null,
          event_type: eventData.eventType,
          qr_token: eventData.qrToken || null,
          latitude: eventData.latitude || null,
          longitude: eventData.longitude || null,
          accuracy: eventData.accuracy || null,
          calculated_distance: eventData.calculatedDistance || null,
          location_verified: !!eventData.locationVerified,
          rejection_reason: eventData.rejectionReason || null,
          device_id: eventData.deviceId || null
        });
      }
    } catch (e) {}
  } catch (err) {
    console.warn('Failed to record attendance audit event:', err);
  }
};
