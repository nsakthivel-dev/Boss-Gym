import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMemberDate,
  cleanPhoneNumber,
  resolvePlanPrice,
  getSubscriptionStatus,
  calculateMemberStats,
  filterAthletes
} from './memberStats.js';

const REFERENCE_TODAY = new Date(2026, 9, 11); // October 11, 2026

test('parseMemberDate: Parses Dates, strings, and Timestamps', () => {
  assert.equal(parseMemberDate(null), null);
  assert.equal(parseMemberDate(''), null);
  assert.ok(parseMemberDate('2026-10-11') instanceof Date);
  assert.ok(parseMemberDate(new Date()) instanceof Date);
  assert.ok(parseMemberDate({ toDate: () => new Date() }) instanceof Date);
});

test('cleanPhoneNumber: Sanitizes phone numbers to standard 10 digits', () => {
  assert.equal(cleanPhoneNumber('+91 9876543210'), '9876543210');
  assert.equal(cleanPhoneNumber('98765-43210'), '9876543210');
  assert.equal(cleanPhoneNumber('09876543210'), '9876543210');
  assert.equal(cleanPhoneNumber(''), '');
  assert.equal(cleanPhoneNumber(null), '');
});

test('resolvePlanPrice: Fallbacks and custom prices', () => {
  assert.equal(resolvePlanPrice({ price: 1200 }), 1200);
  assert.equal(resolvePlanPrice({ price: '1500' }), 1500);
  assert.equal(resolvePlanPrice({ planName: 'Yearly VIP' }), 7999);
  assert.equal(resolvePlanPrice({ planName: 'Quarterly Pass' }), 2499);
  assert.equal(resolvePlanPrice({ planName: 'Monthly Standard' }), 800);
  assert.equal(resolvePlanPrice({}), 800);
});

test('getSubscriptionStatus: Distinguishes active, expiring, expired, and unpaid', () => {
  // 1. Active with plenty of days left (e.g. endDate = 2026-11-10)
  const activeMember = {
    name: 'John Doe',
    status: 'active',
    startDate: new Date(2026, 9, 1),
    endDate: new Date(2026, 10, 10),
    paymentStatus: 'paid',
    price: 800
  };
  const activeStatus = getSubscriptionStatus(activeMember, REFERENCE_TODAY);
  assert.equal(activeStatus.isActivePaid, true);
  assert.equal(activeStatus.isExpired, false);
  assert.equal(activeStatus.isExpiring, false);
  assert.ok(activeStatus.daysLeft > 3);

  // 2. Expiring soon (2 days left: endDate = 2026-10-13)
  const expiringMember = {
    name: 'Jane Doe',
    status: 'active',
    startDate: new Date(2026, 8, 13),
    endDate: new Date(2026, 9, 13),
    paymentStatus: 'paid',
    price: 800
  };
  const expiringStatus = getSubscriptionStatus(expiringMember, REFERENCE_TODAY);
  assert.equal(expiringStatus.isActivePaid, true);
  assert.equal(expiringStatus.isExpiring, true);
  assert.equal(expiringStatus.isExpired, false);
  assert.ok(expiringStatus.daysLeft <= 3 && expiringStatus.daysLeft >= 0);

  // 3. Expired (endDate in the past: 2026-10-01)
  const expiredMember = {
    name: 'Bob Smith',
    status: 'active', // Note: status was not marked expired yet, but date has passed!
    startDate: new Date(2026, 8, 1),
    endDate: new Date(2026, 9, 1),
    paymentStatus: 'paid',
    price: 800
  };
  const expiredStatus = getSubscriptionStatus(expiredMember, REFERENCE_TODAY);
  assert.equal(expiredStatus.isActivePaid, false);
  assert.equal(expiredStatus.isExpired, true);
  assert.ok(expiredStatus.daysLeft < 0);

  // 4. Unpaid / Pending payment should NOT be active paid
  const unpaidMember = {
    name: 'Charlie Brown',
    status: 'active',
    startDate: new Date(2026, 9, 1),
    endDate: new Date(2026, 10, 1),
    paymentStatus: 'pending',
    price: 800
  };
  const unpaidStatus = getSubscriptionStatus(unpaidMember, REFERENCE_TODAY);
  assert.equal(unpaidStatus.isActivePaid, false);
});

