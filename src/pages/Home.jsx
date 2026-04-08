import React from 'react';
import { ChevronRight, Shield, Zap, Target, Award, Users, Trophy, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const Home = () => {
  const { settings: gymSettings } = useSettings();
  
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
    </div>
  );
};

export default Home;

