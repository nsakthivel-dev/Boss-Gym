import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  Clock, 
  Calendar, 
  Sparkles, 
  Flame, 
  Award, 
  Target, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  ArrowUpRight, 
  X, 
  ChevronRight,
  Zap,
  RotateCcw,
  Layers,
  TrendingUp,
  HeartPulse
} from 'lucide-react';

const WEEKLY_SPLIT_DATA = [
  {
    dayNumber: 1,
    dayName: 'MONDAY',
    title: 'CHEST WORKOUT',
    dayIndex: 1,
    isRest: false,
    focusTag: 'Pectoral Mass, Pressing Strength & Density',
    muscles: ['Upper Chest', 'Mid Chest', 'Lower Chest'],
    sessionStructure: [
      { phase: 'Phase 01', name: 'Warm Up', detail: 'Rotator cuff and pectoral activation' },
      { phase: 'Phase 02', name: 'Compound Movement', detail: 'Heavy flat & incline multi-joint pressing' },
      { phase: 'Phase 03', name: 'Isolation', detail: 'Converging angle presses and deep flyes' },
      { phase: 'Phase 04', name: 'Finisher', detail: 'Bodyweight dips & peak contraction pump' }
    ],
    estimatedTime: '55–70 MIN',
    shortDescription: 'Multi-angle horizontal and incline pressing to maximize chest density and shoulder stability.'
  },
  {
    dayNumber: 2,
    dayName: 'TUESDAY',
    title: 'BACK WORKOUT',
    dayIndex: 2,
    isRest: false,
    focusTag: 'Posterior Chain Width, Thickness & Posture',
    muscles: ['Lats', 'Traps', 'Lower Back'],
    sessionStructure: [
      { phase: 'Phase 01', name: 'Warm Up', detail: 'Scapular retractions and lat engagement' },
      { phase: 'Phase 02', name: 'Compound Movement', detail: 'Vertical pull-downs & heavy horizontal rowing' },
      { phase: 'Phase 03', name: 'Isolation', detail: 'Single-arm pulldowns, face pulls & trap shrugs' },
      { phase: 'Phase 04', name: 'Finisher', detail: 'Erector spinae isometric holds' }
    ],
    estimatedTime: '60–75 MIN',
    shortDescription: 'Vertical and horizontal rowing matrix engineered for deep V-taper width and muscular upper back thickness.'
  },
  {
    dayNumber: 3,
    dayName: 'WEDNESDAY',
    title: 'SHOULDER',
    dayIndex: 3,
    isRest: false,
    focusTag: 'Deltoid Aesthetics & Overhead Power',
    muscles: ['Deltoids', 'Rear Delts', 'Overall Shoulder Development'],
    sessionStructure: [
      { phase: 'Phase 01', name: 'Warm Up', detail: 'Dynamic shoulder band warmup & joint lubrication' },
      { phase: 'Phase 02', name: 'Compound Movement', detail: 'Standing or seated overhead press' },
      { phase: 'Phase 03', name: 'Isolation', detail: 'Lateral raises & rear deltoid horizontal flyes' },
      { phase: 'Phase 04', name: 'Finisher', detail: 'Strict upright rows & high-volume pump' }
    ],
    estimatedTime: '50–65 MIN',
    shortDescription: 'Complete 3D deltoid development targeting the anterior, lateral, and posterior heads with strict form.'
  },
  {
    dayNumber: 4,
    dayName: 'THURSDAY',
    title: 'BICEPS',
    dayIndex: 4,
    isRest: false,
    focusTag: 'Flexor Peak, Arm Thickness & Forearms',
    muscles: ['Biceps Brachii', 'Brachialis', 'Forearms'],
    sessionStructure: [
      { phase: 'Phase 01', name: 'Warm Up', detail: 'Wrist, elbow, and forearm mobility prep' },
      { phase: 'Phase 02', name: 'Compound Movement', detail: 'Standing supinated barbell or dumbbell curls' },
      { phase: 'Phase 03', name: 'Isolation', detail: 'Hammer curls & preacher bench concentration curls' },
      { phase: 'Phase 04', name: 'Finisher', detail: 'Pronated reverse curls & forearm grip burnout' }
    ],
    estimatedTime: '45–60 MIN',
    shortDescription: 'Targeted elbow flexor isolation developing high bicep peaks, brachialis fullness, and forearm grip power.'
  },
  {
    dayNumber: 5,
    dayName: 'FRIDAY',
    title: 'LEGS DAY',
    dayIndex: 5,
    isRest: false,
    focusTag: 'Lower Body Strength & Development',
    muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    sessionStructure: [
      { phase: 'Phase 01', name: 'Warm Up', detail: 'Dynamic hip, ankle, and knee mobility' },
      { phase: 'Phase 02', name: 'Compound Movement', detail: 'Primary multi-joint heavy compound foundation' },
      { phase: 'Phase 03', name: 'Isolation', detail: 'Quad extension, hamstring curl & glute targeting' },
      { phase: 'Phase 04', name: 'Finisher', detail: 'Calf overload & metabolic burnout' }
    ],
    estimatedTime: '60–75 MIN',
    shortDescription: 'Comprehensive lower body overload targeting maximal leg development and foundational power.'
  },
  {
    dayNumber: 6,
    dayName: 'SATURDAY',
    title: 'TRICEPS',
    dayIndex: 6,
    isRest: false,
    focusTag: 'Upper Body Arm Extension & Density',
    muscles: ['Long Head', 'Lateral Head', 'Medial Head'],
    sessionStructure: [
      { phase: 'Phase 01', name: 'Warm Up', detail: 'Elbow joint activation and light cable movement' },
      { phase: 'Phase 02', name: 'Compound Movement', detail: 'Close-grip pressing & bodyweight lockouts' },
      { phase: 'Phase 03', name: 'Isolation', detail: 'Overhead extension & pressdown angles' },
      { phase: 'Phase 04', name: 'Finisher', detail: 'High-rep sustained tension burnout' }
    ],
    estimatedTime: '45–60 MIN',
    shortDescription: 'Pinpoint extension mechanics isolating all three triceps heads for arm thickness and lockout power.'
  },
  {
    dayNumber: 7,
    dayName: 'SUNDAY',
    title: 'REST DAY',
    dayIndex: 0,
    isRest: true,
    focusTag: 'Recovery, Stretching & Joint Mobility',
    muscles: ['Recovery', 'Stretching', 'Mobility'],
    sessionStructure: [
      { phase: 'Phase 01', name: 'Decompression', detail: 'Spine and lower back active decompression' },
      { phase: 'Phase 02', name: 'Stretching', detail: 'Full-body fascial stretching & hamstring relief' },
      { phase: 'Phase 03', name: 'Mobility', detail: 'Shoulder, thoracic and hip rotational drills' },
      { phase: 'Phase 04', name: 'Regeneration', detail: 'Complete hydration, nutrition & nervous system rest' }
    ],
    estimatedTime: '20–30 MIN',
    shortDescription: 'Scheduled active recovery to reset the central nervous system, restore glycogen, and repair muscle tissue.'
  }
];

