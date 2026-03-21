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
  QrCode
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
  ];




  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-primary" />
          <span className="font-bold text-lg tracking-wide uppercase">Boss Gym</span>
        </div>
        <button onClick={toggleMobileMenu} className="text-white hover:text-primary transition-colors">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-150 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="hidden md:flex items-center gap-2 p-6 border-b border-border">
            <Dumbbell className="text-primary w-8 h-8" />
            <span className="font-bold text-xl tracking-wide uppercase">Boss Gym</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-muted hover:bg-secondary hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 space-y-2 border-t border-border">
            <button 
              onClick={() => {
                setShowQRModal(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors duration-150"
            >
              <QrCode className="w-5 h-5" />
              Get Wall QR
            </button>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors duration-150"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
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
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
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

