import React from 'react';
import { useSettings } from '../context/SettingsContext';

const Gallery = () => {
  const { settings: gymSettings } = useSettings();
  const images = [
    "/photos/1000076797.jpg",
    "/photos/1000076800.jpg",
    "/photos/1000076803.jpg",
    "/photos/1000076806.jpg",
    "/photos/1000076809.jpg",
    "/photos/1000076812.jpg",
    "/photos/1000076815.jpg",
    "/photos/1000076818.jpg",
    "/photos/1000076821.jpg",
    "/photos/1000076824.jpg",
    "/photos/1000076827.jpg",
    "/photos/1000076830.jpg",
    "/photos/1000076833.jpg",
    "/photos/1000076836.jpg",
    "/photos/1000076839.jpg",
    "/photos/1000076845.jpg"
  ];

  return (
    <section className="py-32 relative min-h-screen">
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24">
        <div className="text-center mb-24 animate-boss-reveal opacity-0" style={{ animationDelay: '100ms' }}>
          <h2 className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-6">Visual Experience</h2>
          <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">GYM GALLERY</h3>
          <p className="text-[#555] max-w-xl mx-auto font-medium">Take a tour of our elite facilities and modern training environment.</p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {images.map((src, index) => (
            <div key={index} className="break-inside-avoid mb-4 bg-[#111] border border-[#1a1a1a] rounded-sm relative overflow-hidden group">
              <img 
                src={src} 
                alt={`Gallery ${index + 1}`} 
                className="w-full h-auto opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-end p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">{gymSettings.gymName || 'Boss Gym'} · Elite Training</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-12 bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm text-center">
          <h4 className="text-xl font-black uppercase tracking-tight mb-4">Visit Us in Person</h4>
          <p className="text-[#555] text-sm mb-8 max-w-md mx-auto">The best way to experience {gymSettings.gymName || 'Boss Gym'} is to walk through our doors. Schedule a free tour today.</p>
          <button className="bg-primary text-black px-10 py-4 rounded-sm font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white transition-all">
            Schedule Tour
          </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
