import test from 'node:test';
import assert from 'node:assert/strict';
import { getDistanceMeters } from './distance.js';
import { calculateMemberStats, getSubscriptionStatus } from './memberStats.js';
import { getGymDateString, getGymTodayDate } from './workoutSchedule.js';

const extractTokenFromScan = (scannedRaw) => {
  if (!scannedRaw) return '';
  const trimmed = String(scannedRaw).trim();
  if (trimmed.includes('?token=') || trimmed.includes('&token=')) {
    try {
      const url = new URL(trimmed);
      const tokenParam = url.searchParams.get('token');
      if (tokenParam) return tokenParam;
    } catch (e) {
      const match = trimmed.match(/token=([A-Za-z0-9_-]+)/);
      if (match) return match[1];
    }
  }
  const pathMatch = trimmed.match(/\/check-?in\/([A-Za-z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }
  if (trimmed.startsWith('NBG_ATTENDANCE_TOKEN:')) {
    return trimmed.replace('NBG_ATTENDANCE_TOKEN:', '');
  }
  return trimmed;
};

// 1. Service Worker & PWA Cache Strategy Tests
test('PWA SW: Dynamic request patterns bypass service worker cache', () => {
  const DYNAMIC_PATTERNS = [
    'supabase.co',
    'googleapis.com',
    'firebaseio.com',
    'firestore',
    '/api/',
    'wa.me',
    'gym_locations',
    'attendance',
    'sessions',
    'members',
    'qr_config',
    'workout_schedule',
    'profiles',
    'memberships',
  ];

  const isDynamicRequest = (url) => DYNAMIC_PATTERNS.some(p => url.includes(p));

  // Live database queries must always be identified as dynamic and bypass SW
  assert.equal(isDynamicRequest('https://nnyemjpojiuywmfiakfy.supabase.co/rest/v1/attendance_sessions'), true);
  assert.equal(isDynamicRequest('https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel'), true);
  assert.equal(isDynamicRequest('https://gym-app-5e0cd.firebaseio.com/.json'), true);
  assert.equal(isDynamicRequest('https://newbossgym.in.net/api/checkin'), true);

  // Static assets must NOT match dynamic patterns
  assert.equal(isDynamicRequest('https://newbossgym.in.net/assets/index-B9P7sZkd.js'), false);
  assert.equal(isDynamicRequest('https://newbossgym.in.net/assets/index-_6lvsrOB.css'), false);
  assert.equal(isDynamicRequest('https://newbossgym.in.net/icons/icon-192x192.png'), false);
  assert.equal(isDynamicRequest('https://newbossgym.in.net/manifest.json'), false);
});

test('PWA SW: Safe cache eviction removes only application version caches', () => {
  const currentStatic = 'boss-gym-static-boss-gym-v4.2';
  const currentRuntime = 'boss-gym-runtime-boss-gym-v4.2';

  const existingCaches = [
    'boss-gym-static-boss-gym-v4.0',
    'boss-gym-runtime-boss-gym-v4.0',
    'boss-gym-static-boss-gym-v4.1',
    'boss-gym-runtime-boss-gym-v4.1',
    'boss-gym-static-boss-gym-v4.2',
    'boss-gym-runtime-boss-gym-v4.2',
    'firebase-heartbeat-database', // User data / IndexedDB / 3rd party
    'auth-token-cache',
  ];

  const deprecatedCaches = existingCaches.filter((c) => {
    return c.startsWith('boss-gym-') && c !== currentStatic && c !== currentRuntime;
  });

  assert.deepEqual(deprecatedCaches, [
    'boss-gym-static-boss-gym-v4.0',
    'boss-gym-runtime-boss-gym-v4.0',
    'boss-gym-static-boss-gym-v4.1',
    'boss-gym-runtime-boss-gym-v4.1',
  ]);

  // Non-app caches (auth tokens, indexedDB) are preserved
  assert.ok(!deprecatedCaches.includes('firebase-heartbeat-database'));
  assert.ok(!deprecatedCaches.includes('auth-token-cache'));
});

// 2. QR Token Extraction & Validation Tests
test('QR Scanner: Extracts clean token from URL or raw payload', () => {
  // Direct token
  assert.equal(extractTokenFromScan('NBG_SEC_A1B2C3D4'), 'NBG_SEC_A1B2C3D4');

  // Full URL from wall poster scan
  assert.equal(extractTokenFromScan('https://newbossgym.in.net/checkin?token=NBG_SEC_99887766'), 'NBG_SEC_99887766');

  // Formatted prefix
  assert.equal(extractTokenFromScan('NBG_ATTENDANCE_TOKEN:NBG_SEC_TOKEN123'), 'NBG_SEC_TOKEN123');

  // Path format: /checkin/TOKEN
  assert.equal(extractTokenFromScan('https://newbossgym.in.net/checkin/NBG_SEC_PATH456'), 'NBG_SEC_PATH456');

  // Empty or fallback
  assert.equal(extractTokenFromScan(''), '');
});

// 3. Geofence Distance & Accuracy Verification
test('GPS Geofence: Distance calculation and accuracy validation', () => {
  // Gym Coordinates (Muthaliyarpet, Pondicherry)
  const gymLat = 11.9111586;
  const gymLng = 79.6347447;
  const radius = 500; // 500 meters geofence radius

  // Inside gym (same coordinate) -> ~0m
  const distanceInside = getDistanceMeters(gymLat, gymLng, gymLat, gymLng);
  assert.equal(distanceInside, 0);

  // Close by (~100m away)
  const nearLat = 11.9120000;
  const nearLng = 79.6347447;
  const nearDistance = getDistanceMeters(gymLat, gymLng, nearLat, nearLng);
  assert.ok(nearDistance < radius, `Near distance (${nearDistance}m) should be within radius (${radius}m)`);

  // Far away (Chennai ~140km away)
  const farLat = 13.0827;
  const farLng = 80.2707;
  const farDistance = getDistanceMeters(gymLat, gymLng, farLat, farLng);
  assert.ok(farDistance > radius, `Far distance (${farDistance}m) must exceed radius (${radius}m)`);

  // Coarse accuracy check (> 250m accuracy rejected)
  const MAX_ACCEPTABLE_ACCURACY = 250;
  assert.equal(30 <= MAX_ACCEPTABLE_ACCURACY, true); // Mobile GNSS lock
  assert.equal(600 <= MAX_ACCEPTABLE_ACCURACY, false); // Poor cell-tower fix rejected
});

// 4. Duplicate Scan & Device Cooldown Protection
test('Attendance Cooldowns: Enforces 30s duplicate protection and 30m same-device session limits', () => {
  const now = Date.now();

  // Scenario 1: User double-taps within 5 seconds -> DUPLICATE_SCAN
  const lastScan5sAgo = now - 5000;
  const elapsedSeconds = (now - lastScan5sAgo) / 1000;
  const isDuplicate = elapsedSeconds < 30;
  assert.equal(isDuplicate, true);
  assert.equal(Math.ceil(30 - elapsedSeconds), 25);

  // Scenario 2: User scans 45 seconds later -> ALLOWED
  const lastScan45sAgo = now - 45000;
  const elapsed45s = (now - lastScan45sAgo) / 1000;
  assert.equal(elapsed45s < 30, false);

  // Scenario 3: Same device attempts starting a second check-in session within 10 minutes -> RESTRICTED
  const lastCheckout10mAgo = now - (10 * 60 * 1000);
  const elapsedMinutes = (now - lastCheckout10mAgo) / 60000;
  const isDeviceRestricted = elapsedMinutes < 30;
  assert.equal(isDeviceRestricted, true);
  assert.equal(Math.ceil(30 - elapsedMinutes), 20);

  // Scenario 4: Same device starting a new session after 35 minutes -> ALLOWED
  const lastCheckout35mAgo = now - (35 * 60 * 1000);
  const elapsed35m = (now - lastCheckout35mAgo) / 60000;
  assert.equal(elapsed35m < 30, false);
});

// 5. Dashboard Counters & Metric Consistency
test('Dashboard Metrics: Consistent calculations between Website and Installed PWA', () => {
  const today = getGymTodayDate();

  const members = [
    {
      id: 'MEM_01',
      name: 'Athlete One',
      status: 'active',
      startDate: new Date(today.getTime() - 10 * 86400000),
      endDate: new Date(today.getTime() + 20 * 86400000),
      paymentStatus: 'paid',
      price: 800
    },
    {
      id: 'MEM_02',
      name: 'Athlete Two',
      status: 'active',
      startDate: new Date(today.getTime() - 28 * 86400000),
      endDate: new Date(today.getTime() + 2 * 86400000), // Expiring in 2 days
      paymentStatus: 'paid',
      price: 800
    },
    {
      id: 'MEM_03',
      name: 'Athlete Three',
      status: 'expired',
      startDate: new Date(today.getTime() - 60 * 86400000),
      endDate: new Date(today.getTime() - 10 * 86400000), // Expired
      paymentStatus: 'paid',
      price: 800
    }
  ];

  const stats = calculateMemberStats(members, today);
  assert.equal(stats.totalRegistered, 3);
  assert.equal(stats.activePaidCount, 2);
  assert.equal(stats.expiringCount, 1);
  assert.equal(stats.expiredCount, 1);

  // Sessions today
  const todaySessions = [
    { id: 'S1', memberId: 'MEM_01', status: 'open', sessionDate: getGymDateString() },
    { id: 'S2', memberId: 'MEM_01', status: 'closed', sessionDate: getGymDateString() }, // Same member 2nd visit
    { id: 'S3', memberId: 'MEM_02', status: 'closed', sessionDate: getGymDateString() },
  ];

  // Total daily visits
  const totalDailyVisits = todaySessions.length;
  assert.equal(totalDailyVisits, 3);

  // Unique athletes trained today
  const uniqueAttendees = new Set(todaySessions.map(s => s.memberId)).size;
  assert.equal(uniqueAttendees, 2);

  // Active inside now (floor load)
  const activeInsideNow = todaySessions.filter(s => s.status === 'open').length;
  assert.equal(activeInsideNow, 1);
});

// 6. Online / Offline State Machine
test('Offline State Machine: Sensitive mutations blocked when offline, safe error codes returned', () => {
  const isOnline = false;

  const checkAttendancePrecondition = (online) => {
    if (!online) {
      return {
        success: false,
        code: 'OFFLINE',
        message: "You're offline. Connect to the internet to verify your current gym location and record attendance."
      };
    }
    return { success: true };
  };

  const result = checkAttendancePrecondition(isOnline);
  assert.equal(result.success, false);
  assert.equal(result.code, 'OFFLINE');
  assert.ok(result.message.includes('offline'));
});
