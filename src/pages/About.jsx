import React from 'react';
import { Dumbbell } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const About = () => {
  const { settings: gymSettings } = useSettings();
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative">
            <div className="aspect-[4/5] bg-[#111] border border-[#1a1a1a] rounded-sm relative overflow-hidden group">
              <img 
                src="/photos/WhatsApp Image 2026-03-31 at 9.38.46 PM.jpeg" 
                alt="About Gym" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center p-12">
                 <Dumbbell size={120} className="text-primary/10 group-hover:text-primary/20 transition-all group-hover:rotate-12 duration-700" />
              </div>
              <div className="absolute bottom-10 left-10">
                <p className="text-4xl font-black uppercase leading-none tracking-tighter text-white">ESTABLISHED <br /> 2024</p>
              </div>
            </div>
            {/* Decorative Accent */}
            <div className="absolute -top-10 -right-10 w-40 h-40 border-2 border-primary/20 rounded-sm -z-10" />
          </div>
          
          <div>
            <h2 className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-6">Our Philosophy</h2>
            <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-10 leading-none">WE DON'T JUST TRAIN, <br /> WE MANAGE GROWTH</h3>
            <p className="text-[#888] text-lg leading-relaxed mb-10 font-medium">
              {gymSettings.gymName || 'Boss Gym'} isn't your average fitness center. We operate on a principle of "Elite Management" — treating your fitness journey with the same precision and dedication as a high-performance business.
            </p>
            
            <div className="space-y-6 mb-12">
              {[
                "Personalized workout architecture",
                "Nutrition & Recovery management",
                "Global standard equipment",
                "Motivational elite community"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(232,201,126,0.8)]" />
                  <span className="text-sm font-bold uppercase tracking-widest text-[#555]">{item}</span>
                </div>
              ))}
            </div>
            
            <button className="bg-[#111] border border-[#1a1a1a] text-white px-10 py-5 rounded-sm font-black uppercase text-xs tracking-[0.2em] hover:border-primary/50 hover:text-primary transition-all">
              The Boss Story
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