test('calculateMemberStats: Deduplicates multiple records and accurately calculates counters', () => {
  const mockMembers = [
    // Athlete 1: Active subscription
    {
      id: 'm1',
      name: 'Athlete One',
      phone: '9876543210',
      status: 'active',
      startDate: new Date(2026, 9, 1),
      endDate: new Date(2026, 10, 15),
      paymentStatus: 'paid',
      price: 800
    },
    // Athlete 1: Old expired subscription record (historical duplicate)
    {
      id: 'm1_old',
      name: 'Athlete One',
      phone: '9876543210',
      status: 'expired',
      startDate: new Date(2026, 8, 1),
      endDate: new Date(2026, 9, 1),
      paymentStatus: 'paid',
      price: 800
    },
    // Athlete 2: Expiring in 2 days
    {
      id: 'm2',
      name: 'Athlete Two',
      phone: '9876543211',
      status: 'active',
      startDate: new Date(2026, 8, 13),
      endDate: new Date(2026, 9, 13),
      paymentStatus: 'paid',
      price: 2499
    },
    // Athlete 3: Expired subscription
    {
      id: 'm3',
      name: 'Athlete Three',
      phone: '9876543212',
      status: 'expired',
      startDate: new Date(2026, 7, 1),
      endDate: new Date(2026, 8, 1),
      paymentStatus: 'paid',
      price: 800
    },
    // Athlete 4: Unpaid / Failed payment
    {
      id: 'm4',
      name: 'Athlete Four',
      phone: '9876543213',
      status: 'active',
      startDate: new Date(2026, 9, 1),
      endDate: new Date(2026, 10, 1),
      paymentStatus: 'failed',
      price: 800
    }
  ];

  const stats = calculateMemberStats(mockMembers, REFERENCE_TODAY);

  // Total raw subscription documents = 5
  assert.equal(stats.totalSubscriptions, 5);

  // Unique registered athletes = 4 (Athlete One has 2 documents)
  assert.equal(stats.totalRegistered, 4);

  // Active paid athletes = 2 (Athlete One and Athlete Two)
  assert.equal(stats.activePaidCount, 2);

  // Expiring = 1 (Athlete Two)
  assert.equal(stats.expiringCount, 1);

  // Expired = 1 (Athlete Three)
  assert.equal(stats.expiredCount, 1);

  // Inactive / Unpaid = 1 (Athlete Four)
  assert.equal(stats.inactiveOrUnpaidCount, 1);

  // Total revenue = 800 (Athlete One) + 2499 (Athlete Two) = 3299
  // (Athlete One's expired historical doc is not double counted)
  assert.equal(stats.totalRevenue, 3299);

  // Retention rate = 2 active / 4 registered = 50%
  assert.equal(stats.retentionRate, 50);
});

test('calculateMemberStats: Handles empty member array gracefully', () => {
  const stats = calculateMemberStats([], REFERENCE_TODAY);
  assert.equal(stats.totalRegistered, 0);
  assert.equal(stats.totalSubscriptions, 0);
  assert.equal(stats.activePaidCount, 0);
  assert.equal(stats.expiringCount, 0);
  assert.equal(stats.expiredCount, 0);
  assert.equal(stats.totalRevenue, 0);
  assert.equal(stats.retentionRate, 0);
  assert.deepEqual(stats.uniqueAthletes, []);
});

test('filterAthletes: Correctly partitions athletes by tab', () => {
  const members = [
    { id: '1', name: 'Active Person', status: 'active', endDate: new Date(2026, 10, 15), paymentStatus: 'paid' },
    { id: '2', name: 'Expiring Person', status: 'active', endDate: new Date(2026, 9, 13), paymentStatus: 'paid' },
    { id: '3', name: 'Expired Person', status: 'active', endDate: new Date(2026, 8, 1), paymentStatus: 'paid' }
  ];

  const all = filterAthletes(members, 'all', '', REFERENCE_TODAY);
  assert.equal(all.length, 3);

  const activeOnly = filterAthletes(members, 'active', '', REFERENCE_TODAY);
  assert.equal(activeOnly.length, 1);
  assert.equal(activeOnly[0].id, '1');

  const expiringOnly = filterAthletes(members, 'expiring', '', REFERENCE_TODAY);
  assert.equal(expiringOnly.length, 1);
  assert.equal(expiringOnly[0].id, '2');

  const expiredOnly = filterAthletes(members, 'expired', '', REFERENCE_TODAY);
  assert.equal(expiredOnly.length, 1);
  assert.equal(expiredOnly[0].id, '3');
});
