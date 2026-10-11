import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIXED_WEEKLY_WORKOUT_SCHEDULE,
  getGymDateString,
  getGymTodayDate,
  getGymDayOfWeek,
  getWorkoutForDayOfWeek,
  getWorkoutForDate,
  calculateMonthStats
} from './workoutSchedule.js';

test('Fixed Weekly Schedule: 7 days canonical mapping', () => {
  assert.equal(FIXED_WEEKLY_WORKOUT_SCHEDULE.length, 7);
  assert.ok(getGymTodayDate() instanceof Date);

  const expectedDays = [
    { day: 1, dayOfWeek: 1, weekday: 'Monday', title: 'CHEST WORKOUT', isRest: false },
    { day: 2, dayOfWeek: 2, weekday: 'Tuesday', title: 'BACK WORKOUT', isRest: false },
    { day: 3, dayOfWeek: 3, weekday: 'Wednesday', title: 'SHOULDERS WORKOUT', isRest: false },
    { day: 4, dayOfWeek: 4, weekday: 'Thursday', title: 'BICEPS WORKOUT', isRest: false },
    { day: 5, dayOfWeek: 5, weekday: 'Friday', title: 'LEGS WORKOUT', isRest: false },
    { day: 6, dayOfWeek: 6, weekday: 'Saturday', title: 'TRICEPS WORKOUT', isRest: false },
    { day: 7, dayOfWeek: 0, weekday: 'Sunday', title: 'REST DAY', isRest: true }
  ];

  for (const exp of expectedDays) {
    const item = FIXED_WEEKLY_WORKOUT_SCHEDULE.find(d => d.day === exp.day);
    assert.ok(item, `Day ${exp.day} should exist in schedule`);
    assert.equal(item.weekday, exp.weekday);
    assert.equal(item.title, exp.title);
    assert.equal(item.isRest, exp.isRest);
    assert.equal(item.dayOfWeek, exp.dayOfWeek);
  }
});

test('getWorkoutForDayOfWeek: Maps every weekday (0-6) to the correct workout', () => {
  // 1: Monday -> Chest
  assert.equal(getWorkoutForDayOfWeek(1).title, 'CHEST WORKOUT');
  assert.equal(getWorkoutForDayOfWeek(1).isRest, false);

  // 2: Tuesday -> Back
  assert.equal(getWorkoutForDayOfWeek(2).title, 'BACK WORKOUT');
  assert.equal(getWorkoutForDayOfWeek(2).isRest, false);

  // 3: Wednesday -> Shoulders
  assert.equal(getWorkoutForDayOfWeek(3).title, 'SHOULDERS WORKOUT');
  assert.equal(getWorkoutForDayOfWeek(3).isRest, false);

  // 4: Thursday -> Biceps
  assert.equal(getWorkoutForDayOfWeek(4).title, 'BICEPS WORKOUT');
  assert.equal(getWorkoutForDayOfWeek(4).isRest, false);

  // 5: Friday -> Legs
  assert.equal(getWorkoutForDayOfWeek(5).title, 'LEGS WORKOUT');
  assert.equal(getWorkoutForDayOfWeek(5).isRest, false);

  // 6: Saturday -> Triceps
  assert.equal(getWorkoutForDayOfWeek(6).title, 'TRICEPS WORKOUT');
  assert.equal(getWorkoutForDayOfWeek(6).isRest, false);

  // 0: Sunday -> Rest Day
  assert.equal(getWorkoutForDayOfWeek(0).title, 'REST DAY');
  assert.equal(getWorkoutForDayOfWeek(0).isRest, true);
});

