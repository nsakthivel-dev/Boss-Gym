import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { Camera, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Gallery = () => {
  const { settings: gymSettings } = useSettings();
  const images = [
    "/photos/gallery/1000076797.jpg",
    "/photos/gallery/1000076800.jpg",
    "/photos/gallery/1000076803.jpg",
    "/photos/gallery/1000076806.jpg",
    "/photos/gallery/1000076809.jpg",
    "/photos/gallery/1000076812.jpg",
    "/photos/gallery/1000076815.jpg",
    "/photos/gallery/1000076818.jpg",
    "/photos/gallery/1000076821.jpg",
    "/photos/gallery/1000076824.jpg",
    "/photos/gallery/1000076827.jpg",
    "/photos/gallery/1000076830.jpg",
    "/photos/gallery/1000076833.jpg",
    "/photos/gallery/1000076836.jpg",
    "/photos/gallery/1000076839.jpg",
    "/photos/gallery/1000076845.jpg"
  ];

  return (
    <section className="py-20 md:py-32 relative min-h-screen bg-[#faf9f6]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-50 border border-gold-200 text-gold-800 text-[11px] font-bold uppercase tracking-wider mb-4">
            <Camera size={14} className="text-gold-600" />
            <span>Visual Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-900 mb-4">
            Gym <span className="text-gold-700">Gallery</span>
          </h2>
          <p className="text-neutral-600 max-w-xl mx-auto font-normal text-sm sm:text-base leading-relaxed">
            Take a visual tour of our elite facilities, international strength equipment, and clean training environment.
          </p>
        </div>

        {/* Masonry Columns */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((src, index) => (
            <div 
              key={index} 
              className="break-inside-avoid bg-white border border-[#e8e4d8] rounded-2xl relative overflow-hidden group shadow-xs hover:shadow-lg transition-all duration-300"
            >
              <img 
                src={src} 
                alt="New Boss Gym in Muthaliyarpet Pondicherry" 
                loading="lazy"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles size={14} className="text-gold-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-white">
                    {gymSettings.gymName || 'Boss Gym'} · Elite Training
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Visit CTA */}
        <div className="mt-20 p-8 sm:p-12 bg-white border border-[#e8e4d8] rounded-3xl shadow-sm text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center mx-auto mb-4">
            <MapPin size={22} />
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-tight text-neutral-900 mb-3">
            Visit Us in Person
          </h3>
          <p className="text-neutral-600 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            The best way to experience {gymSettings.gymName || 'Boss Gym'} is to walk through our doors. Schedule a visit or stop by today.
          </p>
          <Link 
            to="/contact" 
            className="inline-flex items-center justify-center min-h-[44px] bg-gold-600 hover:bg-gold-500 text-neutral-950 px-8 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all shadow-md shadow-gold-600/20 active:scale-95"
          >
            Schedule a Visit
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
