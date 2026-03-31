import React from 'react';

const Gallery = () => {
  const images = [
    "/photos/WhatsApp Image 2026-03-31 at 9.38.40 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.43 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.44 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.45 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.46 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.47 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.48 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.52 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.53 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.55 PM.jpeg",
    "/photos/WhatsApp Image 2026-03-31 at 9.38.56 PM.jpeg",
    "/photos/anastase-maragos-7kEpUPB8vNk-unsplash.jpg",
    "/photos/rodrigo-s-2mz9IKab7DE-unsplash.jpg",
    "/photos/sven-mieke-jO6vBWX9h9Y-unsplash.jpg",
    "/photos/victor-freitas-WvDYdXDzkhs-unsplash.jpg"
  ];

  return (
    <section className="py-32 relative min-h-screen">
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24">
        <div className="text-center mb-24 animate-boss-reveal opacity-0" style={{ animationDelay: '100ms' }}>
          <h2 className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-6">Visual Experience</h2>
          <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">GYM GALLERY</h3>
          <p className="text-[#555] max-w-xl mx-auto font-medium">Take a tour of our elite facilities and modern training environment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((src, index) => (
            <div key={index} className="aspect-square bg-[#111] border border-[#1a1a1a] rounded-sm relative overflow-hidden group">
              <img 
                src={src} 
                alt={`Gallery ${index + 1}`} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-end p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">New Boss Gym · Elite Training</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-12 bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm text-center">
          <h4 className="text-xl font-black uppercase tracking-tight mb-4">Visit Us in Person</h4>
          <p className="text-[#555] text-sm mb-8 max-w-md mx-auto">The best way to experience New Boss Gym is to walk through our doors. Schedule a free tour today.</p>
          <button className="bg-primary text-black px-10 py-4 rounded-sm font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white transition-all">
            Schedule Tour
          </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