const PHILOSOPHY_BLOCKS = [
  {
    number: '01',
    title: 'STRUCTURE',
    description: 'Every session follows a planned training split.',
    highlight: 'No guesswork. Every workout has a dedicated physiological focus.'
  },
  {
    number: '02',
    title: 'INTENSITY',
    description: 'Train with purpose and maintain focus throughout every session.',
    highlight: 'Dialed-in rest periods, strict mechanical form, and controlled tempo.'
  },
  {
    number: '03',
    title: 'CONSISTENCY',
    description: 'Progress comes from showing up and following the plan.',
    highlight: 'Day in, day out execution. Compounding results over time.'
  },
  {
    number: '04',
    title: 'PROGRESSION',
    description: 'Track your training and gradually challenge yourself.',
    highlight: 'Systematic progressive overload to stimulate continuous muscular adaptation.'
  }
];

const FOCUS_AREAS = [
  {
    title: 'STRENGTH',
    tagline: 'Raw Force & Joint Integrity',
    description: 'Build strength and power through structured training.',
    icon: Dumbbell,
    accent: 'border-gold-400/40 hover:border-gold-400',
    badge: 'Heavy Load'
  },
  {
    title: 'HYPERTROPHY',
    tagline: 'Muscular Density & Symmetry',
    description: 'Focus on muscle development and controlled progression.',
    icon: Flame,
    accent: 'border-amber-400/40 hover:border-amber-400',
    badge: 'Muscle Mass'
  },
  {
    title: 'CONDITIONING',
    tagline: 'Endurance & Work Capacity',
    description: 'Improve endurance, work capacity, and overall performance.',
    icon: Activity,
    accent: 'border-blue-400/40 hover:border-blue-400',
    badge: 'Performance'
  },
  {
    title: 'RECOVERY',
    tagline: 'Tissue Repair & Mobility',
    description: 'Support mobility, stretching, recovery, and training consistency.',
    icon: RotateCcw,
    accent: 'border-emerald-400/40 hover:border-emerald-400',
    badge: 'Restoration'
  }
];

