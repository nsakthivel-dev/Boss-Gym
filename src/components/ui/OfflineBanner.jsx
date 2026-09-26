import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-sm z-50 sticky top-0 animate-fade-in">
      <WifiOff size={15} />
      <span>You are currently working offline. Some actions will sync when reconnected.</span>
      <button 
        onClick={() => window.location.reload()} 
        className="ml-2 bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
      >
        <RefreshCw size={11} /> Recheck
      </button>
    </div>
  );
};

export default OfflineBanner;
