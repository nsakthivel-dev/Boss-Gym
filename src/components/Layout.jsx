import React, { useState, useRef, useEffect } from 'react';

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  CreditCard, 
  LogOut,
  Menu,
  X,
  Dumbbell,
  QrCode,
  Bell,
  Calendar,
  Settings,
  HelpCircle,
  Plus
} from 'lucide-react';
import WallQRModal from './WallQRModal';

const Layout = () => {
  const { userRole } = useAuth();
  const { alerts, alertCount } = useNotification();
  const navigate = useNavigate();
  const { settings: gymSettings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

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
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Members', icon: Users, path: '/members' },

    { label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { label: 'Schedule', icon: Calendar, path: '/schedule' },
    { label: 'Reports', icon: PieChart, path: '/reports' },
    { label: 'Wall QR', icon: QrCode, path: '/qr' },
  ];





  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-[#1a1a1a] relative h-16">
        <div className="flex items-center gap-2 z-10">
          <Dumbbell className="text-primary shrink-0 w-5 h-5" />
        </div>
        
        {/* Centered Name */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
          <span className="font-black text-sm tracking-[0.15em] uppercase text-primary whitespace-nowrap overflow-hidden">
            {gymSettings.gymName || 'Boss Gym'}
          </span>
        </div>

        <button onClick={toggleMobileMenu} className="text-primary hover:text-primary/80 transition-colors shrink-0 z-10 p-2">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-[#1a1a1a] transform transition-transform duration-150 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="hidden md:flex flex-col gap-2 p-10 border-b border-[#1a1a1a]/50 mb-4">
            <div className="flex items-center gap-3">
              <Dumbbell className="text-primary w-6 h-6 shrink-0" />
              <span className="font-black text-lg tracking-[0.05em] text-primary uppercase leading-tight">
                {gymSettings.gymName || 'Boss Gym'}
              </span>
            </div>
            <span className="text-[9px] tracking-[0.4em] text-[#333] font-black uppercase">Elite Management</span>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-6 py-3 transition-all duration-150 group relative ${
                      isActive
                        ? 'text-primary' 
                        : 'text-[#666] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary" />}
                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-[#444] group-hover:text-white'}`} />
                      <span className="text-sm font-bold tracking-widest uppercase">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-6 space-y-4 border-t border-[#1a1a1a]">
            <button 
              onClick={() => navigate('/members')}
              className="w-full bg-[#d1d5db] text-black font-bold py-3 rounded-sm flex items-center justify-center gap-2 hover:bg-[#e5e7eb] transition-colors uppercase text-xs tracking-widest"
            >
              <Plus size={16} /> Add Member
            </button>

            <div className="space-y-1">
              <NavLink 
                to="/settings"
                className={({ isActive }) => `flex items-center gap-4 px-2 py-2 w-full text-left transition-colors group ${isActive ? 'text-primary' : 'text-[#666] hover:text-white'}`}
              >
                <Settings size={18} className="group-hover:text-white" />
                <span className="text-xs font-bold tracking-widest uppercase">Settings</span>
              </NavLink>
              <NavLink 
                to="/support"
                className={({ isActive }) => `flex items-center gap-4 px-2 py-2 w-full text-left transition-colors group ${isActive ? 'text-primary' : 'text-[#666] hover:text-white'}`}
              >
                <HelpCircle size={18} className="group-hover:text-white" />
                <span className="text-xs font-bold tracking-widest uppercase">Support</span>
              </NavLink>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-4 px-2 py-2 text-[#666] hover:text-error w-full text-left transition-colors group"
              >
                <LogOut size={18} className="group-hover:text-error" />
                <span className="text-xs font-bold tracking-widest uppercase">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#0a0a0a]">
        {/* Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a]">
          <div className="flex-1 max-w-xl">
            {/* Search or space */}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[#888]">
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`transition-all duration-200 relative group p-2 border rounded-lg ${
                    showNotifications 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : alertCount > 0 
                        ? 'border-warning/30 text-warning hover:border-warning' 
                        : 'border-[#1a1a1a] text-[#888] hover:border-[#333] hover:text-white'
                  }`}
                >
                  <Bell size={20} />
                  {alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                      {alertCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-[#111] border border-[#1a1a1a] rounded-lg shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0d0d0d]">
                      <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Notifications</h3>
                      <span className="text-[10px] text-[#555] font-bold uppercase">{alerts.length} Total</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-[#444] text-xs font-bold uppercase tracking-widest">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#1a1a1a]">
                          {alerts.map((alert) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const endDate = alert.endDate.toDate?.() ?? new Date(alert.endDate);
                            const daysLeft = Math.ceil((endDate - today) / 86400000);
                            
                            return (
                              <div key={alert.id} className="p-4 hover:bg-[#151515] transition-colors cursor-default">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <p className="text-sm font-bold text-white uppercase tracking-tight">{alert.name}</p>
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    daysLeft < 0 ? 'bg-red-500/10 text-red-500' : 
                                    daysLeft <= 3 ? 'bg-amber-500/10 text-amber-500' : 
                                    'bg-blue-500/10 text-blue-500'
                                  }`}>
                                    {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                                  </span>
                                </div>
                                <p className="text-[10px] text-[#666] font-bold uppercase tracking-widest">
                                  {alert.planName || (alert.price ? `₹${alert.price} / ${alert.durationDays}d` : 'Gym Membership')}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {alerts.length > 0 && (
                      <div className="p-3 bg-[#0d0d0d] border-t border-[#1a1a1a]">
                        <button 
                          onClick={() => {
                            navigate('/');
                            setShowNotifications(false);
                          }}
                          className="w-full py-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-primary/5 rounded transition-colors"
                        >
                          View All Alerts
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="h-6 w-[1px] bg-[#1a1a1a]"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Admin Panel</p>
                <p className="text-[10px] text-[#555] font-bold tracking-widest uppercase">Master Trainer</p>
              </div>
              <div className="w-10 h-10 bg-[#1a1a1a] rounded flex items-center justify-center text-[#444] overflow-hidden border border-[#222]">
                <img src={`https://ui-avatars.com/api/?name=Admin&background=1a1a1a&color=e8c97e`} alt="Admin" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>
      
      {showQRModal && (
        <WallQRModal onClose={() => setShowQRModal(false)} />
      )}
    </div>
  );
};

export default Layout;

