import React from 'react';
import { Users, Dumbbell, ShieldCheck, ArrowRight } from 'lucide-react';

const Services = () => {
  return (
    <section className="py-32 relative">
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24">
        <div className="text-center mb-24">
          <h2 className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-6">Our Expertise</h2>
          <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">ELITE SERVICES</h3>
          <p className="text-[#555] max-w-xl mx-auto font-medium">Precision-engineered fitness solutions for the modern achiever.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
          {[
            {
              title: "Elite Coaching",
              desc: "Work with master trainers dedicated to your specific physiological needs and goals.",
              icon: Users
            },
            {
              title: "Advanced Gear",
              desc: "Full access to professional-grade equipment for strength, cardio, and functional training.",
              icon: Dumbbell
            },
            {
              title: "Safe Environment",
              desc: "24/7 monitoring and high-standard hygiene protocols for a secure workout experience.",
              icon: ShieldCheck
            },
            {
              title: "Nutrition Plan",
              desc: "Expert guidance on fueling your body for maximum performance and recovery.",
              icon: Users
            },
            {
              title: "Personal Training",
              desc: "One-on-one sessions tailored to push you beyond your perceived limits.",
              icon: Dumbbell
            },
            {
              title: "Recovery Zone",
              desc: "Dedicated space for stretching, foam rolling, and active recovery techniques.",
              icon: ShieldCheck
            }
          ].map((feature, i) => (
            <div key={i} className="bg-[#050505] p-16 group hover:bg-[#0a0a0a] transition-all">
              <div className="mb-10 inline-block p-4 bg-[#111] rounded-sm group-hover:bg-primary group-hover:text-black transition-all">
                <feature.icon size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-6 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-[#555] leading-relaxed font-medium">{feature.desc}</p>
              <div className="mt-10 flex items-center gap-3 text-primary/40 group-hover:text-primary transition-all">
                <span className="text-[10px] font-black uppercase tracking-widest">Learn More</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
