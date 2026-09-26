import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdateToast from './components/PWAUpdateToast';
import OfflineBanner from './components/ui/OfflineBanner';

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
import Training from './pages/Training';
import Plans from './pages/Plans';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import { Loader2 } from 'lucide-react';

const RootRedirect = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background-soft flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (userRole === 'admin') {
    return <Layout />;
  }

  return <WebsiteLayout />;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught runtime error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-[#1c1c1c] border border-gold-500/30 rounded-3xl p-8 shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-gold-400 font-athletic uppercase">Something went wrong</h2>
            <p className="text-xs text-neutral-300">
              {this.state.error?.message || "An unexpected error occurred while rendering the page."}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-neutral-950 font-black text-xs uppercase tracking-wider font-athletic"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationProvider>
          <BrowserRouter>
            <ScrollToTop />
            <OfflineBanner />
            <ErrorBoundary>
              <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/checkin" element={<CheckinPage />} />

              {/* Website Public Routes */}
              <Route element={<WebsiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/training" element={<Training />} />
                <Route path="/services" element={<Navigate to="/training" replace />} />
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
            </ErrorBoundary>
            
            {/* PWA Prompts */}
            <PWAInstallPrompt />
            <PWAUpdateToast />
          </BrowserRouter>
        </NotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
