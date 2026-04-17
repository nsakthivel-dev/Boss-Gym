import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  LogOut,
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Phone,
  Menu,
  X
} from 'lucide-react';
import { NavLink, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

const WebsiteLayout = () => {
  const { currentUser } = useAuth();
  const { settings: gymSettings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Plans', path: '/plans' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary selection:text-black flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 py-5">
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="bg-primary p-1.5 rounded-sm shadow-[0_0_15px_rgba(232,201,126,0.3)] group-hover:scale-110 transition-transform">
                <Dumbbell className="text-black w-5 h-5" />
              </div>
              <span className="font-black text-lg tracking-[0.1em] uppercase">{gymSettings.gymName || 'Boss Gym'}</span>
            </NavLink>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            {navItems.map(item => (
              <NavLink 
                key={item.label} 
                to={item.path} 
                className={({ isActive }) => `text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'text-primary' : 'text-[#666] hover:text-primary'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-6">
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-[7px] font-black text-[#444] uppercase tracking-[0.2em] mb-0.5">Account</p>
                  <p className="text-[10px] font-bold text-white truncate max-w-[150px]">{currentUser?.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-primary/50 hover:text-primary transition-all group"
                  title="Logout"
                >
                  <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            ) : (
              <NavLink 
                to="/login"
                className="bg-primary text-black px-8 py-2.5 rounded-sm font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white transition-all shadow-[0_5px_15px_rgba(232,201,126,0.2)]"
              >
                Login
              </NavLink>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden text-primary p-2 hover:bg-white/5 rounded-sm transition-all"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <div className={`fixed inset-0 z-[100] bg-black transition-all duration-500 lg:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute top-0 right-0 p-8">
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-primary hover:bg-white/5 rounded-sm transition-all"
          >
            <X size={32} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center h-full gap-8">
          <div className="flex items-center gap-3 mb-12">
              <div className="bg-primary p-2 rounded-sm shadow-[0_0_15px_rgba(232,201,126,0.3)]">
                <Dumbbell className="text-black w-6 h-6" />
              </div>
              <span className="font-black text-2xl tracking-[0.1em] uppercase">{gymSettings.gymName || 'Boss Gym'}</span>
            </div>

          {navItems.map(item => (
            <NavLink 
              key={item.label} 
              to={item.path} 
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `text-xl font-black uppercase tracking-[0.3em] transition-all ${isActive ? 'text-primary scale-110' : 'text-[#444] hover:text-primary'}`}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="mt-12">
            {currentUser ? (
              <button 
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 text-error/60 font-black uppercase tracking-widest text-sm hover:text-error transition-all"
              >
                <LogOut size={18} /> Logout
              </button>
            ) : (
              <NavLink 
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-primary text-black px-12 py-4 rounded-sm font-black uppercase text-sm tracking-widest hover:bg-white transition-all"
              >
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#050505] pt-20 pb-8 border-t border-white/5 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 xl:gap-24 mb-16">
            {/* Logo & Description */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary p-2 rounded-sm shadow-[0_0_15px_rgba(232,201,126,0.3)]">
                  <Dumbbell className="text-black w-5 h-5" />
                </div>
                <span className="font-black text-2xl tracking-[0.1em] uppercase">{gymSettings.gymName || 'New Boss Gym'}</span>
              </div>
              <p className="text-[#555] max-w-sm text-[10px] font-bold leading-loose mb-10 uppercase tracking-[0.15em]">
                Redefining the standard of fitness in Pondicherry. Experience the best gym near 100ft Road with elite coaching and modern facilities.
              </p>
              <div className="flex items-center gap-3">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-sm text-[#444] hover:text-primary hover:border-primary/50 hover:-translate-y-1 transition-all duration-500 group">
                    <Icon size={18} className="group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
            
            {/* Facility Links */}
            <div className="md:col-span-3">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-8 relative inline-block">
                Facility
                <span className="absolute -bottom-2 left-0 w-8 h-[1px] bg-primary/30" />
              </h4>
              <ul className="space-y-4">
                {[
                  { label: 'About Us', path: '/about' },
                  { label: 'Services', path: '/services' },
                  { label: 'Workout Plans', path: '/plans' },
                  { label: 'Gallery', path: '/gallery' },
                  { label: 'Contact', path: '/contact' }
                ].map(item => (
                  <li key={item.label}>
                    <Link to={item.path} className="text-[#555] text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white hover:translate-x-2 transition-all duration-300 flex items-center gap-3 group">
                      <span className="w-1.5 h-[1px] bg-[#222] group-hover:w-4 group-hover:bg-primary transition-all" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect Section */}
            <div className="md:col-span-4">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-8 relative inline-block">
                Connect
                <span className="absolute -bottom-2 left-0 w-8 h-[1px] bg-primary/30" />
              </h4>
              <div className="space-y-6">
                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-sm group-hover:border-primary/50 transition-all duration-500">
                    <MapPin size={18} className="text-[#333] group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-[#333] uppercase tracking-[0.3em] mb-1">Location</p>
                    <p className="text-[10px] font-bold text-[#666] uppercase tracking-tighter group-hover:text-white transition-colors">{gymSettings.address || '123 Elite Street, Fitness City'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-sm group-hover:border-primary/50 transition-all duration-500">
                    <Phone size={18} className="text-[#333] group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-[#333] uppercase tracking-[0.3em] mb-1">Phone</p>
                    <p className="text-[10px] font-bold text-[#666] uppercase tracking-tighter group-hover:text-white transition-colors">{gymSettings.phoneNumber || '+91 98765 43210'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-10 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-bold text-[#333] uppercase tracking-[0.3em]">
                  © {new Date().getFullYear()} {gymSettings.gymName || 'Boss Gym'}
                </p>
                <p className="text-[9px] font-medium text-[#222] uppercase tracking-[0.2em]">
                  Elite Management. All Rights Reserved.
                </p>
              </div>

              <div className="hidden md:block h-8 w-px bg-white/5" />

              <div className="flex flex-col items-center md:items-start gap-1">
                <span className="text-[8px] font-black text-[#333] uppercase tracking-[0.4em]">Crafted by</span>
                <a 
                  href="https://lupusventure.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-3"
                >
                  <span className="text-base font-black tracking-[0.2em] uppercase text-white group-hover:text-primary transition-colors duration-500">
                    LUPUS <span className="text-primary group-hover:text-white transition-colors duration-500">VENTURE</span>
                  </span>
                  <div className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-primary group-hover:w-full transition-all duration-500 shadow-[0_0_10px_rgba(232,201,126,0.5)]" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <a 
                href="mailto:touch@lupusventure.com" 
                className="group flex flex-col items-center lg:items-end gap-1"
              >
                <span className="text-[8px] font-black text-[#333] uppercase tracking-[0.4em]">Get in touch</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary group-hover:text-white transition-all duration-500 flex items-center gap-2">
                  touch@lupusventure.com
                  <div className="w-6 h-[1px] bg-primary/30 group-hover:w-10 group-hover:bg-primary transition-all duration-500" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebsiteLayout;
