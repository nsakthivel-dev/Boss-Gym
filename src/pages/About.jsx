import React from 'react';
import { Dumbbell, Award, Target, Shield, CheckCircle2, Flame, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const About = () => {
  const { settings: gymSettings } = useSettings();

  return (
    <div className="bg-[#faf9f6]">
      {/* Brand Hero Header */}
      <div className="relative py-12 md:py-16 bg-[#151515] text-white overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img 
            src="/photos/gallery/1000076818.jpg" 
            alt="New Boss Gym Interior Floor" 
            className="w-full h-full object-cover object-top opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-[#151515]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-400 text-[11px] font-bold uppercase tracking-widest mb-4">
                <Award size={14} className="text-gold-400" />
                <span>Pondicherry's Elite Training Ground</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4 leading-[1.05]">
                BUILT FOR STRENGTH. <br />
                <span className="text-gold-400">DESIGNED FOR GLORY.</span>
              </h1>
              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed font-normal max-w-2xl">
                At <strong className="text-white font-bold">{gymSettings.gymName || 'New Boss Gym'}</strong>, we bridge raw determination with biomechanically superior equipment. Located at 100ft Road, Muthaliyarpet, we forge athletes of every level.
              </p>
            </div>

            {/* Stay Strong Animated Transparent GIF */}
            <div className="shrink-0 self-start md:self-center">
              <img 
                src="/photos/stay-strong-staystrong.gif" 
                alt="Stay Strong" 
                className="w-32 sm:w-40 md:w-48 lg:w-52 h-auto drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Single Master Section: Master Mani Suni */}
      <section className="py-10 md:py-14 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            
            {/* Left: Tall Master Portrait Showcase (Col 1-5 / full head-to-waist visibility) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative z-10 w-full max-w-[430px] h-[520px] sm:h-[580px] lg:h-[620px] rounded-3xl overflow-hidden border-2 border-gold-500/50 shadow-2xl group bg-[#111111]">
                <img 
                  src="/photos/gallery/1000076818.jpg" 
                  alt="Master Mani Suni - Boss Gym Founder & Head Coach" 
                  className="w-full h-full object-cover object-[center_12%] group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating Credential Chip */}
                <div className="absolute top-4 left-4 z-20 bg-neutral-950/90 backdrop-blur-md text-white border border-gold-400/50 rounded-2xl px-3 py-1.5 shadow-xl flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
                    <Award size={14} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-gold-400">Founder & Chief Coach</p>
                    <p className="text-[11px] font-bold text-white leading-none">Master Trainer</p>
                  </div>
                </div>

                {/* Sleek Master Identity Bottom Strip - low profile over shorts */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-gold-500/40 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gold-400 block leading-tight">
                      My Self
                    </span>
                    <p className="text-lg font-black uppercase tracking-tight text-white leading-tight">
                      Mani Suni
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-gold-400 bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/30">
                    Boss Gym Head Coach
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Master Details perfectly filling photo height (Col 6-12) */}
            <div className="lg:col-span-7 lg:pl-2 flex flex-col justify-between h-full py-0.5">
              {/* Header & Bio */}
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-50 border border-gold-200 text-gold-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                  <Target size={14} className="text-gold-600" />
                  <span>Meet The Master</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black uppercase tracking-tight text-neutral-900 mb-3 leading-[1.05]">
                  MASTER MANI SUNI <br />
                  <span className="text-gold-700">FOUNDER & HEAD COACH</span>
                </h2>
                
                <p className="text-neutral-700 text-sm sm:text-[15px] leading-relaxed mb-2.5 font-normal">
                  With over a decade of competitive bodybuilding experience and high-performance training, <strong className="text-neutral-900 font-bold">Master Mani Suni</strong> founded New Boss Gym on 100ft Road, Muthaliyarpet to give athletes an authentic training ground dedicated to real physical transformations.
                </p>

                <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed font-normal">
                  He personally directs the workout architecture of every member who steps onto our floor — ensuring every repetition is biomechanically precise, joint-safe, and engineered for maximum muscular development.
                </p>
              </div>

              {/* Coach Credential Stat Bar - Fills the vertical gap with authoritative proof */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-neutral-900 text-white rounded-2xl border border-neutral-800 shadow-md my-2">
                <div className="text-center border-r border-neutral-800 pr-2">
                  <p className="text-lg sm:text-xl font-black text-gold-400 font-athletic">10+ YRS</p>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Competitive Lifting</p>
                </div>
                <div className="text-center border-r border-neutral-800 pr-2">
                  <p className="text-lg sm:text-xl font-black text-gold-400 font-athletic">100+</p>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Athletes Coached</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-black text-gold-400 font-athletic">1-ON-1</p>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Daily Supervision</p>
                </div>
              </div>
              
              {/* 2x2 Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-1">
                {[
                  { title: "Championship Technique", desc: "Hands-on posture & joint-safe lifting correction" },
                  { title: "Customized Splits", desc: "Scientific 7-day progressive workout architecture" },
                  { title: "Nutritional Blueprints", desc: "Real-world dietary strategies for dense muscle" },
                  { title: "Daily Accountability", desc: "Direct 1-on-1 mentorship to break mental barriers" }
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-white border border-[#e2ddd0] rounded-2xl flex items-start gap-2.5 shadow-sm hover:border-gold-400 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={16} className="text-gold-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-neutral-900 leading-tight">{item.title}</p>
                      <p className="text-[11px] text-neutral-600 leading-snug mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link 
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-neutral-950 px-7 py-3.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-md shadow-gold-600/20 active:scale-95"
                >
                  <span>Train With Master Mani Suni</span>
                  <ArrowRight size={15} />
                </Link>
                <Link 
                  to="/plans"
                  className="inline-flex items-center justify-center bg-white border border-[#e2ddd0] hover:border-gold-400 text-neutral-900 px-7 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all hover:bg-neutral-50 active:scale-95"
                >
                  View ₹800 VIP Pass
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Dark Rhythm: Master Training Pillars */}
      <section className="py-20 md:py-28 bg-[#151515] text-white relative overflow-hidden border-y border-white/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-gold-400 mb-2 block">Our Standard</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
              THE 4 PILLARS OF <span className="text-gold-400">BOSS GYM</span>
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base">
              Every detail of our gym in Muthaliyarpet is crafted to eliminate excuses and foster peak performance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: "01",
                title: "Progressive Overload",
                desc: "Micro-calibrated weight increments to ensure steady, injury-free muscle hypertrophy."
              },
              {
                num: "02",
                title: "Nutritional Rigor",
                desc: "Macro-balanced diet blueprints to fuel intense sessions and expedite muscular repair."
              },
              {
                num: "03",
                title: "Iron Discipline",
                desc: "Real-time digital QR tracking to build unbroken consistency and hold you accountable."
              },
              {
                num: "04",
                title: "Master Supervision",
                desc: "Coaches with decades of cumulative competitive lifting and personal coaching experience."
              }
            ].map((pillar, i) => (
              <div 
                key={i}
                className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 hover:border-gold-500/40 transition-all duration-300 group hover:-translate-y-1"
              >
                <span className="text-3xl sm:text-4xl font-black text-gold-400/40 group-hover:text-gold-400 transition-colors block mb-4">
                  {pillar.num}
                </span>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2 group-hover:text-gold-300 transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
