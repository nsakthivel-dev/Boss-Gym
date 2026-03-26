import React from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Globe, 
  BookOpen, 
  ChevronRight,
  ExternalLink,
  LifeBuoy,
  FileText,
  Video
} from 'lucide-react';

const SupportPage = () => {
  const ContactCard = ({ icon: Icon, title, description, value, actionLabel, color }) => (
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

  const ResourceItem = ({ title, duration, type }) => (
    <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a] last:border-0 hover:bg-[#111] px-4 -mx-4 rounded-lg transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        {type === 'video' ? <Video size={16} className="text-primary" /> : <FileText size={16} className="text-[#555]" />}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-widest group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mt-0.5">{duration}</p>
        </div>
      </div>
      <ExternalLink size={14} className="text-[#333] group-hover:text-white transition-colors" />
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
        <p className="text-muted text-sm uppercase tracking-widest font-bold max-w-xl mx-auto">Get expert assistance and resources for your gym management system</p>
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

      {/* Resources Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Knowledge Base */}
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-primary" />
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Quick Guides</h2>
            </div>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="space-y-2">
            <ResourceItem title="Getting Started with Attendance" duration="5 min read" type="article" />
            <ResourceItem title="Managing Member Plans" duration="8 min video" type="video" />
            <ResourceItem title="QR Code System Setup" duration="3 min read" type="article" />
            <ResourceItem title="Generating Revenue Reports" duration="12 min video" type="video" />
            <ResourceItem title="Staff Role Management" duration="6 min read" type="article" />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "How do I reset a member's QR code?", a: "Go to the Members page, select the member, and click the Regenerate QR button in their profile settings." },
              { q: "Can I use the app offline?", a: "Yes, the system has built-in offline support for check-ins, which will sync to the cloud once connection is restored." },
              { q: "How to add multiple gym branches?", a: "Multi-branch support is available in our Enterprise plan. Please contact our sales team for an upgrade." }
            ].map((faq, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#222] transition-colors">
                <h4 className="text-white text-xs font-black uppercase tracking-widest mb-2">{faq.q}</h4>
                <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Support */}
      <div className="bg-primary p-8 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-black font-black text-2xl uppercase tracking-tighter">Need more help?</h3>
          <p className="text-black/70 text-xs font-bold uppercase tracking-widest mt-1">Lupus Venture is here to resolve any issues with your website.</p>
        </div>
        <button className="bg-black text-primary font-black px-10 py-4 rounded-sm uppercase text-xs tracking-[0.2em] hover:scale-105 transition-all shadow-2xl">
          Raise Ticket
        </button>
      </div>
    </div>
  );
};

export default SupportPage;
