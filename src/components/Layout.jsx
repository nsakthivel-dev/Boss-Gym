import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  PieChart, 
  LogOut,
  Menu,
  X,
  Dumbbell,
  QrCode,
  Bell,
  Calendar,
  Settings,
  HelpCircle,
  Plus,
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
  Activity
} from 'lucide-react';
import WallQRModal from './WallQRModal';

const Layout = () => {
  const { userRole, currentUser } = useAuth();
  const { alerts, alertCount } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings: gymSettings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', badge: 'Live' },
    { label: 'Athletes & Members', icon: Users, path: '/members' },
    { label: 'Attendance Log', icon: CalendarCheck, path: '/attendance' },
    { label: 'Workout Schedule', icon: Calendar, path: '/schedule' },
    { label: 'Performance Reports', icon: PieChart, path: '/reports' },
    { label: 'Wall QR Code', icon: QrCode, path: '/qr' },
  ];

  const mobileBottomNav = [
    { label: 'Command', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Athletes', icon: Users, path: '/members' },
    { label: 'Activity', icon: CalendarCheck, path: '/attendance' },
    { label: 'Workouts', icon: Calendar, path: '/schedule' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f3] flex flex-col md:flex-row font-sans text-neutral-900">
      {/* Mobile Top Header - Dark Athletic Bar */}
      <header className="md:hidden flex items-center justify-between px-4 bg-[#151515] border-b border-[#2a2a2a] sticky top-0 z-40 h-16 safe-area-top shadow-lg">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="text-neutral-300 hover:text-gold-400 p-2 -ml-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Centered Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-sm">
            <Dumbbell size={18} />
          </div>
          <div className="text-center">
            <span className="font-black text-sm tracking-wider uppercase text-white font-athletic block leading-none">
              {gymSettings.gymName || 'Boss Gym'}
            </span>
            <span className="text-[9px] font-bold tracking-widest uppercase text-gold-500 block mt-0.5">
              Performance Club
            </span>
          </div>
        </div>

        {/* Notification Bell for Mobile */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`min-w-[44px] min-h-[44px] p-2 rounded-xl transition-all relative flex items-center justify-center active:scale-95 ${
              showNotifications 
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40' 
                : alertCount > 0 
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' 
                  : 'text-neutral-400 hover:text-white'
            }`}
            aria-label="View notifications"
          >
            <Bell size={20} />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Desktop / Mobile Drawer Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#151515] border-r border-[#262626] transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 md:z-auto shadow-2xl md:shadow-none flex flex-col text-white
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Area */}
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-gradient-to-b from-[#1c1c1c] to-[#151515]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 p-0.5 shadow-gold-sm">
              <div className="w-full h-full bg-[#151515] rounded-[10px] flex items-center justify-center text-gold-400">
                <Dumbbell className="w-6 h-6" />
              </div>
            </div>
            <div>
              <span className="font-black text-base tracking-wider text-white uppercase leading-tight block font-athletic">
                {gymSettings.gymName || 'Boss Gym'}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-gold-400 font-bold uppercase block mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Performance OS
              </span>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-neutral-400 hover:text-white p-2 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Add Action Banner */}
        <div className="p-4 border-b border-[#262626]/80">
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/members');
            }}
            className="w-full min-h-[44px] bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 active:scale-[0.98] text-neutral-950 font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase text-xs tracking-wider shadow-gold-sm font-athletic"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Enrol New Athlete</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">
            Platform Command
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 group relative text-xs font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-gold-500/10 text-gold-400 font-black border border-gold-500/30 shadow-inner' 
                      : 'text-neutral-400 hover:text-white hover:bg-[#1f1f1f]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-gold-400' : 'text-neutral-400 group-hover:text-gold-400'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_8px_#c9a227]" />
                    ) : item.badge ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#262626] text-neutral-300">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}

          <div className="pt-5 px-3 pb-2 text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">
            System & Tools
          </div>
          <NavLink 
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider ${isActive ? 'bg-gold-500/10 text-gold-400 font-black border border-gold-500/20' : 'text-neutral-400 hover:text-white hover:bg-[#1f1f1f]'}`}
          >
            <Settings size={16} className="text-neutral-400" />
            <span>Facility Settings</span>
          </NavLink>
          <NavLink 
            to="/support"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider ${isActive ? 'bg-gold-500/10 text-gold-400 font-black border border-gold-500/20' : 'text-neutral-400 hover:text-white hover:bg-[#1f1f1f]'}`}
          >
            <HelpCircle size={16} className="text-neutral-400" />
            <span>Concierge Support</span>
          </NavLink>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-gold-400 hover:bg-[#1f1f1f]"
          >
            <span className="flex items-center gap-3">
              <ExternalLink size={16} className="text-neutral-400" />
              <span>Public Website</span>
            </span>
            <ChevronRight size={14} className="text-neutral-500" />
          </a>
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-[#262626] bg-[#111111]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center font-black text-gold-400 text-xs shadow-sm">
                A
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white uppercase truncate">Master Trainer</p>
                <p className="text-[10px] text-neutral-400 truncate">{currentUser?.email || 'admin@bossgym.com'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#f8f7f3] pb-20 md:pb-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-md border-b border-[#e7e2d5] sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Gym Operations</span>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-black text-neutral-900 uppercase tracking-wider font-athletic">
              {location.pathname.replace('/', '') || 'Command Center'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Dropdown Container */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`transition-all duration-150 relative p-2.5 rounded-xl border flex items-center justify-center ${
                  showNotifications 
                    ? 'bg-gold-50 border-gold-300 text-gold-700 shadow-sm' 
                    : alertCount > 0 
                      ? 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400' 
                      : 'border-[#e7e2d5] bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
                }`}
                title="Notifications"
              >
                <Bell size={18} />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>

              {/* Desktop Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-88 bg-white border border-gold-200/90 rounded-2xl shadow-modal z-[70] overflow-hidden animate-slide-up">
                  <div className="p-4 border-b border-[#e7e2d5] flex items-center justify-between bg-gold-50/50">
                    <h3 className="text-xs font-black text-gold-800 uppercase tracking-widest font-athletic">Membership Alerts</h3>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase bg-white border border-[#e7e2d5] px-2.5 py-0.5 rounded-full">
                      {alerts.length} Pending
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-[#f0ece2]">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">All athlete memberships in good standing</p>
                      </div>
                    ) : (
                      alerts.map((alert) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const endDate = alert.endDate.toDate?.() ?? new Date(alert.endDate);
                        const daysLeft = Math.ceil((endDate - today) / 86400000);
                        
                        return (
                          <div key={alert.id} className="p-3.5 hover:bg-[#faf9f6] transition-colors flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-neutral-900 uppercase tracking-tight truncate">{alert.name}</p>
                              <p className="text-[10px] text-neutral-500">
                                {alert.planName || (alert.price ? `₹${alert.price} / ${alert.durationDays}d` : 'Standard Membership')}
                              </p>
                            </div>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              daysLeft < 0 ? 'bg-red-100 text-red-700' : 
                              daysLeft <= 3 ? 'bg-amber-100 text-amber-700' : 
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {alerts.length > 0 && (
                    <div className="p-3 bg-[#faf9f6] border-t border-[#e7e2d5] text-center">
                      <button 
                        onClick={() => {
                          navigate('/members');
                          setShowNotifications(false);
                        }}
                        className="w-full py-1.5 text-[11px] font-black text-gold-700 uppercase tracking-wider hover:text-gold-800 transition-colors"
                      >
                        Manage Athletes & Renewals
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-[#e7e2d5]"></div>

            {/* Quick Check-in Launcher */}
            <a 
              href="/checkin" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              <Zap size={14} className="text-gold-400" />
              <span>Kiosk Mode</span>
            </a>

            {/* Admin Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-black text-neutral-900 uppercase tracking-wider font-athletic">Admin Desk</p>
                <p className="text-[10px] text-gold-700 font-bold uppercase tracking-widest">Master Trainer</p>
              </div>
              <div className="w-9 h-9 bg-neutral-900 border border-gold-500/40 rounded-full flex items-center justify-center text-gold-400 font-black text-xs shadow-xs">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="p-4 sm:p-6 md:p-8 max-w-[1440px] w-full mx-auto flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Notifications Popup */}
      {showNotifications && (
        <div className="md:hidden fixed top-16 right-3 left-3 z-[60] animate-slide-up">
          <div className="bg-white border border-gold-300 rounded-2xl shadow-modal overflow-hidden">
            <div className="p-3.5 border-b border-[#e7e2d5] flex items-center justify-between bg-gold-50/60">
              <h3 className="text-xs font-black text-gold-800 uppercase tracking-widest font-athletic">Membership Alerts</h3>
              <button onClick={() => setShowNotifications(false)} className="text-neutral-500 hover:text-neutral-900 p-1">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-[#f0ece2]">
              {alerts.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">No pending alerts</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const endDate = alert.endDate.toDate?.() ?? new Date(alert.endDate);
                  const daysLeft = Math.ceil((endDate - today) / 86400000);
                  
                  return (
                    <div key={alert.id} className="p-3 hover:bg-[#faf9f6] transition-colors flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 uppercase tracking-tight truncate">{alert.name}</p>
                        <p className="text-[10px] text-neutral-500">
                          {alert.planName || (alert.price ? `₹${alert.price} / ${alert.durationDays}d` : 'Membership')}
                        </p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        daysLeft < 0 ? 'bg-red-100 text-red-700' : 
                        daysLeft <= 3 ? 'bg-amber-100 text-amber-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            {alerts.length > 0 && (
              <div className="p-3 bg-[#faf9f6] border-t border-[#e7e2d5]">
                <button 
                  onClick={() => {
                    navigate('/members');
                    setShowNotifications(false);
                  }}
                  className="w-full py-2 text-xs font-black text-gold-700 uppercase tracking-wider"
                >
                  View All Athletes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar - Athletic Mobile App Style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#151515] border-t border-[#262626] z-40 safe-area-bottom shadow-2xl flex items-center justify-around px-2 py-1.5">
        {mobileBottomNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] rounded-xl transition-all ${
                  isActive 
                    ? 'text-gold-400 font-black' 
                    : 'text-neutral-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg transition-transform ${isActive ? 'bg-gold-500/10 scale-105' : ''}`}>
                    <Icon size={20} className={isActive ? 'text-gold-400 stroke-[2.5]' : ''} />
                  </div>
                  <span className={`text-[10px] mt-0.5 tracking-wider uppercase font-athletic ${isActive ? 'font-black text-gold-400' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] text-neutral-400 hover:text-white rounded-xl transition-colors"
        >
          <div className="p-1">
            <Menu size={20} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-wider uppercase font-athletic font-medium">
            More
          </span>
        </button>
      </nav>

      {/* Wall QR Modal */}
      {showQRModal && (
        <WallQRModal onClose={() => setShowQRModal(false)} />
      )}
    </div>
  );
};

export default Layout;
