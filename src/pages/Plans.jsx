import React from 'react';
import { Check, Sparkles, Shield, Zap, ArrowRight, Award, Dumbbell, Clock, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const Plans = () => {
  const { settings: gymSettings } = useSettings();

  const handleWhatsAppJoin = () => {
    const phoneNumber = "919876543210";
    const text = `Hello Boss Gym! I want to enroll in the ₹800/month Elite Access Membership. Please share registration details.`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-[#faf9f6]">
      {/* Dark Brand Header */}
      <section className="relative py-20 md:py-28 bg-[#151515] text-white overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img 
            src="/photos/sven-mieke-jO6vBWX9h9Y-unsplash.jpg" 
            alt="Gym Barbell Close-Up" 
            className="w-full h-full object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-[#151515]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} className="text-gold-400" />
              <span>Transparent Pricing • Zero Gimmicks</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-6 leading-[1.05]">
              ONE SIMPLE PASS. <br />
              <span className="text-gold-400">UNLIMITED ACCESS.</span>
            </h1>
            <p className="text-neutral-300 text-base sm:text-lg leading-relaxed font-normal max-w-2xl">
              No hidden fees, no annual maintenance traps, and no surprise cancellation charges. Join Pondicherry's premier fitness brotherhood for just ₹800/month.
            </p>
          </div>
        </div>
      </section>

      {/* Split Editorial Membership Presentation */}
      <section className="py-20 md:py-32">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left: High-Impact Real Gym Imagery Showcase (Col 1-6) */}
            <div className="lg:col-span-6 relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-[#e8e4d8] shadow-2xl relative group">
                <img 
                  src="/photos/sven-mieke-jO6vBWX9h9Y-unsplash.jpg" 
                  alt="Boss Gym Lifter" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                
                {/* Floating Athlete Tag */}
                <div className="absolute top-6 left-6 bg-neutral-950/80 backdrop-blur-md border border-gold-500/40 rounded-2xl px-4 py-2 text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gold-400">BOSS ATHLETE</p>
                  <p className="text-xs font-bold">Muthaliyarpet, Pondicherry</p>
                </div>

                {/* Bottom Story Quote */}
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="w-10 h-1 bg-gold-400 mb-4" />
                  <p className="text-lg sm:text-xl font-black uppercase tracking-tight leading-snug mb-2">
                    "EXCELLENCE IS NOT AN ACT, BUT A HABIT."
                  </p>
                  <p className="text-xs text-neutral-300 font-medium">
                    Equipped with Olympic bars, heavy dumbbell racks, and pin-loaded machines.
                  </p>
                </div>
              </div>

              {/* Decorative Accent Ring */}
              <div className="absolute -bottom-6 -right-6 w-36 h-36 border border-gold-300/40 rounded-3xl -z-10 bg-gold-100/30 hidden sm:block" />
            </div>

            {/* Right: Premium Dark Metallic VIP Credential Card (Col 7-12) */}
            <div className="lg:col-span-6">
              <div className="relative bg-[#171717] border-2 border-gold-500/50 rounded-3xl p-8 sm:p-10 md:p-12 shadow-2xl text-white overflow-hidden">
                {/* Top Subtle Metallic Sheen */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* VIP Header Pill */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
                      <Award size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gold-400">OFFICIAL PASS</p>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white">
                        ELITE ALL-ACCESS
                      </h3>
                    </div>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-gold-400 text-neutral-950 font-black text-[10px] uppercase tracking-widest shadow-md">
                    POPULAR
                  </span>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-2xl sm:text-3xl font-black text-gold-400">₹</span>
                  <span className="text-6xl sm:text-7xl font-black text-white tracking-tight leading-none">800</span>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-2">/ 30 Days</span>
                </div>

                {/* Active Simulated Duration Progress Bar */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 mb-8">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Clock size={12} className="text-gold-400" />
                      Session Validity
                    </span>
                    <span className="text-gold-400">Full 30 Days</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 h-full rounded-full w-full" />
                  </div>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-3.5 mb-8">
                  {[
                    "Unlimited Gym Floor & Free-Weight Access",
                    "Olympic Dumbbell Arena (Full Rack Range)",
                    "Biomechanic Plate-Loaded Machinery",
                    "Dual-Pulley Cable Crossover Towers",
                    "Daily Digital QR Attendance & Workout Tracking",
                    "Locker & Air-Conditioned Changing Rooms",
                    "Complimentary Form & Technique Guidance"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-neutral-200">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <button
                  onClick={handleWhatsAppJoin}
                  className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-500 text-neutral-950 py-4 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-gold-600/30 active:scale-95 cursor-pointer"
                >
                  <span>Claim Membership Via WhatsApp</span>
                  <ArrowRight size={16} />
                </button>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold text-neutral-400 uppercase tracking-widest pt-6 border-t border-white/10">
                  <span className="flex items-center gap-1.5">
                    <Zap size={13} className="text-gold-400" /> Zero Admission Fees
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield size={13} className="text-gold-400" /> Instant Activation
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Assurance Grid */}
      <section className="pb-20 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              title: "No Surprise Charges",
              desc: "What you see is what you pay. ₹800 covers complete facility access without tier restrictions."
            },
            {
              title: "No Contract Lock-in",
              desc: "Pay month to month. Renew on your terms with our seamless digital member passport."
            },
            {
              title: "Prime Location",
              desc: "Located on 100ft Road, Muthaliyarpet with dedicated parking for two-wheelers and cars."
            }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-[#e8e4d8] rounded-2xl p-6 shadow-xs">
              <p className="text-xs font-black uppercase tracking-wider text-neutral-900 mb-2">{item.title}</p>
              <p className="text-xs text-neutral-600 leading-relaxed font-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Plans;
