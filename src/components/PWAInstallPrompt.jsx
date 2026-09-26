import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, CheckCircle2 } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    
    if (isStandalone || isFullscreen) {
      setIsInstalled(true);
      return;
    }

    if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after 3 seconds for smooth onboarding
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install Boss Gym on your home screen:\n\n• iOS Safari: Tap Share (⎋) then "Add to Home Screen"\n• Android Chrome: Tap Menu (⋮) then "Install App"');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted installation');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-50 animate-slide-up">
      <div className="bg-white border border-gold-300/80 rounded-2xl shadow-card p-5 relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-surface-muted transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-3.5 pr-6">
          <div className="w-11 h-11 bg-gold-50 border border-gold-200 rounded-xl flex items-center justify-center shrink-0 text-gold-600 shadow-sm">
            <Smartphone size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold-600 block">Mobile App</span>
            <h3 className="text-base font-extrabold text-text-main leading-tight">
              Install New Boss Gym
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Instant access, fast loading, and offline support.
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-background-soft border border-border-light rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <CheckCircle2 size={13} className="text-gold-600 shrink-0" />
            <span>Fast Home Screen</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <CheckCircle2 size={13} className="text-gold-600 shrink-0" />
            <span>Offline Ready</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <CheckCircle2 size={13} className="text-gold-600 shrink-0" />
            <span>Quick Check-in</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <CheckCircle2 size={13} className="text-gold-600 shrink-0" />
            <span>Real-time Alerts</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-gold-sm"
          >
            <Download size={16} />
            Install Application
          </button>
          <button
            onClick={handleDismiss}
            className="w-full text-center text-xs font-semibold text-muted hover:text-text-main py-1.5 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
