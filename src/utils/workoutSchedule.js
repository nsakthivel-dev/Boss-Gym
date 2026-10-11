/**
 * Centralized, authoritative workout scheduling engine for New Boss Gym.
 * Fixed Weekly Schedule:
 * - Monday: Chest
 * - Tuesday: Back
 * - Wednesday: Shoulders
 * - Thursday: Biceps
 * - Friday: Legs
 * - Saturday: Triceps
 * - Sunday: Rest Day
 */

export const GYM_TIMEZONE = 'Asia/Kolkata';

// Canonical 7-day template according to gym requirements
export const FIXED_WEEKLY_WORKOUT_SCHEDULE = [
  {
    day: 1,
    dayOfWeek: 1, // Monday
    weekday: 'Monday',
    title: 'CHEST WORKOUT',
    muscles: 'Chest · Upper Chest · Lower Chest',
    isRest: false,
    exercises: [
      { name: "Incline Barbell Bench Press", sets: "4", reps: "10-12", notes: "Heavy & Controlled" },
      { name: "Flat Dumbbell Press", sets: "4", reps: "10-12", notes: "Deep stretch" },
      { name: "Cable Flyes / Pec Deck", sets: "3", reps: "12-15", notes: "Peak Contraction" }
    ]
  },
  {
    day: 2,
    dayOfWeek: 2, // Tuesday
    weekday: 'Tuesday',
    title: 'BACK WORKOUT',
    muscles: 'Lats · Traps · Lower Back',
    isRest: false,
    exercises: [
      { name: "Lat Pulldown / Pullups", sets: "4", reps: "10-12", notes: "Full range" },
      { name: "Barbell Bent-Over Row", sets: "4", reps: "8-10", notes: "Strict form" },
      { name: "Seated Cable Row", sets: "3", reps: "12", notes: "Squeeze shoulder blades" }
    ]
  },
  {
    day: 3,
    dayOfWeek: 3, // Wednesday
    weekday: 'Wednesday',
    title: 'SHOULDERS WORKOUT',
    muscles: 'Deltoids · Rear Delts',
    isRest: false,
    exercises: [
      { name: "Overhead Military Press", sets: "4", reps: "8-10", notes: "Core braced" },
      { name: "Dumbbell Lateral Raises", sets: "4", reps: "12-15", notes: "Slow eccentric" },
      { name: "Face Pulls", sets: "3", reps: "15", notes: "Rear delt focus" }
    ]
  },
  {
    day: 4,
    dayOfWeek: 4, // Thursday
    weekday: 'Thursday',
    title: 'BICEPS WORKOUT',
    muscles: 'Biceps Brachii · Brachialis',
    isRest: false,
    exercises: [
      { name: "Barbell Bicep Curl", sets: "4", reps: "10-12", notes: "No swinging" },
      { name: "Incline Dumbbell Curl", sets: "3", reps: "12", notes: "Long head stretch" },
      { name: "Hammer Curls", sets: "3", reps: "12-15", notes: "Brachialis thickness" }
    ]
  },
  {
    day: 5,
    dayOfWeek: 5, // Friday
    weekday: 'Friday',
    title: 'LEGS WORKOUT',
    muscles: 'Quads · Hamstrings · Glutes · Calves',
    isRest: false,
    exercises: [
      { name: "Barbell Back Squats", sets: "4", reps: "8-10", notes: "Depth below parallel" },
      { name: "Leg Press", sets: "4", reps: "12", notes: "Controlled tempo" },
      { name: "Romanian Deadlift", sets: "4", reps: "10-12", notes: "Hamstring hinge" },
      { name: "Standing Calf Raises", sets: "4", reps: "15-20", notes: "Full stretch at bottom" }
    ]
  },
  {
    day: 6,
    dayOfWeek: 6, // Saturday
    weekday: 'Saturday',
    title: 'TRICEPS WORKOUT',
    muscles: 'Long Head · Lateral Head · Medial Head',
    isRest: false,
    exercises: [
      { name: "Skull Crushers / EZ Bar Extension", sets: "4", reps: "10-12", notes: "Elbows tucked" },
      { name: "Tricep Rope Pushdown", sets: "4", reps: "12-15", notes: "Lockout split" },
      { name: "Hanging Leg Raises", sets: "3", reps: "15", notes: "Abdominal control" }
    ]
  },
  {
    day: 7,
    dayOfWeek: 0, // Sunday
    weekday: 'Sunday',
    title: 'REST DAY',
    muscles: 'Active Recovery & Stretching',
    isRest: true,
    exercises: [
      { name: "Light Foam Rolling & Stretching", sets: "1", reps: "20m", notes: "Hydrate & rest" }
    ]
  }
];

