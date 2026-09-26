import React from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronRight,
  LifeBuoy,
  ShieldCheck,
  Code,
  Zap,
  Clock,
  ExternalLink
} from 'lucide-react';

const SupportPage = () => {
  const ContactCard = ({ icon: Icon, title, description, value, actionLabel, href, colorClasses }) => (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card hover:border-gold-300 transition-all flex flex-col justify-between group">
      <div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses.bg} ${colorClasses.text} transition-transform group-hover:scale-105 shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-text-main font-black text-base uppercase tracking-tight">{title}</h3>
        <p className="text-muted text-[11px] font-semibold mt-0.5 mb-4">{description}</p>
      </div>

      <div className="pt-4 border-t border-border-light flex items-center justify-between">
        <span className="text-text-main font-bold text-xs truncate max-w-[180px]">{value}</span>
        <a 
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-1 text-gold-600 hover:text-gold-700 font-bold text-xs uppercase tracking-wider"
        >
          <span>{actionLabel}</span>
          <ChevronRight size={14} />
        </a>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-gold-50 border border-gold-200 px-3.5 py-1.5 rounded-full">
          <LifeBuoy size={14} className="text-gold-600" />
          <span className="text-[10px] font-black text-gold-700 uppercase tracking-widest">Support Center</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-text-main uppercase tracking-tight">How Can We Help You?</h1>
        <p className="text-muted text-xs md:text-sm font-semibold max-w-lg mx-auto">
          Dedicated technical and operational assistance provided by Lupus Venture
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ContactCard 
          icon={MessageCircle}
          title="Instant Chat"
          description="Average response time under 5 minutes"
          value="Chat on WhatsApp"
          actionLabel="Open Chat"
          href="https://wa.me/919345993085?text=Hello%20Lupus%20Venture,%20I%20need%20support%20with%20New%20Boss%20Gym%20App"
          colorClasses={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
        />
        <ContactCard 
          icon={Phone}
          title="Direct Phone Line"
          description="Mon - Sat · 10:00 AM - 7:00 PM IST"
          value="+91 93459 93085"
          actionLabel="Call Now"
          href="tel:+919345993085"
          colorClasses={{ bg: 'bg-gold-50', text: 'text-gold-600' }}
        />
        <ContactCard 
          icon={Mail}
          title="Email Helpdesk"
          description="Guaranteed 12h resolution window"
          value="touch@lupusventure.com"
          actionLabel="Send Email"
          href="mailto:touch@lupusventure.com?subject=New%20Boss%20Gym%20Support%20Request"
          colorClasses={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
        />
      </div>

      {/* SLA Commitment Banner */}
      <div className="bg-white border border-gold-200/80 rounded-2xl p-6 sm:p-8 md:p-10 shadow-card relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gold-50 text-gold-600 border border-gold-200">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-text-main uppercase tracking-tight">
                Lupus Venture Reliability Commitment
              </h2>
            </div>
            <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
              Your gym management system is monitored 24/7 to ensure zero downtime, rapid member check-in verification, and seamless PWA auto-updates.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gold-600 text-xs font-bold uppercase">
                  <Zap size={14} />
                  <span>Uptime</span>
                </div>
                <p className="text-text-main font-black text-sm">99.9% Active</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gold-600 text-xs font-bold uppercase">
                  <Code size={14} />
                  <span>Updates</span>
                </div>
                <p className="text-text-main font-black text-sm">Automated</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gold-600 text-xs font-bold uppercase">
                  <Clock size={14} />
                  <span>Response</span>
                </div>
                <p className="text-text-main font-black text-sm">&lt; 15 Mins</p>
              </div>
            </div>
          </div>

          <div className="bg-background-soft border border-border-light rounded-2xl p-6 text-center space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Engineering Partner</span>
              <h3 className="text-text-main font-black text-base uppercase">Lupus Venture</h3>
            </div>
            <a 
              href="mailto:touch@lupusventure.com?subject=Priority%20Ticket%20-%20New%20Boss%20Gym"
              className="inline-flex items-center justify-center gap-2 w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all text-center"
            >
              Raise Priority Ticket
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
