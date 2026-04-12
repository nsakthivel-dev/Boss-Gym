import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, MessageCircle } from 'lucide-react';
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
    const phoneNumber = "919876543210"; // Your gym's WhatsApp number
    const text = `Hello New Boss Gym! %0A%0AMy Name: ${name}%0AMy Email: ${email}%0A%0AMessage: ${message}`;
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
  };

  return (
    <section className="py-20 relative min-h-screen overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse delay-1000" />

      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24">
        <div className="text-center mb-16 animate-boss-reveal opacity-0" style={{ animationDelay: '100ms' }}>
          <h2 className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-4">Get in Touch</h2>
          <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">START YOUR <br /> <span className="text-outline-primary">EVOLUTION</span></h3>
          <p className="text-[#555] max-w-xl mx-auto text-sm font-medium">Ready to dominate? Our elite team is standing by to manage your fitness journey.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-32 items-start">
          {/* Contact Info */}
          <div className="space-y-8">
            {[
              { icon: MapPin, title: "Headquarters", content: gymSettings.address || "123 Elite Street, Fitness City, State 56789" },
              { icon: Phone, title: "Direct Line", content: gymSettings.phoneNumber || "+91 98765 43210" },
              { icon: Mail, title: "Official Email", content: gymSettings.contactEmail || "hello@newbossgym.com" },
              { icon: Clock, title: "Elite Hours", content: "Mon - Sat: 5:00 AM - 10:00 PM" }
            ].map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-6 group animate-boss-reveal opacity-0"
                style={{ animationDelay: `${300 + (i * 150)}ms` }}
              >
                <div className="p-4 bg-[#111] border border-[#1a1a1a] rounded-sm group-hover:border-primary transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_rgba(232,201,126,0.1)]">
                  <item.icon size={20} className="text-primary/40 group-hover:text-primary transition-all duration-500" />
                </div>
                <div>
                  <h4 className="text-[9px] font-black text-[#333] uppercase tracking-[0.4em] mb-1">{item.title}</h4>
                  <p className="text-lg font-bold text-[#888] group-hover:text-white transition-colors duration-500 tracking-tight">{item.content}</p>
                </div>
              </div>
            ))}

            <div className="pt-12 border-t border-[#1a1a1a] animate-boss-reveal opacity-0" style={{ animationDelay: '900ms' }}>
              <h4 className="text-[9px] font-black text-white uppercase tracking-[0.4em] mb-8">Follow Our Growth</h4>
              <div className="flex gap-4">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a key={i} href="#" className="p-4 bg-[#111] border border-[#1a1a1a] rounded-sm text-[#333] hover:text-primary hover:border-primary/50 transition-all duration-500 hover:-translate-y-2">
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div 
            className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 md:p-12 rounded-sm relative overflow-hidden group animate-boss-reveal opacity-0 shadow-2xl"
            style={{ animationDelay: '600ms' }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/10 group-hover:bg-primary transition-colors duration-700" />
            <div className="mb-8">
              <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Direct Connect</h4>
              <p className="text-[#444] text-[10px] font-bold uppercase tracking-widest">Send us a WhatsApp message directly</p>
            </div>

            <form onSubmit={handleWhatsAppRedirect} className="space-y-6">
              <div className="space-y-2 group/input">
                <label className="text-[9px] font-black text-[#222] group-focus-within/input:text-primary transition-colors uppercase tracking-[0.3em]">Full Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#111] border border-[#1a1a1a] px-6 py-4 rounded-sm text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-[#222]" 
                  placeholder="e.g. SAKTHIVEL N" 
                />
              </div>
              <div className="space-y-2 group/input">
                <label className="text-[9px] font-black text-[#222] group-focus-within/input:text-primary transition-colors uppercase tracking-[0.3em]">Email Address</label>
                <input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#111] border border-[#1a1a1a] px-6 py-4 rounded-sm text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-[#222]" 
                  placeholder="e.g. touch@lupusventure.com" 
                />
              </div>
              <div className="space-y-2 group/input">
                <label className="text-[9px] font-black text-[#222] group-focus-within/input:text-primary transition-colors uppercase tracking-[0.3em]">Message</label>
                <textarea 
                  required
                  rows="3" 
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#111] border border-[#1a1a1a] px-6 py-4 rounded-sm text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-all resize-none placeholder:text-[#222]" 
                  placeholder="Tell us about your fitness goals..." 
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-primary text-black py-4 rounded-sm font-black uppercase text-[10px] tracking-[0.4em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(232,201,126,0.1)] flex items-center justify-center gap-4 group/btn"
              >
                <MessageCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                Connect on WhatsApp
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