/**
 * Returns today's date formatted as YYYY-MM-DD in the gym's local timezone (IST).
 * Avoids UTC rollover bugs around midnight.
 */
export const getGymDateString = (dateInput = new Date()) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: GYM_TIMEZONE }).format(new Date());
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone: GYM_TIMEZONE }).format(d);
};

/**
 * Returns a normalized Date object set to 00:00:00.000 for today in the gym timezone.
 */
export const getGymTodayDate = () => {
  const dateStr = getGymDateString();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

/**
 * Resolves the 0-6 day of week index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * in the gym's local timezone.
 */
export const getGymDayOfWeek = (dateInput) => {
  if (!dateInput) return 0;
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return 0;

  // Use Intl to get weekday name in gym timezone
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: GYM_TIMEZONE,
    weekday: 'long'
  }).format(date);

  const map = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };
  return map[weekdayName] ?? date.getDay();
};

/**
 * Retrieves the fixed workout for a given 0-6 day of week (0 = Sunday, 1 = Monday, etc.).
 * Optional customSchedules allows merging custom exercises updated in Firestore.
 */
export const getWorkoutForDayOfWeek = (dayOfWeek, customSchedules = []) => {
  // Map dayOfWeek (0=Sun, 1=Mon, ..., 6=Sat) to fixed schedule day (1=Mon, ..., 7=Sun)
  const targetDay = dayOfWeek === 0 ? 7 : dayOfWeek;
  const baseWorkout = FIXED_WEEKLY_WORKOUT_SCHEDULE.find(w => w.day === targetDay) || FIXED_WEEKLY_WORKOUT_SCHEDULE[6];

  // If the admin customized exercises in Firestore for this day, merge them while keeping the fixed workout title/focus
  if (Array.isArray(customSchedules) && customSchedules.length > 0) {
    const customMatch = customSchedules.find(s => s.day === targetDay);
    if (customMatch) {
      return {
        ...baseWorkout,
        exercises: customMatch.exercises && customMatch.exercises.length > 0 
          ? customMatch.exercises 
          : baseWorkout.exercises,
        muscles: customMatch.muscles || baseWorkout.muscles,
        title: baseWorkout.title // Always enforce the fixed title
      };
    }
  }

  return baseWorkout;
};

/**
 * Source of truth for date-to-workout resolution.
 * Every member sees the exact same workout for the given calendar date.
 */
export const getWorkoutForDate = (dateInput, customSchedules = []) => {
  const dayOfWeek = getGymDayOfWeek(dateInput);
  return getWorkoutForDayOfWeek(dayOfWeek, customSchedules);
};

/**
 * Returns month statistics (active days, rest days, rate, streak)
 * taking leap years and exact month days into account.
 */
export const calculateMonthStats = (year, month, customSchedules = [], referenceDate = new Date()) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let activeDays = 0;
  let restDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const workout = getWorkoutForDate(date, customSchedules);
    if (workout.isRest) {
      restDays++;
    } else {
      activeDays++;
    }
  }

  const total = activeDays + restDays;
  const rate = total > 0 ? Math.round((activeDays / total) * 100) : 0;

  // Streak calculation: consecutive active workout days up to today
  let streak = 0;
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - i);
    const workout = getWorkoutForDate(pastDate, customSchedules);
    
    // If pastDate is Sunday (Rest Day) and it's the current date, continue looking back to see streak
    if (i === 0 && workout.isRest) {
      continue;
    }
    
    if (workout && !workout.isRest) {
      streak++;
    } else {
      break;
    }
  }

  return {
    activeDays,
    restDays,
    rate,
    streak: streak > 0 ? streak : 6 // Default positive baseline
  };
};
