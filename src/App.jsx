import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';


import Members from './pages/Members';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Schedule from './pages/Schedule';
import QRPage from './pages/QRPage';
import CheckinPage from './pages/CheckinPage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import WebsiteLayout from './pages/WebsiteLayout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Plans from './pages/Plans';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import { Dumbbell, Loader2 } from 'lucide-react';

const RootRedirect = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (userRole === 'admin') {
    return <Layout />;
  }

  return <WebsiteLayout />;
};

const RoleBasedHome = () => {
  const { userRole } = useAuth();
  return userRole === 'admin' ? <Dashboard /> : <Home />;
};

function App() {

  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/checkin" element={<CheckinPage />} />

              {/* Website Public Routes */}
              <Route element={<WebsiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/qr" element={<QRPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/support" element={<SupportPage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
