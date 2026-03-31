import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="/photos/victor-freitas-WvDYdXDzkhs-unsplash.jpg" 
          alt="Gym Background" 
          className="w-full h-full object-cover opacity-30 scale-100 animate-in fade-in duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24 relative z-10 text-center">
        <div className="inline-block px-4 py-1 bg-[#111]/50 backdrop-blur-sm border border-[#1a1a1a] rounded-full mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Elite Management & Training</span>
        </div>
        
        <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-8 leading-[0.85] flex flex-col overflow-hidden">
          <span className="animate-boss-reveal opacity-0" style={{ animationDelay: '200ms' }}>UNLEASH YOUR</span>
          <span className="text-primary text-outline-primary animate-boss-reveal opacity-0" style={{ animationDelay: '500ms' }}>INNER BOSS</span>
        </h1>
        
        <p className="max-w-xl mx-auto text-[#666] text-sm md:text-lg font-medium leading-relaxed mb-12 animate-boss-reveal opacity-0" style={{ animationDelay: '800ms' }}>
          Experience the pinnacle of fitness at New Boss Gym. We combine world-class equipment with elite coaching to help you dominate your goals.
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
          <Link to="/contact" className="w-full md:w-auto bg-primary text-black px-12 py-5 rounded-sm font-black uppercase text-xs tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(232,201,126,0.2)] text-center">
            Start Your Journey
          </Link>
          <Link to="/plans" className="w-full md:w-auto bg-[#111] border border-[#1a1a1a] text-white px-12 py-5 rounded-sm font-black uppercase text-xs tracking-[0.2em] hover:border-primary/50 transition-all flex items-center justify-center gap-3">
            Explore Plans <ChevronRight size={14} className="text-primary" />
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent" />
      </div>
    </section>
  );
};

export default Home;
