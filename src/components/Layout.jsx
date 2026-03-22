import React, { useState } from 'react';

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);


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
    { label: 'Reports', icon: PieChart, path: '/reports' },
    { label: 'Wall QR', icon: QrCode, path: '/qr' },
  ];





  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-primary" />
          <span className="font-bold text-lg tracking-widest uppercase text-primary">Boss Gym</span>
        </div>
        <button onClick={toggleMobileMenu} className="text-primary hover:text-primary/80 transition-colors">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] transform transition-transform duration-150 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="hidden md:flex flex-col gap-1 p-8">
            <span className="font-bold text-xl tracking-[0.2em] text-primary uppercase leading-tight">Boss Gym</span>
            <span className="text-[10px] tracking-[0.3em] text-[#555] font-bold uppercase">Elite Management</span>
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
              <button className="flex items-center gap-4 px-2 py-2 text-[#666] hover:text-white w-full text-left transition-colors group">
                <Settings size={18} className="group-hover:text-white" />
                <span className="text-xs font-bold tracking-widest uppercase">Settings</span>
              </button>
              <button className="flex items-center gap-4 px-2 py-2 text-[#666] hover:text-white w-full text-left transition-colors group">
                <HelpCircle size={18} className="group-hover:text-white" />
                <span className="text-xs font-bold tracking-widest uppercase">Support</span>
              </button>
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
              <button className="hover:text-info transition-colors relative group">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a] group-hover:bg-red-400"></span>
              </button>
              <button className="hover:text-warning transition-colors">
                <Calendar size={20} />
              </button>
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

        <div className="p-8 flex-1">
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

