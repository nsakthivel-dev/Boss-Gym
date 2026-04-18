import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    
    if (isStandalone || isFullscreen) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on Android
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      
      // Show prompt after 3 seconds (give user time to explore)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
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
      // If no deferred prompt, show instructions for manual installation
      alert('To install this app:\n\n1. Click the menu (⋮) in your browser\n2. Select "Install App" or "Add to Home Screen"\n3. Follow the prompts');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt variable
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-500/30 rounded-xl shadow-2xl p-5 backdrop-blur-sm">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon and title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center">
            <Smartphone size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">
              Install New Boss Gym
            </h3>
            <p className="text-sm text-gray-300">
              Get quick access and offline support on your device
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Offline Access</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Fast Loading</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Home Screen</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Notifications</span>
          </div>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/25"
        >
          <Download size={18} />
          Install App
        </button>

        {/* Dismiss link */}
        <button
          onClick={handleDismiss}
          className="w-full mt-2 text-sm text-gray-400 hover:text-gray-300 transition-colors py-2"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
