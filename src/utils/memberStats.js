import { getGymTodayDate } from './workoutSchedule.js';

/**
 * Parses any date value (Firestore Timestamp, ISO string, number, or Date)
 * into a valid JavaScript Date. Returns null if invalid or missing.
 */
export const parseMemberDate = (val) => {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    const d = val.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Cleans phone number to standard 10-digit format for athlete identification.
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return String(phone).trim().replace(/\D/g, '').slice(-10);
};

/**
 * Resolves standard subscription price from member record or plan fallback.
 */
export const resolvePlanPrice = (member) => {
  if (member?.price !== undefined && member?.price !== null && !isNaN(Number(member.price))) {
    const p = Number(member.price);
    if (p > 0) return p;
  }
  const planName = (member?.planName || '').toLowerCase();
  if (planName.includes('year')) return 7999;
  if (planName.includes('quarter')) return 2499;
  return 800; // Standard monthly pass
};

/**
 * Evaluates the precise subscription validity and status for a member.
 */
export const getSubscriptionStatus = (member, today = getGymTodayDate()) => {
  const startDate = parseMemberDate(member?.startDate || member?.created_at || member?.createdAt);
  const endDate = parseMemberDate(member?.endDate || member?.end_date);
  const price = resolvePlanPrice(member);

  const hasDates = Boolean(endDate && !isNaN(endDate.getTime()));
  
  // Calculate days remaining relative to today in gym timezone
  const daysLeft = hasDates 
    ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : -1;

  // Unpaid or pending subscriptions check
  const paymentStatus = (member?.paymentStatus || member?.payment_status || '').toLowerCase().trim();
  const isPaymentValid = !['unpaid', 'pending', 'failed', 'refunded', 'cancelled'].includes(paymentStatus);

  // Status flags
  const statusStr = (member?.status || '').toLowerCase().trim();
  const isStatusValid = !['expired', 'cancelled', 'inactive', 'unpaid', 'rejected'].includes(statusStr);

  // An active paid member MUST have:
  // 1. Valid endDate >= today
  // 2. Active status
  // 3. Valid payment
  // 4. Start date already reached (or ongoing)
  const isStarted = !startDate || startDate.getTime() <= (today.getTime() + 86400000); // within today or past
  const isActivePaid = hasDates && daysLeft >= 0 && isPaymentValid && isStatusValid && isStarted;
  
  // Expiring subscription window (within 3 days)
  const isExpiring = isActivePaid && daysLeft <= 3 && daysLeft >= 0;
  
  // Expired subscription
  const isExpired = !isActivePaid && (daysLeft < 0 || statusStr === 'expired');

  return {
    startDate,
    endDate,
    daysLeft,
    price,
    hasDates,
    isActivePaid,
    isExpiring,
    isExpired,
    isPaymentValid,
    isStatusValid
  };
};

/**
 * Audits and computes all athlete & subscription counts.
 * Handles deduplication, multiple historical subscriptions, and renewals.
 */
export const calculateMemberStats = (rawMembers = [], today = getGymTodayDate()) => {
  if (!Array.isArray(rawMembers) || rawMembers.length === 0) {
    return {
      totalRegistered: 0,
      totalSubscriptions: 0,
      activePaidCount: 0,
      expiringCount: 0,
      expiredCount: 0,
      inactiveOrUnpaidCount: 0,
      totalRevenue: 0,
      retentionRate: 0,
      uniqueAthletes: []
    };
  }

  // Group multiple subscriptions / records by unique athlete identifier (phone or ID)
  const athleteMap = new Map();

  rawMembers.forEach(m => {
    const phone = cleanPhoneNumber(m.phone);
    const uniqueKey = phone || m.email?.toLowerCase().trim() || m.id;

    if (!athleteMap.has(uniqueKey)) {
      athleteMap.set(uniqueKey, []);
    }
    athleteMap.get(uniqueKey).push(m);
  });

  let activePaidCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;
  let inactiveOrUnpaidCount = 0;
  let totalRevenue = 0;

  const uniqueAthletes = [];

  athleteMap.forEach((records) => {
    // Determine the currently effective subscription for this athlete
    // Prioritize active paid subscriptions, then latest endDate
    const evaluatedRecords = records.map(r => ({
      raw: r,
      eval: getSubscriptionStatus(r, today)
    }));

    evaluatedRecords.sort((a, b) => {
      // 1. Active paid subscriptions come first
      if (a.eval.isActivePaid && !b.eval.isActivePaid) return -1;
      if (!a.eval.isActivePaid && b.eval.isActivePaid) return 1;
      // 2. Then highest endDate
      const endA = a.eval.endDate ? a.eval.endDate.getTime() : 0;
      const endB = b.eval.endDate ? b.eval.endDate.getTime() : 0;
      return endB - endA;
    });

    const primary = evaluatedRecords[0];
    const { eval: primaryEval, raw: primaryRaw } = primary;

    uniqueAthletes.push({
      ...primaryRaw,
      ...primaryEval
    });

    if (primaryEval.isActivePaid) {
      activePaidCount++;
      totalRevenue += primaryEval.price;
      if (primaryEval.isExpiring) {
        expiringCount++;
      }
    } else if (primaryEval.isExpired) {
      expiredCount++;
    } else {
      inactiveOrUnpaidCount++;
    }
  });

  const totalRegistered = athleteMap.size;
  const retentionRate = totalRegistered > 0 
    ? Math.round((activePaidCount / totalRegistered) * 100) 
    : 0;

  return {
    totalRegistered,
    totalSubscriptions: rawMembers.length,
    activePaidCount,
    expiringCount,
    expiredCount,
    inactiveOrUnpaidCount,
    totalRevenue,
    retentionRate,
    uniqueAthletes
  };
};

/**
 * Filter athletes by status tab ('all', 'active', 'expiring', 'expired').
 */
export const filterAthletes = (athletesList = [], filterStatus = 'all', searchQuery = '', today = getGymTodayDate()) => {
  const query = (searchQuery || '').toLowerCase().trim();

  return athletesList.filter(m => {
    // Search match
    if (query) {
      const nameMatch = (m.name || '').toLowerCase().includes(query);
      const phoneMatch = (m.phone || '').includes(query);
      if (!nameMatch && !phoneMatch) return false;
    }

    const { isActivePaid, daysLeft, isExpired } = getSubscriptionStatus(m, today);

    if (filterStatus === 'active') {
      return isActivePaid && daysLeft > 3;
    }
    if (filterStatus === 'expiring') {
      return isActivePaid && daysLeft <= 3 && daysLeft >= 0;
    }
    if (filterStatus === 'expired') {
      return isExpired || daysLeft < 0;
    }
    return true; // 'all'
  });
};
