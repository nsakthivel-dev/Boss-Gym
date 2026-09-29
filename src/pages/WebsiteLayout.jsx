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
  X, 
  ChevronRight,
  UserCheck,
  Shield,
  Zap,
  Sparkles
} from 'lucide-react';
import { NavLink, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

const WebsiteLayout = () => {
  const { currentUser, userRole } = useAuth();
  const { settings: gymSettings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminEmails = [
    'sakthicud07@gmail.com',
    'manisuni94@gmail.com',
    import.meta.env.VITE_ADMIN_EMAIL?.replace(/^["'](.+)["']$/, '$1').toLowerCase().trim()
  ].filter(Boolean).map(e => e.toLowerCase().trim());
  const isAdmin = userRole === 'admin' || (currentUser && adminEmails.includes(currentUser.email?.toLowerCase().trim()));

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
    { label: 'Training', path: '/training' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Plans', path: '/plans' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-neutral-900 font-sans selection:bg-gold-500 selection:text-neutral-950 flex flex-col">
      {/* Top Athletic Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#151515]/95 backdrop-blur-md border-b border-[#262626] py-2.5 sm:py-3 transition-all text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-[130px] xs:max-w-[170px] sm:max-w-none group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 p-0.5 shadow-gold-sm group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-[#151515] rounded-[10px] flex items-center justify-center text-gold-400">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="font-black text-xs sm:text-base lg:text-lg tracking-wider uppercase text-white block leading-tight font-athletic truncate">
                {gymSettings.gymName || 'New Boss Gym'}
              </span>
              <span className="hidden sm:block text-[8px] sm:text-[9px] tracking-[0.16em] sm:tracking-[0.25em] uppercase font-bold text-gold-400 mt-0.5 font-athletic truncate">
                Performance Club · Muthaliyarpet
              </span>
            </div>
          </NavLink>
          
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map(item => (
              <NavLink 
                key={item.label} 
                to={item.path} 
                className={({ isActive }) => `text-xs font-bold uppercase tracking-wider transition-colors relative py-1 font-athletic ${
                  isActive ? 'text-gold-400 font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-400 rounded-full shadow-[0_0_8px_#c9a227]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <NavLink
              to="/checkin"
              className="inline-flex items-center gap-1 sm:gap-2 bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] hover:border-gold-400 text-gold-400 px-2 sm:px-3.5 h-8 sm:h-10 rounded-lg sm:rounded-xl font-black uppercase text-[10px] sm:text-[11px] tracking-wider transition-all font-athletic active:scale-95 shrink-0"
              title="Athlete Check-In Kiosk"
            >
              <UserCheck size={13} className="text-emerald-400 shrink-0" />
              <span className="hidden xs:inline">Check In</span>
            </NavLink>

            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="hidden lg:block text-right">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-athletic">Trainer Desk</p>
                  <p className="text-xs font-bold text-white truncate max-w-[140px]">{currentUser?.email}</p>
                </div>
                {isAdmin && (
                  <NavLink 
                    to="/dashboard"
                    className="inline-flex items-center gap-1 sm:gap-1.5 h-8 sm:h-10 px-2 sm:px-3.5 rounded-lg sm:rounded-xl bg-gold-500 hover:bg-gold-400 text-neutral-950 font-black text-[10px] sm:text-xs uppercase tracking-wider font-athletic shadow-gold-sm transition-all active:scale-95 shrink-0 z-10"
                    title="Admin Dashboard"
                  >
                    <Shield size={13} className="shrink-0" />
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="sm:hidden font-black">Admin</span>
                  </NavLink>
                )}
                <button 
                  onClick={handleLogout}
                  className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg sm:rounded-xl bg-[#222222] hover:bg-red-500/10 text-neutral-400 hover:text-red-400 border border-[#333333] transition-colors cursor-pointer shrink-0"
                  title="Logout"
                >
                  <LogOut size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <NavLink 
                to="/login"
                className="inline-flex items-center justify-center h-8 sm:h-10 px-3 sm:px-5 rounded-lg sm:rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 active:scale-95 text-neutral-950 font-black uppercase text-[10px] sm:text-xs tracking-wider transition-all shadow-gold-sm font-athletic border border-gold-400/80 cursor-pointer"
              >
                Login
              </NavLink>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden text-neutral-200 hover:text-white h-8 w-8 sm:h-10 sm:w-10 bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] hover:border-gold-500/40 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors active:scale-95 cursor-pointer shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <div className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`fixed inset-y-0 right-0 max-w-sm w-full bg-[#151515] border-l border-[#262626] p-6 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-out text-white ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-[#262626]">
              <div className="flex items-center gap-2.5">
                <div className="bg-gold-500/10 border border-gold-500/30 p-2 rounded-xl text-gold-400">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <span className="font-black text-base tracking-wider uppercase text-white font-athletic">
                  {gymSettings.gymName || 'New Boss Gym'}
                </span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={22} />
              </button>
            </div>

            <div className="py-6 space-y-2">
              {navItems.map(item => (
                <NavLink 
                  key={item.label} 
                  to={item.path} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all font-athletic ${
                    isActive ? 'bg-gold-500/10 text-gold-400 font-black border border-gold-500/30' : 'text-neutral-300 hover:bg-[#222222] hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight size={16} className="text-neutral-500" />
                </NavLink>
              ))}
              <NavLink 
                to="/checkin" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider text-neutral-950 bg-gradient-to-r from-gold-500 to-gold-600 shadow-gold-sm font-athletic mt-2"
              >
                <span className="flex items-center gap-2"><UserCheck size={16} /> Athlete Self Check In</span>
                <ChevronRight size={16} />
              </NavLink>
            </div>
          </div>

          <div className="pt-6 border-t border-[#262626] space-y-3">
            {currentUser ? (
              <div className="space-y-2">
                {isAdmin && (
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 text-neutral-950 py-3 rounded-xl font-black uppercase text-xs tracking-wider text-center font-athletic shadow-gold-sm active:scale-[0.98] transition-all"
                  >
                    <Shield size={16} />
                    <span>Admin Command Center</span>
                  </NavLink>
                )}
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-red-400 font-bold uppercase tracking-wider text-xs py-3 rounded-xl border border-red-500/30 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} /> Logout ({currentUser.email})
                </button>
              </div>
            ) : (
              <NavLink 
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 py-3.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-gold-sm text-center font-athletic"
              >
                Member / Trainer Login
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      {/* Dark Luxury Athletic Footer */}
      <footer className="bg-[#111111] text-white border-t border-[#262626] pt-16 pb-12 mt-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 mb-16">
            {/* Logo & Description */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 p-0.5 shadow-gold-sm">
                  <div className="w-full h-full bg-[#151515] rounded-[10px] flex items-center justify-center text-gold-400">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <span className="font-black text-xl tracking-wider uppercase text-white block font-athletic">
                    {gymSettings.gymName || 'New Boss Gym'}
                  </span>
                  <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-gold-400 block font-athletic">
                    Premier Fitness Facility
                  </span>
                </div>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
                Redefining fitness in Pondicherry. Located near 100ft Road, Muthaliyarpet. Experience professional strength equipment, personalized training architecture, and an elite fitness community.
              </p>
              <div className="flex items-center gap-3 pt-2">
                {[
                  { icon: Instagram, label: "Instagram" },
                  { icon: Facebook, label: "Facebook" },
                  { icon: Twitter, label: "Twitter" }
                ].map((s, i) => (
                  <a 
                    key={i} 
                    href="#" 
                    aria-label={s.label}
                    className="w-10 h-10 flex items-center justify-center bg-[#1c1c1c] border border-[#2a2a2a] hover:border-gold-400 text-neutral-400 hover:text-gold-400 rounded-xl transition-all"
                  >
                    <s.icon size={16} />
                  </a>
                ))}
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="md:col-span-3">
              <h4 className="text-xs font-black text-gold-400 uppercase tracking-widest mb-4 font-athletic">
                Platform Navigation
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'About Boss Gym', path: '/about' },
                  { label: '7-Day Training Split', path: '/training' },
                  { label: 'Membership Plans (₹800)', path: '/plans' },
                  { label: 'Facility Gallery', path: '/gallery' },
                  { label: 'Contact Trainers', path: '/contact' },
                  { label: 'Athlete Check-In Kiosk', path: '/checkin' }
                ].map(item => (
                  <li key={item.label}>
                    <Link 
                      to={item.path} 
                      className="text-neutral-400 text-xs hover:text-gold-400 transition-colors flex items-center gap-2 group"
                    >
                      <ChevronRight size={13} className="text-neutral-600 group-hover:text-gold-400 transition-colors" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Details */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-black text-gold-400 uppercase tracking-widest mb-4 font-athletic">
                Location & Direct Line
              </h4>
              <div className="flex items-start gap-3 text-xs text-neutral-400">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0 mt-0.5">
                  <MapPin size={15} />
                </div>
                <div>
                  <p className="font-bold text-white text-[11px] uppercase tracking-wider font-athletic">Gym Address</p>
                  <p className="mt-0.5">{gymSettings.address || 'No:22, Gayathiri Nagar, 100ft Road, Muthaliyarpet, Pondicherry – 605004'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs text-neutral-400">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0 mt-0.5">
                  <Phone size={15} />
                </div>
                <div>
                  <p className="font-bold text-white text-[11px] uppercase tracking-wider font-athletic">Front Desk Phone</p>
                  <p className="mt-0.5 font-mono">{gymSettings.phoneNumber || '+91 98765 43210'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} {gymSettings.gymName || 'New Boss Gym'}. All rights reserved.</p>
            <div className="flex items-center gap-2 text-[11px]">
              <span>Architecture & Management by</span>
              <a 
                href="https://lupusventure.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-black text-gold-400 hover:text-gold-300 transition-colors uppercase tracking-wider font-athletic"
              >
                Lupus Venture
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebsiteLayout;
