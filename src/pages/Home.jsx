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
            alt="New Boss Gym in Muthaliyarpet Pondicherry" 
            className="w-full h-full object-cover opacity-50 scale-100 animate-in fade-in duration-1000"
            style={{ objectPosition: 'center 20%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]" />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 md:px-16 lg:px-24 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 md:px-5 md:py-2 bg-primary/10 backdrop-blur-md border border-primary/20 rounded-full mb-6 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em] md:tracking-[0.5em]">Elite Fitness Destination</span>
          </div>
          
          <h1 className="text-4xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter mb-6 md:mb-10 leading-[0.85] flex flex-col items-center overflow-hidden">
            <span className="animate-boss-reveal opacity-0" style={{ animationDelay: '200ms' }}>New Boss Gym</span>
            <span className="text-primary text-outline-primary animate-boss-reveal opacity-0 mt-1 md:mt-2 text-2xl md:text-5xl lg:text-7xl" style={{ animationDelay: '500ms' }}>Best Gym in Muthaliyarpet</span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-[#888] text-xs md:text-lg font-medium leading-relaxed mb-8 md:mb-12 animate-boss-reveal opacity-0 px-2 md:px-4" style={{ animationDelay: '800ms' }}>
            Experience the ultimate fitness transformation at <span className="text-white">New Boss Gym</span>, the premier <span className="text-white">fitness center in Pondicherry</span>. 
            Located conveniently near <span className="text-white">100ft Road</span>, we specialize in <span className="text-white">weight training</span>, <span className="text-white">cardio</span>, 
            and <span className="text-white">personal training</span>. Our expert trainers provide personalized <span className="text-white">diet guidance</span> to help you 
            dominate your fitness goals in <span className="text-white">Muthaliyarpet</span>.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <Link to="/contact" className="w-full md:w-auto bg-primary text-black px-8 md:px-12 py-4 md:py-5 rounded-sm font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-[0_10px_30px_rgba(232,201,126,0.2)] text-center">
              Start Your Journey
            </Link>
            <Link to="/plans" className="w-full md:w-auto bg-[#111] border border-[#1a1a1a] text-white px-8 md:px-12 py-4 md:py-5 rounded-sm font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:border-primary/50 transition-all flex items-center justify-center gap-3">
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
      <section className="py-16 md:py-24 bg-[#050505] border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(232,201,126,0.05),transparent_70%)]" />
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 md:px-16 lg:px-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="mb-4 md:mb-6 p-3 md:p-4 bg-white/[0.03] border border-white/10 rounded-full text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-500">
                  {stat.icon}
                </div>
                <h4 className="text-4xl md:text-6xl font-black text-white mb-2 md:mb-3 tracking-tighter tabular-nums">{stat.value}</h4>
                <p className="text-[8px] md:text-[10px] font-black text-[#666] uppercase tracking-[0.3em] md:tracking-[0.4em] group-hover:text-primary transition-colors">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 relative overflow-hidden bg-[#080808]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 md:px-16 lg:px-24 relative z-10">
          <div className="text-center mb-12 md:mb-24">
            <h2 className="text-primary text-[8px] md:text-[10px] font-black tracking-[0.4em] md:tracking-[0.6em] uppercase mb-4 md:mb-6">Premium Standards</h2>
            <h3 className="text-3xl md:text-7xl font-black uppercase tracking-tighter leading-none">THE BOSS <br /> <span className="text-outline-white">EXPERIENCE</span></h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
            {features.map((feature, i) => (
              <div key={i} className="p-6 md:p-12 bg-[#0a0a0a] border border-white/5 hover:bg-[#111] hover:border-primary/20 transition-all duration-500 group relative">
                <div className="absolute top-0 left-0 w-1 h-0 bg-primary group-hover:h-full transition-all duration-500" />
                <div className="mb-6 md:mb-10 p-4 md:p-5 bg-primary/10 border border-primary/20 w-fit rounded-sm group-hover:bg-primary group-hover:text-black transition-all duration-500">
                  {feature.icon}
                </div>
                <h4 className="text-lg md:text-xl font-black uppercase tracking-tight text-white mb-3 md:mb-4 group-hover:text-primary transition-colors">{feature.title}</h4>
                <p className="text-xs md:text-sm text-[#555] font-medium leading-relaxed group-hover:text-[#888] transition-colors">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-40 bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/photos/victor-freitas-WvDYdXDzkhs-unsplash.jpg" 
            alt="New Boss Gym Background" 
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>
        
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 md:px-16 lg:px-24 relative z-10">
          <div className="max-w-3xl">
            <h2 className="text-primary text-[8px] md:text-[10px] font-black tracking-[0.4em] md:tracking-[0.6em] uppercase mb-6 md:mb-8">Ready to Start?</h2>
            <h3 className="text-3xl md:text-8xl font-black uppercase tracking-tighter text-white mb-8 md:mb-12 leading-[0.9]">
              BECOME THE <br /> <span className="text-primary">BOSS</span> OF YOUR <br /> OWN BODY
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <Link to="/contact" className="w-full md:w-auto bg-primary text-black px-12 md:px-16 py-4 md:py-6 rounded-sm font-black uppercase text-[10px] md:text-sm tracking-[0.3em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(232,201,126,0.2)] text-center">
                Join the Elite
              </Link>
              <Link to="/about" className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] hover:text-primary transition-colors flex items-center gap-3 md:gap-4 group">
                Our Philosophy <div className="w-8 md:w-12 h-px bg-primary/30 group-hover:w-16 md:group-hover:w-20 group-hover:bg-primary transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating "Master" Button - Redesigned FAB */}
      <div className="fixed bottom-6 md:bottom-10 right-4 md:right-10 z-[100]">
        <button 
          onClick={() => setShowMaster(true)}
          className="relative group flex items-center justify-center"
        >
          {/* Pulsing Outer Glow */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse group-hover:bg-primary/40 transition-all duration-700" />
          
          {/* Button Core */}
          <div className="relative w-14 h-14 md:w-16 md:h-16 bg-[#0a0a0a] border border-primary/30 rounded-full flex items-center justify-center text-primary group-hover:scale-110 group-hover:border-primary group-hover:text-white transition-all duration-500 shadow-2xl">
            <Trophy size={24} className="md:w-7 md:h-7 animate-in fade-in zoom-in duration-1000" />
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
                  alt="New Boss Gym in Muthaliyarpet Pondicherry" 
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

