import React, { useState } from 'react';
import { ChevronRight, Shield, Zap, Target, Award, Users, Trophy, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const Home = () => {
  const { settings: gymSettings } = useSettings();
  const [showMaster, setShowMaster] = useState(false);
  
  const features = [
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Elite Security",
      desc: "Advanced QR-based access control for your safety."
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: "High Intensity",
      desc: "Modern equipment designed for maximum performance."
    },
    {
      icon: <Target className="w-6 h-6 text-primary" />,
      title: "Expert Coaching",
      desc: "Certified professionals to manage your fitness path."
    },
    {
      icon: <Award className="w-6 h-6 text-primary" />,
      title: "Premium Facility",
      desc: "World-class environment for an elite experience."
    }
  ];

  const stats = [
    { value: "500+", label: "Elite Members", icon: <Users className="w-5 h-5" /> },
    { value: "50+", label: "Modern Equipment", icon: <Trophy className="w-5 h-5" /> },
    { value: "10+", label: "Expert Trainers", icon: <Star className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="/photos/anastase-maragos-7kEpUPB8vNk-unsplash.jpg" 
            alt="Gym Background" 
            className="w-full h-full object-cover opacity-50 scale-100 animate-in fade-in duration-1000"
            style={{ objectPosition: 'center 20%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]" />
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
            Experience the pinnacle of fitness at {gymSettings.gymName || 'Boss Gym'}. We combine world-class equipment with elite coaching to help you dominate your goals.
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

      {/* Stats Section */}
      <section className="py-20 bg-[#080808] border-y border-white/5">
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-sm text-primary group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <h4 className="text-4xl font-black text-white mb-2 tracking-tighter">{stat.value}</h4>
                <p className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-6">Why Choose Us</h2>
            <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">THE ELITE <br /> EXPERIENCE</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-10 bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm hover:border-primary/30 transition-all group">
                <div className="mb-8 p-4 bg-primary/10 border border-primary/20 w-fit rounded-sm group-hover:rotate-12 transition-transform">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight text-white mb-4">{feature.title}</h4>
                <p className="text-sm text-[#555] font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-95" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary opacity-10 blur-[100px] -rotate-12 translate-x-1/2" />
        
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24 relative z-10 text-center">
          <h2 className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-8">Ready to Start?</h2>
          <h3 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-12 leading-tight">
            BECOME THE <br /> BOSS OF YOUR BODY
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link to="/contact" className="w-full md:w-auto bg-primary text-black px-16 py-6 rounded-sm font-black uppercase text-sm tracking-[0.3em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
              Join the Elite
            </Link>
            <Link to="/about" className="text-white text-[10px] font-black uppercase tracking-[0.4em] hover:text-primary transition-colors flex items-center gap-3 group">
              Our Story <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Floating "Master" Button - Redesigned FAB */}
      <div className="fixed bottom-10 right-10 z-[100]">
        <button 
          onClick={() => setShowMaster(true)}
          className="relative group flex items-center justify-center"
        >
          {/* Pulsing Outer Glow */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse group-hover:bg-primary/40 transition-all duration-700" />
          
          {/* Button Core */}
          <div className="relative w-16 h-16 bg-[#0a0a0a] border border-primary/30 rounded-full flex items-center justify-center text-primary group-hover:scale-110 group-hover:border-primary group-hover:text-white transition-all duration-500 shadow-2xl">
            <Trophy size={28} className="animate-in fade-in zoom-in duration-1000" />
          </div>

          {/* Floating Tooltip */}
          <div className="absolute right-full mr-6 py-3 px-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 pointer-events-none">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Show The Master</span>
          </div>
        </button>
      </div>

      {/* Master Modal Overlay - Redesigned for better image placement */}
      {showMaster && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop with standard blurred effect */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-500"
            onClick={() => setShowMaster(false)}
          />
          
          {/* Modal Content - Zoomed out and centered */}
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
            {/* Accessible Close Button - Top Right */}
            <button 
              onClick={() => setShowMaster(false)}
              className="absolute -top-14 right-0 text-white/60 hover:text-primary transition-all duration-300 p-3 bg-white/5 md:bg-transparent rounded-full md:rounded-none z-[1100]"
              aria-label="Close Master View"
            >
              <X size={28} strokeWidth={2} />
            </button>
            
            {/* Image Container - Focused on visibility */}
            <div className="w-full h-full flex flex-col items-center">
              <div 
                className="relative border border-white/5 rounded-sm overflow-hidden bg-black/40 p-1 cursor-pointer"
                onClick={() => setShowMaster(false)}
              >
                <img 
                  src="/photos/gallery/1000076836.jpg" 
                  alt="The Master" 
                  className="max-h-[65vh] md:max-h-[75vh] w-auto object-contain block mx-auto"
                />
                {/* Subtle overlay details */}
                <div className="absolute inset-0 pointer-events-none border border-primary/5" />
              </div>
              
              <div className="mt-6 md:mt-10 text-center space-y-3">
                <div className="w-12 h-[1px] bg-primary/30 mx-auto" />
                <h4 className="text-primary text-[11px] font-black uppercase tracking-[1em] pl-[1em]">The Master</h4>
                
                {/* Mobile-Friendly Close Button at Bottom */}
                <button 
                  onClick={() => setShowMaster(false)}
                  className="mt-4 px-8 py-3 bg-[#111] border border-[#1a1a1a] text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-sm hover:bg-primary hover:text-black transition-all"
                >
                  Close Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

