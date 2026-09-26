import React from 'react';
import { 
  ChevronRight, Shield, Zap, Target, Award, Users, Trophy, 
  Star, ArrowRight, CheckCircle2, Dumbbell, Flame, Clock, 
  MapPin, Activity, Sparkles, Phone, CalendarCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const Home = () => {
  const navigate = useNavigate();
  const { settings: gymSettings } = useSettings();
  
  const disciplines = [
    {
      title: "Heavy Iron & ISO Machines",
      desc: "Biomechanical leverage machines, Olympic barbells, calibrated plates, and multi-grip cable stations.",
      image: "/photos/gallery/1000076824.jpg",
      tag: "Strength Zone"
    },
    {
      title: "Conditioning & Cardio Deck",
      desc: "Commercial treadmills, spin cycles, and high-intensity interval gear engineered for stamina and heart health.",
      image: "/photos/gallery/1000076809.jpg",
      tag: "Endurance"
    },
    {
      title: "Personal Coaching & Splits",
      desc: "Progressive overload guidance, form correction, and tailored nutrition macros by certified master trainers.",
      image: "/photos/gallery/1000076833.jpg",
      tag: "Transformation"
    },
    {
      title: "Clean Recovery & Lockers",
      desc: "Dedicated personal lockers, active stretching zones, and a pristine air-conditioned workout floor.",
      image: "/photos/gallery/1000076836.jpg",
      tag: "Facility"
    }
  ];

  const galleryPreview = [
    "/photos/gallery/1000076824.jpg",
    "/photos/gallery/1000076818.jpg",
    "/photos/gallery/1000076800.jpg",
    "/photos/gallery/1000076839.jpg",
    "/photos/gallery/1000076812.jpg",
    "/photos/gallery/1000076815.jpg",
    "/photos/gallery/1000076821.jpg",
    "/photos/gallery/1000076827.jpg",
    "/photos/gallery/1000076833.jpg",
    "/photos/gallery/1000076836.jpg"
  ];

  return (
    <div className="flex flex-col animate-fade-in font-sans overflow-hidden">
      {/* 1. IMMERSIVE HERO WITH ACTUAL GYM IMAGERY & LAYERED TYPOGRAPHY */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-[#0d0d0d] text-white">
        {/* Real Gym Photo Background with Athletic Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 opacity-40 mix-blend-luminosity"
          style={{ backgroundImage: `url('/photos/victor-freitas-WvDYdXDzkhs-unsplash.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d]/90 via-[#0d0d0d]/40 to-[#0d0d0d]/90 pointer-events-none" />

        {/* Ambient Gold Glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gold-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gold-400/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10 py-10 md:py-14 text-center lg:text-left w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
            
            {/* Left Column: Bold Headline & Call to Action */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#1c1c1c]/90 border border-gold-500/40 rounded-full shadow-lg backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse"></span>
                <span className="text-[11px] sm:text-xs font-black text-gold-400 uppercase tracking-widest font-athletic">
                  Premier Strength Club · Muthaliyarpet, Pondicherry
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tight text-white leading-[0.92] font-athletic">
                <span>TRAIN HARD.</span> <br />
                <span className="text-white">LIVE STRONG.</span> <br />
                <span className="text-gold-gradient">DOMINATE.</span>
              </h1>
              
              <p className="max-w-2xl text-neutral-300 text-sm sm:text-base md:text-lg font-medium leading-relaxed">
                Step into <strong className="text-white font-bold">{gymSettings.gymName || 'New Boss Gym'}</strong> near 100ft Road. Built for serious lifters, athletic conditioning, and real physical transformations. No gimmicks, just pure iron and elite discipline.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link 
                  to="/contact" 
                  className="w-full sm:w-auto min-h-[50px] bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 active:scale-95 text-neutral-950 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all shadow-gold-md flex items-center justify-center gap-2 font-athletic"
                >
                  <span>Start Your Evolution</span>
                  <ArrowRight size={16} />
                </Link>
                <Link 
                  to="/plans" 
                  className="w-full sm:w-auto min-h-[50px] bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] hover:border-gold-400 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 font-athletic active:scale-95"
                >
                  <span>₹800 Monthly Membership</span>
                  <ChevronRight size={16} className="text-gold-400" />
                </Link>
              </div>

              {/* Real Facility Features - The 3 Key Sentences */}
              <div className="pt-8 border-t border-[#262626] flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 text-xs font-bold uppercase tracking-wider text-neutral-300 font-athletic">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gold-400 shrink-0" />
                  <span>GPS Geofence Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-gold-400 shrink-0" />
                  <span>Zero Registration Charges</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-gold-400 shrink-0" />
                  <span>Air-Conditioned Gym Floor</span>
                </div>
              </div>
            </div>

            {/* Right Column: Master Mani Suni Photo Showcase with full width & height */}
            <div className="lg:col-span-5 hidden lg:flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[440px] xl:max-w-[480px] h-[560px] lg:h-[600px] xl:h-[640px] rounded-3xl overflow-hidden border-2 border-gold-500/50 shadow-2xl group bg-[#111111]">
                <img 
                  src="/photos/gallery/1000076818.jpg" 
                  alt="Master Mani Suni - Boss Gym Founder" 
                  className="w-full h-full object-cover object-[center_12%] group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating Master Badge */}
                <div className="absolute top-4 left-4 z-20 bg-neutral-950/90 backdrop-blur-md text-white border border-gold-400/50 rounded-2xl px-3 py-1.5 shadow-xl flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
                    <Award size={14} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-gold-400 font-athletic">Head Coach</p>
                    <p className="text-[11px] font-bold text-white leading-none font-athletic">Master Mani Suni</p>
                  </div>
                </div>

                {/* Sleek Master Identity Bottom Strip - low profile over shorts */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-gold-500/40 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gold-400 block font-athletic leading-tight">
                      My Self
                    </span>
                    <p className="text-lg font-black uppercase tracking-tight text-white font-athletic leading-tight">
                      Mani Suni
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-gold-400 bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/30 font-athletic">
                    Boss Gym Head Coach
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. ATHLETIC METRIC COUNTERS (Dark Contrast Band with High-Impact Stats) */}
      <section className="py-12 bg-[#121212] border-b border-[#262626] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: "100+", label: "Athletes Enrolled", sub: "Active community", icon: Users },
              { value: "50+", label: "Heavy Equipment", sub: "Machines & free weights", icon: Dumbbell },
              { value: "₹800", label: "Monthly Plan", sub: "Zero hidden charges", icon: Trophy },
              { value: "100%", label: "Coaching Attention", sub: "Master trainer led", icon: Star }
            ].map((stat, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-gold-500/40 transition-colors flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 shrink-0">
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white font-athletic tracking-tight leading-none">{stat.value}</p>
                  <p className="text-xs font-black uppercase tracking-wider text-gold-400 font-athletic mt-1">{stat.label}</p>
                  <p className="text-[10px] text-neutral-400 font-medium hidden sm:block">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SPLIT EDITORIAL SECTION: ABOUT THE GYM & REAL INTERIOR (White + Charcoal Editorial) */}
      <section className="py-20 md:py-28 bg-[#f8f7f3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left: Overlapping Real Photo Composition */}
            <div className="lg:col-span-6 relative">
              <div className="relative z-10 w-full aspect-[4/3] rounded-3xl overflow-hidden border border-[#e7e2d5] shadow-lg">
                <img 
                  src="/photos/gallery/1000076836.jpg" 
                  alt="Boss Gym Equipment Floor" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-4 w-2/3 aspect-[4/3] rounded-3xl overflow-hidden border-4 border-white shadow-2xl hidden sm:block z-20">
                <img 
                  src="/photos/gallery/1000076827.jpg" 
                  alt="Boss Gym Muthaliyarpet" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Gold frame accent */}
              <div className="absolute -top-4 -left-4 w-32 h-32 border-2 border-gold-400 rounded-3xl -z-10 hidden sm:block" />
            </div>

            {/* Right: Content & Philosophy */}
            <div className="lg:col-span-6 space-y-6 pt-6 sm:pt-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-50 border border-gold-200 text-gold-800 text-[11px] font-black uppercase tracking-wider font-athletic">
                <Award size={14} className="text-gold-600" />
                <span>The Boss Standard</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-900 leading-tight font-athletic">
                BEST GYM IN MUTHALIYARPET, <br />
                <span className="text-gold-700">PONDICHERRY</span>
              </h2>

              <p className="text-neutral-700 text-sm sm:text-base leading-relaxed">
                At <strong className="text-neutral-900 font-semibold">{gymSettings.gymName || 'New Boss Gym'}</strong>, we believe serious transformations happen when raw iron meets dedicated coaching. Located near 100ft Road, our facility is engineered with heavy-duty leverage equipment, dumbbells up to 40kg, and dedicated functional zones.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Personalized 7-day workout split architecture",
                  "Nutrition guidance & progressive overload tracking",
                  "Contactless mobile GPS check-in system",
                  "Clean, hygienic, motivating training atmosphere"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white border border-[#e7e2d5] rounded-2xl shadow-xs">
                    <CheckCircle2 size={18} className="text-gold-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-neutral-800 uppercase tracking-wide font-athletic">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center min-h-[44px] bg-neutral-900 hover:bg-neutral-800 text-gold-400 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all font-athletic active:scale-95"
                >
                  <span>Our Story & Facility</span>
                  <ChevronRight size={14} className="ml-1" />
                </Link>
                <Link
                  to="/gallery"
                  className="inline-flex items-center justify-center min-h-[44px] bg-white border border-[#e7e2d5] hover:border-gold-400 text-neutral-800 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all font-athletic active:scale-95"
                >
                  <span>Explore Photos</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. VISUAL GEAR & DISCIPLINES GRID WITH REAL GYM PHOTOS */}
      <section className="py-20 md:py-28 bg-white border-y border-[#e7e2d5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-700 block mb-2 font-athletic">
              World-Class Equipment & Zones
            </span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-neutral-900 font-athletic">
              ENGINEERED FOR PERFORMANCE
            </h2>
            <p className="text-neutral-600 text-xs sm:text-sm font-medium mt-3 leading-relaxed">
              Step inside our Muthaliyarpet gym floor. Every machine and training zone is selected to maximize muscle hypertrophy, functional strength, and injury-free workouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {disciplines.map((item, i) => (
              <div 
                key={i} 
                className="group bg-[#faf9f6] border border-[#e7e2d5] hover:border-gold-400 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full aspect-[16/10] overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-3 left-3 bg-[#111]/80 backdrop-blur-md border border-gold-400/40 text-gold-400 text-[9px] font-black uppercase px-2.5 py-1 rounded-full font-athletic">
                      {item.tag}
                    </span>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-base font-black uppercase tracking-tight text-neutral-900 mb-2 font-athletic">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <div className="pt-4 border-t border-[#e7e2d5] flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-gold-700 font-athletic">Full Access Included</span>
                    <Link to="/training" className="text-neutral-400 hover:text-neutral-900 transition-colors">
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. DARK FITNESS SHOWCASE: ALL-INCLUSIVE ₹800 VIP MEMBERSHIP */}
      <section className="py-20 md:py-28 bg-[#151515] text-white relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: `url('/photos/sven-mieke-jO6vBWX9h9Y-unsplash.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-[#151515]/90 to-[#151515] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-gradient-to-br from-[#1f1f1f] via-[#171717] to-[#121212] border border-gold-500/40 rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
            
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[10px] font-black uppercase tracking-widest font-athletic">
                <Sparkles size={12} />
                <span>Transparent Membership Guarantee</span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-white tracking-tight font-athletic leading-tight">
                ONE UNBEATABLE PRICE. <br />
                <span className="text-gold-gradient">₹800 / MONTH.</span> FULL ACCESS.
              </h3>
              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed font-medium">
                No hidden admission charges. No annual maintenance trickery. Get unrestricted access to all strength zones, cardio equipment, locker rooms, and mobile attendance tracking.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-bold text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-gold-400 shrink-0" />
                  <span>Full Gym Floor Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-gold-400 shrink-0" />
                  <span>Cardio & Functional Zones</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-gold-400 shrink-0" />
                  <span>Locker & Recovery Facility</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-gold-400 shrink-0" />
                  <span>Trainer Guidance Included</span>
                </div>
              </div>
            </div>

            {/* VIP Pass Card UI */}
            <div className="shrink-0 w-full lg:w-96 bg-[#111111] border-2 border-gold-500 rounded-3xl p-8 text-center shadow-2xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gold-500 text-neutral-950 font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full font-athletic shadow-md">
                VIP Access Pass
              </div>

              <p className="text-xs font-black uppercase tracking-wider text-neutral-400 font-athletic mt-2">All-Inclusive Gym Plan</p>
              
              <div className="flex items-baseline justify-center gap-1 my-6 pb-6 border-b border-[#262626]">
                <span className="text-2xl font-black text-white">₹</span>
                <span className="text-6xl sm:text-7xl font-black text-white font-athletic tracking-tight">800</span>
                <span className="text-xs font-bold text-gold-400 ml-1">/ month</span>
              </div>

              <Link 
                to="/plans" 
                className="w-full min-h-[48px] bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black py-4 rounded-xl text-xs uppercase tracking-wider text-center shadow-gold-sm transition-all font-athletic flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Join Now</span>
                <ArrowRight size={15} />
              </Link>

              <p className="text-[10px] text-neutral-400 uppercase font-athletic tracking-wider mt-4">
                Instant Activation Upon Enrolment
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. REAL GYM GALLERY PREVIEW STRIP - CONTINUOUS NON-STOP MARQUEE (LEFT TO RIGHT) */}
      <section className="py-10 md:py-14 bg-[#f8f7f3] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-700 block mb-1 font-athletic">
                Inside The Club
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-neutral-900 font-athletic">
                MASTER SNEAK PEEK
              </h2>
            </div>
            <Link 
              to="/gallery" 
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gold-700 hover:text-gold-800 font-athletic transition-colors"
            >
              <span>View All 16 Photos</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Full-width continuous left-to-right infinite moving marquee */}
        <div className="relative w-full overflow-hidden">
          {/* Edge fading gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#f8f7f3] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#f8f7f3] to-transparent z-10 pointer-events-none" />

          {/* Marquee Track */}
          <div className="animate-marquee-ltr flex items-center gap-4 sm:gap-6 py-2">
            {[...galleryPreview, ...galleryPreview].map((src, i) => (
              <div 
                key={i} 
                onClick={() => navigate('/gallery')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/gallery')}
                className="shrink-0 w-60 sm:w-68 md:w-72 h-[340px] sm:h-[380px] md:h-[420px] rounded-3xl overflow-hidden border border-[#e7e2d5] hover:border-gold-500/60 group relative shadow-md transition-all duration-300 bg-neutral-900 cursor-pointer select-none active:scale-[0.98]"
              >
                <img 
                  src={src} 
                  alt={`Boss Gym Master ${i + 1}`} 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-85 transition-opacity pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gold-400 bg-neutral-950/80 px-2.5 py-1 rounded-lg border border-gold-500/30 backdrop-blur-xs font-athletic">
                    Boss Gym Master
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-sm">
                    <Sparkles size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
