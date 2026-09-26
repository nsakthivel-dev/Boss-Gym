import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

const PWAUpdateToast = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handleUpdate = (event) => {
      const worker = event.detail?.waitingWorker;
      if (worker) {
        setWaitingWorker(worker);
        setUpdateAvailable(true);
      }
    };

    window.addEventListener('sw-update-available', handleUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate);
    };
  }, []);

  const handleApplyUpdate = () => {
    if (!waitingWorker) {
      window.location.reload();
      return;
    }

    setUpdating(true);
    // Tell the waiting worker to activate
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });

    // Fallback reload if controllerchange is delayed
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9999] animate-slide-up">
      <div className="bg-white border-2 border-gold-400/80 rounded-xl shadow-gold-md p-4 flex items-center justify-between gap-3 text-text-main">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center shrink-0 text-gold-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-text-main">Update Available</h4>
            <p className="text-[11px] text-muted truncate">A fresh version of Boss Gym is ready.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleApplyUpdate}
            disabled={updating}
            className="bg-gold-500 hover:bg-gold-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
            <span>{updating ? 'Updating...' : 'Update'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-muted hover:text-text-main rounded-md hover:bg-surface-muted transition-colors"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateToast;
