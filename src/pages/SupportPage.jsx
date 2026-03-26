import React from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronRight,
  LifeBuoy,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Code,
  Zap,
  Clock
} from 'lucide-react';

const SupportPage = () => {
  const ContactCard = ({ icon: Icon, title, description, value, color }) => (
    <div className="bg-card border border-border rounded-xl p-6 group hover:border-primary/30 transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <h3 className="text-white font-bold text-lg uppercase tracking-tight">{title}</h3>
      <p className="text-[#555] text-[10px] font-bold uppercase tracking-[0.2em] mt-1 mb-4">{description}</p>
      <div className="flex items-center justify-between gap-4 mt-auto">
        <span className="text-white font-bold text-sm tracking-widest">{value}</span>
        <button className="text-primary hover:text-primary/80 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-4">
          <LifeBuoy size={14} className="text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Support Center</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">How can we help?</h1>
        <p className="text-muted text-sm uppercase tracking-widest font-bold max-w-xl mx-auto">Direct technical assistance from Lupus Venture</p>
      </div>

      {/* Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ContactCard 
          icon={MessageCircle}
          title="Live Support"
          description="Average response time: 5 mins"
          value="Chat with Lupus Venture"
          color="bg-success"
        />
        <ContactCard 
          icon={Phone}
          title="Tech Support"
          description="Mon - Sat | 10:00 - 19:00"
          value="+91 93459 93085"
          color="bg-primary"
        />
        <ContactCard 
          icon={Mail}
          title="Email Support"
          description="Guaranteed 12h response"
          value="touch@lupusventure.com"
          color="bg-info"
        />
      </div>

      {/* New Bottom Section: Our Commitment */}
      <div className="bg-[#0d0d0d] border border-primary/20 rounded-2xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/30" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} className="text-primary" />
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Lupus Venture Commitment</h2>
            </div>
            <p className="text-[#888] text-sm font-medium leading-relaxed max-w-2xl">
              We are dedicated to providing the most reliable gym management experience. Our team at Lupus Venture monitors your system 24/7 to ensure zero downtime and peak performance for your business.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Zap size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Performance</span>
                </div>
                <p className="text-white text-xs font-bold uppercase tracking-widest">99.9% Uptime</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Code size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Development</span>
                </div>
                <p className="text-white text-xs font-bold uppercase tracking-widest">Weekly Updates</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Clock size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Support</span>
                </div>
                <p className="text-white text-xs font-bold uppercase tracking-widest">Instant Fixes</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-[#111] border border-[#1a1a1a] rounded-xl p-8 space-y-6">
            <div className="text-center">
              <p className="text-[#444] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Technical Partner</p>
              <h3 className="text-white font-black text-xl tracking-tighter uppercase">Lupus Venture</h3>
            </div>
            <button className="w-full bg-primary text-black font-black py-4 rounded-sm uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-transform shadow-xl shadow-primary/10">
              Raise Priority Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;

