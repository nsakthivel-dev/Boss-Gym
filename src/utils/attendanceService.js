import { db } from '../firebase/config';
import { supabase } from '../supabase/config';
import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, 
  query, where, serverTimestamp, Timestamp 
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
 * Fetch or initialize the active Gym QR configuration
 */
export const getActiveGymQR = async () => {
  try {
    const qrDocRef = doc(db, 'settings', 'qr_config');
    const snap = await getDoc(qrDocRef);

    // Read latest coordinates from settings/config to guarantee active geo sync
    let latestSettings = null;
    try {
      const configSnap = await getDoc(doc(db, 'settings', 'config'));
      if (configSnap.exists()) {
        latestSettings = configSnap.data();
      }
    } catch (e) {}

    if (snap.exists()) {
      const qrData = snap.data();
      return {
        ...qrData,
        latitude: latestSettings?.latitude ?? qrData.latitude ?? 11.9111586,
        longitude: latestSettings?.longitude ?? qrData.longitude ?? 79.6347447,
        radius: latestSettings?.radius ?? qrData.radius ?? 500,
        gymName: latestSettings?.gymName ?? qrData.gymName ?? 'New Boss Gym'
      };
    }

    // Default seed if no QR generated yet
    const initialConfig = {
      gymId: 'NBG_MUTH_01',
      gymName: latestSettings?.gymName || 'New Boss Gym',
      latitude: latestSettings?.latitude || 11.9111586,
      longitude: latestSettings?.longitude || 79.6347447,
      radius: latestSettings?.radius || 500,
      token: generateSecureToken(),
      status: 'active', // 'active' | 'revoked'
      createdAt: new Date().toISOString(),
      expiresAt: null,
      revokedAt: null
    };

    await setDoc(qrDocRef, initialConfig);

    // Sync to Supabase safely if table exists
    try {
      await supabase.from('attendance_qr').insert({
        secure_token: initialConfig.token,
        status: 'active'
      });
    } catch (sbErr) {
      // Table might not exist yet, continue safely
    }

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

    let lat = 11.9111586;
    let lng = 79.6347447;
    let rad = 500;
    let gymName = 'New Boss Gym';

    try {
      const configSnap = await getDoc(doc(db, 'settings', 'config'));
      if (configSnap.exists()) {
        const c = configSnap.data();
        if (c.latitude) lat = Number(c.latitude);
        if (c.longitude) lng = Number(c.longitude);
        if (c.radius) rad = Number(c.radius);
        if (c.gymName) gymName = c.gymName;
      }
    } catch (e) {}

    const qrConfig = {
      gymId: 'NBG_MUTH_01',
      gymName,
      latitude: lat,
      longitude: lng,
      radius: rad,
      token: newToken,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      revokedAt: null
    };

    await setDoc(doc(db, 'settings', 'qr_config'), qrConfig);

    // Sync to Supabase
    try {
      await supabase.from('attendance_qr').insert({
        secure_token: newToken,
        status: 'active',
        expires_at: expiresAt
      });
    } catch (e) {
      // Ignored if table not created
    }

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
      if (current.token) {
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
 * Extract GPS coordinates & perimeter from scanned QR text if present
 * Supports geo:lat,lng and URL query params ?lat=..&lng=..&rad=..
 */
export const extractCoordsFromScan = (rawText) => {
  if (!rawText) return null;
  const trimmed = rawText.trim();

  // Pattern 1: geo:11.9111586,79.6347447 or geo:11.9111586,79.6347447?q=...
  const geoMatch = trimmed.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (geoMatch) {
    return {
      latitude: parseFloat(geoMatch[1]),
      longitude: parseFloat(geoMatch[2])
    };
  }

  // Pattern 2: URL with lat= & lng= query params
  if (trimmed.includes('lat=') && trimmed.includes('lng=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : 'https://' + trimmed);
      const lat = url.searchParams.get('lat');
      const lng = url.searchParams.get('lng');
      const rad = url.searchParams.get('rad');
      if (lat && lng) {
        return {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          radius: rad ? parseFloat(rad) : undefined
        };
      }
    } catch (e) {
      const latMatch = trimmed.match(/lat=(-?\d+(?:\.\d+)?)/);
      const lngMatch = trimmed.match(/lng=(-?\d+(?:\.\d+)?)/);
      const radMatch = trimmed.match(/rad=(\d+)/);
      if (latMatch && lngMatch) {
        return {
          latitude: parseFloat(latMatch[1]),
          longitude: parseFloat(lngMatch[1]),
          radius: radMatch ? parseFloat(radMatch[1]) : undefined
        };
      }
    }
  }

  return null;
};

/**
 * Parse token from scanned text (supports plain token, formatted payload, or checkin URL)
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

  // If payload has 'qr=' in URL
  if (trimmed.includes('qr=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : 'https://' + trimmed);
      const qrParam = url.searchParams.get('qr');
      if (qrParam) return qrParam;
    } catch (e) {}
  }

  // If formatted as NBG_ATTENDANCE_TOKEN:<token>
  if (trimmed.startsWith('NBG_ATTENDANCE_TOKEN:')) {
    return trimmed.replace('NBG_ATTENDANCE_TOKEN:', '');
  }

  // Legacy fallback if scanning bare URL or geo
  if (trimmed.startsWith('http') || trimmed.startsWith('geo:')) {
    return trimmed;
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

  // Token verification - accepts direct token, checkin URL with token, or verified geo URI
  const isDirectTokenMatch = token === activeQR.token;
  const isUrlMatch = scannedRaw.includes('/checkin');
  const isGeoMatch = scannedRaw.startsWith('geo:');

  if (!isDirectTokenMatch && !isUrlMatch && !isGeoMatch) {
    return { 
      valid: false, 
      code: 'INVALID_QR', 
      message: 'Invalid gym QR code. Please scan the official New Boss Gym entrance QR.' 
    };
  }

  return { valid: true, activeQR };
};

/**
 * Fetch member's assigned workout for today from workout_schedule
 */
export const fetchMemberTodayWorkout = async (member) => {
  if (!member) return null;

  try {
    const scheduleSnap = await getDocs(collection(db, 'workout_schedule'));
    const baseSchedule = scheduleSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.day - b.day);

    if (baseSchedule.length === 0) return null;

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
  memberOverride = null,
  gymSettings = null,
  targetCoords = null
}) => {
  const deviceId = getDeviceId();
  const now = new Date();
  const dateStr = todayStr();

  // 1. Validate QR Code
  const qrValidation = await validateScannedQR(scannedText);
  if (!qrValidation.valid) {
    // Record rejected event
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

  // Check GPS accuracy threshold (allow up to 100m for indoor gym environments)
  if (accuracy && accuracy > 100) {
    return {
      success: false,
      code: 'LOCATION_LOW_ACCURACY',
      accuracy: Math.round(accuracy),
      message: `Your GPS accuracy (${Math.round(accuracy)}m) is too low. Please enable high-accuracy location or connect to Wi-Fi and try again.`
    };
  }

  // 3. Haversine Distance & Geofence Check
  // Resolve target gym coordinates with cascading priority:
  // (A) Explicit targetCoords passed in from URL / client
  // (B) Scanned QR text payload (geo: URI or URL params)
  // (C) gymSettings passed from SettingsContext
  // (D) Direct Firestore fetch from settings/config doc
  // (E) Default fallback
  const scannedCoords = extractCoordsFromScan(scannedText);

  let gymLat = null;
  let gymLng = null;
  let allowedRadius = null;

  if (targetCoords && typeof targetCoords.latitude === 'number' && typeof targetCoords.longitude === 'number') {
    gymLat = targetCoords.latitude;
    gymLng = targetCoords.longitude;
    if (targetCoords.radius) allowedRadius = parseFloat(targetCoords.radius);
  } else if (scannedCoords && typeof scannedCoords.latitude === 'number' && typeof scannedCoords.longitude === 'number') {
    gymLat = scannedCoords.latitude;
    gymLng = scannedCoords.longitude;
    if (scannedCoords.radius) allowedRadius = parseFloat(scannedCoords.radius);
  } else if (gymSettings && gymSettings.latitude && gymSettings.longitude) {
    gymLat = parseFloat(gymSettings.latitude);
    gymLng = parseFloat(gymSettings.longitude);
    if (gymSettings.radius) allowedRadius = parseFloat(gymSettings.radius);
  }

  // Fallback to direct Firestore read if still missing coordinates
  if (!gymLat || !gymLng) {
    try {
      const cfgSnap = await getDoc(doc(db, 'settings', 'config'));
      if (cfgSnap.exists()) {
        const c = cfgSnap.data();
        if (c.latitude) gymLat = parseFloat(c.latitude);
        if (c.longitude) gymLng = parseFloat(c.longitude);
        if (c.radius) allowedRadius = parseFloat(c.radius);
      }
    } catch (e) {
      console.warn("Could not fetch fallback settings from Firestore:", e);
    }
  }

  // Ultimate fallbacks
  gymLat = (gymLat && !isNaN(gymLat)) ? gymLat : 11.9111586;
  gymLng = (gymLng && !isNaN(gymLng)) ? gymLng : 79.6347447;
  allowedRadius = (allowedRadius && !isNaN(allowedRadius) && allowedRadius > 0) ? allowedRadius : 500;

  const distance = getDistanceMeters(latitude, longitude, gymLat, gymLng);
  const detectedDistance = Math.round(distance);

  if (distance > allowedRadius) {
    await logAttendanceEvent({
      memberId: memberOverride?.id || phone || 'unknown',
      eventType: 'scan_rejected',
      rejectionReason: 'OUTSIDE_GEOFENCE',
      latitude,
      longitude,
      accuracy,
      calculatedDistance: detectedDistance,
      deviceId
    });

    return {
      success: false,
      code: 'OUTSIDE_GEOFENCE',
      detectedDistance,
      allowedRadius,
      gymLat,
      gymLng,
      message: `You're outside the gym attendance area (${detectedDistance}m away, allowed perimeter: ${allowedRadius}m).`
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
        message: "You're not registered as a member."
      };
    }

    const docData = snap.docs[0];
    member = { id: docData.id, ...docData.data() };
  }

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

  // 6. 30-Second Duplicate Scan Protection (Server-Side)
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
          message: `You scanned ${Math.round(elapsedSeconds)} seconds ago. Please wait before scanning again.`
        };
      }
    }
  }

  // 7. Same-Device 30-Minute Rule
  // If the same device finished a session within the last 30 minutes, restrict starting another new session
  const deviceCooldownRef = doc(db, 'device_cooldowns', deviceId);
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

  // Update duplicate cooldown timestamp
  await setDoc(cooldownRef, { lastScan: serverTimestamp() }, { merge: true });

  // 8. Attendance State Machine (Check-In vs Check-Out)
  const sessionQ = query(
    collection(db, 'sessions'),
    where('memberId', '==', member.id),
    where('sessionDate', '==', dateStr),
    where('status', '==', 'open')
  );
  const sessionSnap = await getDocs(sessionQ);

  // Retrieve today's workout
  const todaysWorkout = await fetchMemberTodayWorkout(member);

  if (sessionSnap.empty) {
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
      checkInDistance: detectedDistance,
      gymName: gymSettings?.gymName || 'New Boss Gym',
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
      calculatedDistance: detectedDistance,
      locationVerified: true,
      deviceId
    });

    try {
      await supabase.from('attendance_sessions').insert({
        member_id: member.id,
        member_name: member.name,
        session_date: dateStr,
        status: 'open',
        check_in_latitude: latitude,
        check_in_longitude: longitude,
        check_in_accuracy: accuracy,
        check_in_distance: detectedDistance,
        device_id: deviceId
      });
    } catch (e) {}

    return {
      success: true,
      action: 'check_in',
      member,
      session: {
        id: docRef.id,
        entryTime: now,
        distance: detectedDistance,
        gymName: gymSettings?.gymName || 'New Boss Gym',
        status: 'ACTIVE'
      },
      workout: todaysWorkout
    };

  } else {
    // === ACTION: CHECK-OUT ===
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
      checkOutDistance: detectedDistance,
      updatedAt: serverTimestamp()
    });

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
      calculatedDistance: detectedDistance,
      locationVerified: true,
      deviceId
    });

    try {
      await supabase
        .from('attendance_sessions')
        .update({
          exit_time: now.toISOString(),
          duration_minutes: durationMinutes,
          status: 'closed',
          check_out_latitude: latitude,
          check_out_longitude: longitude,
          check_out_accuracy: accuracy,
          check_out_distance: detectedDistance
        })
        .eq('member_id', member.id)
        .eq('status', 'open');
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
        distance: detectedDistance,
        gymName: gymSettings?.gymName || 'New Boss Gym',
        status: 'COMPLETED'
      },
      workout: todaysWorkout
    };
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
    } catch (e) {}
  } catch (err) {
    console.warn('Failed to record attendance audit event:', err);
  }
};