test('getWorkoutForDate: Date navigation resolves correct workout across calendar transitions', () => {
  // 2026-10-12 is Monday -> Chest
  assert.equal(getWorkoutForDate('2026-10-12T10:00:00+05:30').title, 'CHEST WORKOUT');

  // 2026-10-13 is Tuesday -> Back
  assert.equal(getWorkoutForDate('2026-10-13T10:00:00+05:30').title, 'BACK WORKOUT');

  // 2026-10-14 is Wednesday -> Shoulders
  assert.equal(getWorkoutForDate('2026-10-14T10:00:00+05:30').title, 'SHOULDERS WORKOUT');

  // 2026-10-15 is Thursday -> Biceps
  assert.equal(getWorkoutForDate('2026-10-15T10:00:00+05:30').title, 'BICEPS WORKOUT');

  // 2026-10-16 is Friday -> Legs
  assert.equal(getWorkoutForDate('2026-10-16T10:00:00+05:30').title, 'LEGS WORKOUT');

  // 2026-10-17 is Saturday -> Triceps
  assert.equal(getWorkoutForDate('2026-10-17T10:00:00+05:30').title, 'TRICEPS WORKOUT');

  // 2026-10-18 is Sunday -> Rest Day
  const sundayWorkout = getWorkoutForDate('2026-10-18T10:00:00+05:30');
  assert.equal(sundayWorkout.title, 'REST DAY');
  assert.equal(sundayWorkout.isRest, true);
});

test('Calendar navigation: Leap year 2024 and month transitions', () => {
  // February 2024 is a leap year (29 days)
  // Feb 28, 2024 was Wednesday -> Shoulders
  assert.equal(getWorkoutForDate(new Date(2024, 1, 28)).title, 'SHOULDERS WORKOUT');
  // Feb 29, 2024 was Thursday -> Biceps
  assert.equal(getWorkoutForDate(new Date(2024, 1, 29)).title, 'BICEPS WORKOUT');
  // March 1, 2024 was Friday -> Legs
  assert.equal(getWorkoutForDate(new Date(2024, 2, 1)).title, 'LEGS WORKOUT');

  // February 2023 was NOT a leap year (28 days)
  // Feb 28, 2023 was Tuesday -> Back
  assert.equal(getWorkoutForDate(new Date(2023, 1, 28)).title, 'BACK WORKOUT');
  // March 1, 2023 was Wednesday -> Shoulders
  assert.equal(getWorkoutForDate(new Date(2023, 2, 1)).title, 'SHOULDERS WORKOUT');
});

test('calculateMonthStats: Correctly counts active days vs rest days for month length', () => {
  // February 2024 (leap year, 29 days: 4 Sundays, 25 active days)
  const feb2024Stats = calculateMonthStats(2024, 1, [], new Date(2024, 1, 29));
  assert.equal(feb2024Stats.activeDays + feb2024Stats.restDays, 29);
  assert.equal(feb2024Stats.restDays, 4); // 4 Sundays in Feb 2024 (4, 11, 18, 25)
  assert.equal(feb2024Stats.activeDays, 25);
  assert.equal(feb2024Stats.rate, Math.round((25 / 29) * 100));

  // October 2026 (31 days: 4 Sundays, 27 active days)
  const oct2026Stats = calculateMonthStats(2026, 9, [], new Date(2026, 9, 31));
  assert.equal(oct2026Stats.activeDays + oct2026Stats.restDays, 31);
  assert.equal(oct2026Stats.restDays, 4);
  assert.equal(oct2026Stats.activeDays, 27);
  assert.equal(oct2026Stats.rate, Math.round((27 / 31) * 100));
});

test('Gym timezone date conversion: Does not suffer UTC rollover before 5:30 AM IST', () => {
  // 12:30 AM IST on October 12, 2026 corresponds to October 11, 2026 19:00:00 UTC
  const dateAroundMidnightIST = new Date('2026-10-11T19:00:00.000Z');
  const dateStr = getGymDateString(dateAroundMidnightIST);
  assert.equal(dateStr, '2026-10-12');

  // getGymDayOfWeek should be Monday (1)
  const dayOfWeek = getGymDayOfWeek(dateAroundMidnightIST);
  assert.equal(dayOfWeek, 1);

  // getWorkoutForDate should be Chest Workout
  const workout = getWorkoutForDate(dateAroundMidnightIST);
  assert.equal(workout.title, 'CHEST WORKOUT');
});
