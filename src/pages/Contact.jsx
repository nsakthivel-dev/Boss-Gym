import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, MessageCircle, Send, Sparkles, Dumbbell, ShieldCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Contact = () => {
  const { settings: gymSettings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleWhatsAppRedirect = (e) => {
    e.preventDefault();
    const { name, email, message } = formData;
    const phoneNumber = "919876543210"; // Gym's WhatsApp number
    const text = `Hello New Boss Gym! %0A%0AMy Name: ${name}%0AMy Email: ${email}%0A%0AMessage: ${message}`;
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="bg-[#faf9f6]">
      {/* Dark Brand Header */}
      <section className="relative py-20 md:py-28 bg-[#151515] text-white overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img 
            src="/photos/rodrigo-s-2mz9IKab7DE-unsplash.jpg" 
            alt="Gym Lifter Focus" 
            className="w-full h-full object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-[#151515]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} className="text-gold-400" />
              <span>Direct Athlete Support</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-6 leading-[1.05]">
              GET IN TOUCH. <br />
              <span className="text-gold-400">START YOUR GRIND.</span>
            </h1>
            <p className="text-neutral-300 text-base sm:text-lg leading-relaxed font-normal max-w-2xl">
              Have questions about workout routines, membership passes, or personal training? Reach out directly via WhatsApp or visit our gym on 100ft Road, Pondicherry.
            </p>
          </div>
        </div>
      </section>

      {/* Asymmetric Split Layout */}
      <section className="py-20 md:py-32">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left: Real Gym Image + Key Info Cards (Col 1-6) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Gym Image Card with Live Facility Status */}
              <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-[#e8e4d8] shadow-lg group">
                <img 
                  src="/photos/rodrigo-s-2mz9IKab7DE-unsplash.jpg" 
                  alt="Boss Gym Equipment Floor" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/30 to-transparent" />
                
                <div className="absolute top-4 left-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-emerald-500/40 text-white text-[11px] font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Gym Open Today</span>
                  </div>
                </div>

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <p className="text-xs font-black uppercase text-gold-400 tracking-widest mb-1">Muthaliyarpet Facility</p>
                  <p className="text-lg font-black uppercase leading-tight">100ft Road, Near Signal, Pondicherry</p>
                </div>
              </div>

              {/* Grid of Contact Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { 
                    icon: MapPin, 
                    title: "Facility Location", 
                    content: gymSettings.address || "100ft Road, Muthaliyarpet, Pondicherry - 605004" 
                  },
                  { 
                    icon: Phone, 
                    title: "Hotline / WhatsApp", 
                    content: gymSettings.phoneNumber || "+91 98765 43210" 
                  },
                  { 
                    icon: Mail, 
                    title: "Official Email", 
                    content: gymSettings.contactEmail || "bossgympondicherry@gmail.com" 
                  },
                  { 
                    icon: Clock, 
                    title: "Training Hours", 
                    content: "Mon - Sat: 5:00 AM - 10:00 PM (Sun: 6:00 AM - 12:00 PM)" 
                  }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="bg-white border border-[#e8e4d8] hover:border-gold-300 p-5 rounded-2xl shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gold-50 border border-gold-100 flex items-center justify-center text-gold-700 mb-3">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight leading-snug">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Channels */}
              <div className="bg-white border border-[#e8e4d8] p-6 rounded-2xl shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Community Channels
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-medium">Follow workouts & member stories</p>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { icon: Instagram, label: "Instagram", url: "#" },
                    { icon: Facebook, label: "Facebook", url: "#" },
                    { icon: Twitter, label: "Twitter", url: "#" }
                  ].map((s, i) => (
                    <a 
                      key={i} 
                      href={s.url} 
                      aria-label={s.label}
                      className="w-10 h-10 rounded-xl bg-[#faf9f6] border border-[#e8e4d8] hover:border-gold-400 text-neutral-700 hover:text-gold-700 flex items-center justify-center transition-all duration-200 active:scale-95"
                    >
                      <s.icon size={18} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: VIP Direct WhatsApp Form (Col 7-12) */}
            <div className="lg:col-span-6">
              <div className="bg-white border border-[#e8e4d8] p-8 sm:p-10 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-800 text-[10px] font-bold uppercase tracking-wider mb-3">
                    <MessageCircle size={12} className="text-gold-600" />
                    <span>Instant Trainer Response</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
                    Connect With A Trainer
                  </h3>
                  <p className="text-neutral-500 text-xs sm:text-sm font-medium mt-1">
                    Fill the form below to initiate an instant WhatsApp chat with our head coaches.
                  </p>
                </div>

                <form onSubmit={handleWhatsAppRedirect} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#faf9f6] border border-[#e8e4d8] px-4 py-3.5 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:border-gold-500 focus:bg-white transition-all placeholder:text-neutral-400" 
                      placeholder="e.g. SAKTHIVEL N" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#faf9f6] border border-[#e8e4d8] px-4 py-3.5 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:border-gold-500 focus:bg-white transition-all placeholder:text-neutral-400" 
                      placeholder="e.g. yourname@example.com" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Your Fitness Goal or Questions
                    </label>
                    <textarea 
                      required
                      rows="4" 
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#faf9f6] border border-[#e8e4d8] px-4 py-3.5 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:border-gold-500 focus:bg-white transition-all resize-none placeholder:text-neutral-400" 
                      placeholder="e.g. Inquiring about ₹800 monthly pass, muscle gain workout plans, or personal training..." 
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full min-h-[50px] bg-gold-600 hover:bg-gold-500 text-neutral-950 py-4 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-md shadow-gold-600/20 flex items-center justify-center gap-3 active:scale-95 group cursor-pointer"
                  >
                    <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                    <span>Launch WhatsApp Consultation</span>
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 font-semibold uppercase tracking-wider pt-2">
                    <ShieldCheck size={14} className="text-gold-600" />
                    <span>Direct chat • No spam • Immediate reply</span>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