const Training = () => {
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Real-time dynamic current day highlight (0 = Sunday, 1 = Monday, etc.)
  const todayIndex = new Date().getDay();

  return (
    <div className="bg-[#faf9f6] text-neutral-900 font-sans selection:bg-gold-500 selection:text-neutral-950">
      
      {/* ==================================================
          PAGE HERO
          ================================================== */}
      <section className="relative min-h-[75vh] md:min-h-[82vh] flex items-center bg-[#111111] text-white overflow-hidden border-b border-[#262626]">
        {/* Real Gym Photo Visual Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none transition-transform duration-1000"
          style={{ backgroundImage: `url('/photos/gallery/1000076824.jpg')` }}
        />
        {/* Deep atmospheric gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#121212]/95 to-[#0d0d0d]/80 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full">
          <div className="max-w-3xl space-y-6">
            
            {/* Athletic Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-black uppercase tracking-[0.25em] font-athletic">
              <Sparkles size={14} className="text-gold-400" />
              <span>Boss Gym Performance Protocol</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white font-athletic leading-[1.05]">
              TRAIN WITH PURPOSE. <br />
              <span className="text-gold-gradient">BUILD WITH DISCIPLINE.</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-neutral-300 font-medium leading-relaxed max-w-2xl">
              A structured weekly training split designed to keep every session focused, consistent, and progressive.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#split"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all shadow-gold-sm hover:scale-[1.02] active:scale-95 font-athletic"
              >
                <span>View Weekly Split</span>
                <ChevronRight size={16} strokeWidth={3} />
              </a>

              <Link
                to="/plans"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] hover:border-gold-400 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 font-athletic"
              >
                <span>Start Your Journey</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-8 grid grid-cols-3 gap-6 border-t border-white/10 max-w-lg">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-gold-400 font-athletic block">7</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-athletic">Day Cycle</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white font-athletic block">6</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-athletic">Workouts</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-athletic block">1</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-athletic">Recovery</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 1 — THE 7-DAY TRAINING SPLIT
          ================================================== */}
      <section id="split" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-700 text-[10px] font-black uppercase tracking-[0.25em] font-athletic">
            <Target size={13} />
            <span>Master 7-Day Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-900 font-athletic">
            THE 7-DAY <span className="text-gold-gradient">TRAINING SPLIT</span>
          </h2>
          <p className="text-sm text-neutral-600 font-medium">
            Every day has a purpose. Every session moves you forward.
          </p>
        </div>

        {/* 7 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {WEEKLY_SPLIT_DATA.map((day) => {
            const isToday = day.dayIndex === todayIndex;

            // Distinct visually rich Rest Day styling
            if (day.isRest) {
              return (
                <div
                  key={day.dayNumber}
                  className="rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative group bg-gradient-to-br from-[#121c17] via-[#101915] to-[#0c1410] border-2 border-emerald-500/40 text-white shadow-xl hover:shadow-2xl hover:border-emerald-400"
                >
                  <div className="space-y-4">
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 font-athletic">
                        DAY 0{day.dayNumber} — {day.dayName}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-athletic flex items-center gap-1.5">
                        <RotateCcw size={11} />
                        Rest & Recovery
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight text-white font-athletic">
                        {day.title}
                      </h3>
                      <p className="text-xs text-emerald-200/80 font-medium mt-1">
                        {day.focusTag}
                      </p>
                    </div>

                    {/* Muscle Focus Bullets */}
                    <div className="pt-2 space-y-1.5 border-t border-emerald-900/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-athletic block">
                        Focus:
                      </span>
                      <ul className="space-y-1">
                        {day.muscles.map((m) => (
                          <li key={m} className="text-xs text-neutral-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-6 mt-6 border-t border-emerald-900/60 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                      <Clock size={13} className="text-emerald-400" />
                      {day.estimatedTime}
                    </span>
                    <button
                      onClick={() => setSelectedDay(day)}
                      className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-300 hover:text-white transition-colors font-athletic group-hover:translate-x-1 duration-200"
                    >
                      <span>VIEW WORKOUT</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            // High-Performance Dark Workout Cards
            return (
              <div
                key={day.dayNumber}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative group bg-[#161616] border ${
                  isToday 
                    ? 'border-gold-400 shadow-gold-sm ring-1 ring-gold-400/40' 
                    : 'border-[#2a2a2a] hover:border-gold-400/70 hover:shadow-xl'
                } text-white`}
              >
                {isToday && (
                  <span className="absolute -top-3 right-6 bg-gold-500 text-neutral-950 text-[10px] font-black uppercase px-3 py-1 rounded-full font-athletic shadow-xs">
                    ACTIVE TODAY
                  </span>
                )}

                <div className="space-y-4">
                  {/* Top Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gold-400 font-athletic">
                      DAY 0{day.dayNumber} — {day.dayName}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 flex items-center justify-center font-athletic">
                      <Dumbbell size={15} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white font-athletic">
                      {day.title}
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium mt-1">
                      {day.focusTag}
                    </p>
                  </div>

                  {/* Muscle Focus Bullets */}
                  <div className="pt-2 space-y-1.5 border-t border-[#262626]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-athletic block">
                      Focus:
                    </span>
                    <ul className="space-y-1">
                      {day.muscles.map((m) => (
                        <li key={m} className="text-xs text-neutral-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="pt-6 mt-6 border-t border-[#262626] flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                    <Clock size={13} className="text-gold-400" />
                    {day.estimatedTime}
                  </span>
                  <button
                    onClick={() => setSelectedDay(day)}
                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gold-400 hover:text-gold-300 transition-colors font-athletic group-hover:translate-x-1 duration-200"
                  >
                    <span>VIEW WORKOUT</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* ==================================================
          SECTION 2 — INTERACTIVE WORKOUT DETAILS (MODAL PANEL)
          ================================================== */}
      {selectedDay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-sans"
          onClick={() => setSelectedDay(null)}
        >
          <div 
            className="w-full max-w-xl bg-[#141414] border border-[#2d2d2d] rounded-3xl text-white shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-[#262626] bg-gradient-to-r from-[#1c1c1c] to-[#141414] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-gold-400 text-xs font-black uppercase tracking-[0.2em] font-athletic mb-1">
                  <span>DAY 0{selectedDay.dayNumber} — {selectedDay.dayName}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-athletic">
                  {selectedDay.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="p-2.5 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] text-neutral-400 hover:text-white transition-colors"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 custom-scrollbar flex-1">
              
              {/* Block 1: TRAINING FOCUS */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold-400 font-athletic block">
                  TRAINING FOCUS
                </span>
                <p className="text-base font-bold text-white font-athletic">
                  {selectedDay.focusTag}
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {selectedDay.shortDescription}
                </p>
              </div>

              {/* Block 2: TARGET MUSCLE GROUPS */}
              <div className="space-y-2 pt-2 border-t border-[#262626]">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold-400 font-athletic block">
                  TARGET MUSCLE GROUPS
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedDay.muscles.map((muscle) => (
                    <span 
                      key={muscle}
                      className="px-3.5 py-1.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs font-bold font-athletic"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Block 3: SESSION STRUCTURE */}
              <div className="space-y-3 pt-2 border-t border-[#262626]">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold-400 font-athletic block">
                  SESSION STRUCTURE
                </span>
                <div className="space-y-2.5">
                  {selectedDay.sessionStructure.map((item, idx) => (
                    <div 
                      key={item.phase}
                      className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#1c1c1c] border border-[#282828]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 font-black text-xs flex items-center justify-center shrink-0 font-athletic">
                        0{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black uppercase tracking-wider text-white font-athletic">
                            {item.name}
                          </p>
                          <span className="text-[10px] text-gold-400 font-mono">{item.phase}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Block 4: ESTIMATED SESSION TIME */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-gold-500/10 via-[#1c1c1c] to-[#1c1c1c] border border-gold-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gold-400 font-athletic block">
                    ESTIMATED SESSION TIME
                  </span>
                  <p className="text-xl font-black text-white font-athletic tracking-tight mt-0.5">
                    {selectedDay.estimatedTime}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-gold-500/20 border border-gold-500/40 text-gold-400 flex items-center justify-center">
                  <Clock size={20} />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#262626] bg-[#111] flex items-center justify-between gap-4">
              <span className="text-xs text-neutral-400">
                Turnstiles & Workout Logs Active
              </span>
              <button
                onClick={() => setSelectedDay(null)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all font-athletic"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          SECTION 4 — TRAINING PHILOSOPHY
          ================================================== */}
      <section className="py-20 md:py-28 bg-[#121212] text-white relative overflow-hidden border-y border-[#262626]">
        <div className="absolute top-0 left-0 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 relative z-10">
          
          <div className="max-w-2xl space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-400 font-athletic block">
              Guiding Principles
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-athletic">
              HOW WE <span className="text-gold-gradient">TRAIN</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 font-medium">
              Four fundamental pillars that separate purposeful gym sessions from wasted time on the floor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PHILOSOPHY_BLOCKS.map((item) => (
              <div 
                key={item.number}
                className="bg-[#181818] border border-[#2b2b2b] hover:border-gold-400/70 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl sm:text-4xl font-black text-gold-400/80 font-athletic group-hover:text-gold-400 transition-colors">
                      {item.number}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-gold-400/40 group-hover:bg-gold-400 transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-black uppercase tracking-wider text-white font-athletic">
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#292929]">
                  <p className="text-[11px] text-neutral-400 font-medium leading-normal">
                    {item.highlight}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==================================================
          SECTION 5 — TRAINING FOCUS
          ================================================== */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-600 font-athletic block">
            Custom Adaptations
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-900 font-athletic">
            CHOOSE YOUR <span className="text-gold-gradient">FOCUS</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 font-medium">
            Calibrate your session variables to align with your personal athletic aspirations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FOCUS_AREAS.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white border border-[#e7e2d5] hover:border-gold-400 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-xl group hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <IconComponent size={22} />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#f4f2ea] text-neutral-700 font-athletic">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-neutral-900 font-athletic">
                      {item.title}
                    </h3>
                    <p className="text-[11px] font-bold text-gold-700 font-athletic mt-0.5">
                      {item.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#f0ece2] flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-neutral-500">Structured Split</span>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* ==================================================
          SECTION 6 — VISUAL BREAK (EDITORIAL PHOTO STYLE)
          ================================================== */}
      <section className="relative py-28 md:py-36 bg-[#111111] text-white overflow-hidden border-y border-[#262626]">
        {/* Real Gym Photo Backdrop */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: `url('/photos/anastase-maragos-7kEpUPB8vNk-unsplash.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#121212]/90 to-[#0d0d0d]/70 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[10px] font-black uppercase tracking-[0.25em] font-athletic">
            <Award size={13} />
            <span>Master Coach Creed</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white font-athletic leading-tight">
            7 DAYS. <br />
            6 TRAINING SESSIONS. <br />
            <span className="text-gold-gradient">1 GOAL.</span>
          </h2>

          <p className="text-base sm:text-lg text-neutral-300 font-medium max-w-xl mx-auto">
            Consistency turns training into progress.
          </p>
        </div>
      </section>

      {/* ==================================================
          SECTION 7 — FINAL CTA
          ================================================== */}
      <section className="py-20 md:py-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="bg-gradient-to-b from-white to-[#faf9f6] border border-[#e7e2d5] rounded-3xl p-8 sm:p-14 shadow-lg space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center mx-auto shadow-sm">
            <Dumbbell size={28} />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-900 font-athletic leading-tight">
              READY TO TRAIN WITH <span className="text-gold-gradient">PURPOSE?</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
              Choose your plan, follow the split, and start building your next level.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/plans"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all shadow-gold-sm hover:scale-[1.02] active:scale-95 font-athletic min-h-[48px]"
            >
              <span>View Plans</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] hover:border-gold-400 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 font-athletic min-h-[48px]"
            >
              <span>Contact Us</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Training;
