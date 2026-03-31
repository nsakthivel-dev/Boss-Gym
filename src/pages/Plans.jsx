import React from 'react';
import { ChevronRight } from 'lucide-react';

const Plans = () => {
  return (
    <section className="py-32 relative">
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24">
        <div className="text-center mb-24">
          <h2 className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-6">Membership</h2>
          <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">AFFORDABLE EXCELLENCE</h3>
          <p className="text-[#555] max-w-xl mx-auto font-medium">Get full access to everything New Boss Gym has to offer for one simple, unbeatable price.</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="p-12 border rounded-sm flex flex-col h-full transition-all duration-500 bg-primary text-black border-primary scale-105 shadow-[0_20px_60px_rgba(232,201,126,0.15)] z-10">
            <h4 className="text-3xl font-black uppercase tracking-tighter mb-2 text-center">ELITE ACCESS</h4>
            <p className="text-[10px] font-black uppercase tracking-widest mb-10 text-black/60 text-center">30 DAYS MEMBERSHIP</p>
            
            <div className="flex items-baseline justify-center gap-1 mb-12">
              <span className="text-2xl font-black uppercase tracking-tighter">₹</span>
              <span className="text-8xl font-black uppercase tracking-tighter leading-none">600</span>
            </div>
            
            <div className="space-y-6 mb-16 flex-1">
              {[
                "Full Gym Access", 
                "Professional Equipment", 
                "Locker Room Access", 
                "Mobile Check-in System",
                "Workout Schedule",
                "Expert Support"
              ].map((f, fi) => (
                <div key={fi} className="flex items-center gap-4">
                  <ChevronRight size={14} className="text-black" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{f}</span>
                </div>
              ))}
            </div>
            
            <button className="w-full py-5 rounded-sm font-black uppercase text-[10px] tracking-[0.3em] transition-all bg-black text-white hover:bg-white hover:text-black">
              Join Now
            </button>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-[#444] text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-center">No Hidden Fees · No Registration Charges</p>
        </div>
      </div>
    </section>
  );
};

export default Plans;
