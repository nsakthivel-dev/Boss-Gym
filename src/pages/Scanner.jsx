import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Check, X, Clock, DoorOpen, CameraOff } from 'lucide-react';

const Scanner = () => {
  const [result, setResult] = useState(null);
  const [clock, setClock] = useState(new Date());
  const [scannerKey, setScannerKey] = useState(0);
  const [scannerError, setScannerError] = useState(null);
  const isProcessing = useRef(false);
  const html5QrRef = useRef(null);

  // Live Clock & Date
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const showResult = useCallback((res) => {
    setResult(res);
    
    // Stop scanner when showing result
    if (html5QrRef.current && html5QrRef.current.isScanning) {
      html5QrRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
    }

    setTimeout(() => {
      setResult(null);
      isProcessing.current = false;
      setScannerKey(prev => prev + 1); // Force re-mount and re-start
    }, 3000);
  }, []);

  const handleScan = useCallback(async (qrValue) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      const membersRef = collection(db, 'members');
      const q = query(membersRef, where('qrValue', '==', qrValue));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showResult({ status: 'not_found' });
        return;
      }

      const memberDoc = querySnapshot.docs[0];
      const memberData = memberDoc.data();
      const memberId = memberDoc.id;

      const today = new Date();
      const endDate = memberData.endDate?.toDate();
      if (!endDate || endDate < today) {
        showResult({ status: 'expired', memberName: memberData.name });
        return;
      }

      const cooldownRef = doc(db, 'cooldowns', memberId);
      const cooldownSnap = await getDoc(cooldownRef);
      if (cooldownSnap.exists()) {
        const lastScan = cooldownSnap.data().lastScan?.toDate();
        if (lastScan) {
          const diff = Math.floor((today - lastScan) / 1000);
          if (diff < 120) {
            showResult({ status: 'cooldown', memberName: memberData.name, secondsRemaining: 120 - diff });
            return;
          }
        }
      }

      await setDoc(cooldownRef, { lastScan: serverTimestamp() });

      const todayStr = today.toISOString().split('T')[0];
      const sessionsRef = collection(db, 'sessions');
      const sessionQuery = query(
        sessionsRef, 
        where('memberId', '==', memberId), 
        where('sessionDate', '==', todayStr), 
        where('status', '==', 'open')
      );
      const sessionSnapshot = await getDocs(sessionQuery);

      if (sessionSnapshot.empty) {
        await addDoc(sessionsRef, {
          memberId,
          memberName: memberData.name,
          sessionDate: todayStr,
          entryTime: serverTimestamp(),
          exitTime: null,
          durationMinutes: null,
          status: 'open',
          edited: false
        });
        showResult({ status: 'entry', memberName: memberData.name, entryTime: new Date() });
      } else {
        const sessionDoc = sessionSnapshot.docs[0];
        const entryTime = sessionDoc.data().entryTime.toDate();
        const durationMinutes = Math.floor((new Date() - entryTime) / (1000 * 60));
        
        await updateDoc(doc(db, 'sessions', sessionDoc.id), {
          exitTime: serverTimestamp(),
          durationMinutes,
          status: 'closed'
        });
        showResult({ 
          status: 'exit', 
          memberName: memberData.name,
          entryTime,
          exitTime: new Date(),
          durationMinutes 
        });
      }
    } catch (error) {
      console.error("Scan error:", error);
      showResult({ status: 'error', message: "System Error. Please try again." });
    }
  }, [showResult]);

  // Scanner Initialization
  useEffect(() => {
    let mounted = true;
    const scannerId = "qr-reader";
    const html5QrCode = new Html5Qrcode(scannerId);
    html5QrRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 300, height: 300 },
          },
          (decodedText) => {
            if (mounted) handleScan(decodedText);
          },
          () => {
            // Silently ignore scan noise
          }
        );
      } catch (err) {
        console.error("Camera start error:", err);
        if (mounted) setScannerError(err.toString());
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Error stopping scanner on unmount:", err));
      }
    };
  }, [scannerKey, handleScan]);

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] text-white flex flex-col items-center select-none overflow-hidden">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between px-10 py-6 border-b border-white/5 bg-[#0f0f0f]">
        <h1 className="text-[#e8c97e] text-3xl font-black tracking-tighter">BOSS GYM</h1>
        <div className="text-4xl font-mono font-bold tracking-widest">
          {clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase()}
        </div>
        <div className="text-xl text-white/70 font-medium">
          {clock.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Main Scanner Section */}
      {!result ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center space-y-2">
            <h2 className="text-[#a3a3a3] text-sm font-bold tracking-[0.3em] uppercase">Scan Your QR Code</h2>
          </div>

          <div className="relative group">
            {/* Camera Box */}
            <div 
              id="qr-reader" 
              className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] border-2 border-[#e8c97e] rounded-[2rem] overflow-hidden bg-black/40 backdrop-blur-sm shadow-[0_0_50px_rgba(232,201,126,0.1)] transition-all duration-500 group-hover:shadow-[0_0_80px_rgba(232,201,126,0.2)] flex items-center justify-center"
            >
              {scannerError ? (
                <div className="p-8 text-center space-y-4">
                  <CameraOff size={48} className="text-error mx-auto opacity-50" />
                  <p className="text-error text-sm font-medium">{scannerError}</p>
                  <button 
                    onClick={() => setScannerKey(k => k + 1)}
                    className="text-[#e8c97e] text-xs underline uppercase tracking-widest"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="animate-pulse flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-2 border-[#e8c97e]/20 rounded-full border-t-[#e8c97e] animate-spin"></div>
                  <span className="text-[#a3a3a3] text-xs font-bold tracking-widest">STARTING CAMERA...</span>
                </div>
              )}
            </div>

            {/* Corner Decorative Elements */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-[#e8c97e] rounded-tl-xl"></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-[#e8c97e] rounded-tr-xl"></div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-[#e8c97e] rounded-bl-xl"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-[#e8c97e] rounded-br-xl"></div>
          </div>

          <p className="text-[#a3a3a3] text-lg font-medium animate-pulse">
            Hold your membership QR code in front of the camera
          </p>
        </div>
      ) : (
        <div className="flex-1 w-full flex items-center justify-center p-6">
          <ResultCard result={result} formatTime={formatTime} />
        </div>
      )}
    </div>
  );
};

const ResultCard = ({ result, formatTime }) => {
  const [countdown, setCountdown] = useState(result.secondsRemaining || 0);

  useEffect(() => {
    if (result.status === 'cooldown' && countdown > 0) {
      const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [result.status, countdown]);

  if (result.status === 'entry') {
    return (
      <div className="w-full max-w-2xl bg-[#052e16] border-2 border-[#4ade80] rounded-[3rem] p-12 text-center space-y-8 animate-in zoom-in duration-300">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[#4ade80] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.4)]">
            <Check size={60} className="text-[#052e16] stroke-[4px]" />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-[#4ade80] text-3xl font-black tracking-widest uppercase">Entry</h3>
          <h2 className="text-white text-6xl font-bold tracking-tight px-4 truncate">{result.memberName}</h2>
          <p className="text-[#4ade80] text-2xl font-medium">{formatTime(result.entryTime)}</p>
        </div>
        <div className="pt-8 border-t border-white/10">
          <p className="text-white/80 text-3xl">Welcome! Have a great workout 💪</p>
        </div>
      </div>
    );
  }

  if (result.status === 'exit') {
    const hours = Math.floor(result.durationMinutes / 60);
    const mins = result.durationMinutes % 60;
    const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return (
      <div className="w-full max-w-2xl bg-[#0c1a2e] border-2 border-[#60a5fa] rounded-[3rem] p-12 text-center space-y-8 animate-in zoom-in duration-300">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[#60a5fa] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(96,165,250,0.4)]">
            <DoorOpen size={50} className="text-[#0c1a2e]" />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-[#60a5fa] text-3xl font-black tracking-widest uppercase">Exit</h3>
          <h2 className="text-white text-6xl font-bold tracking-tight px-4 truncate">{result.memberName}</h2>
          <div className="flex items-center justify-center gap-6 text-2xl text-[#60a5fa]">
            <span className="font-bold">{durationText}</span>
            <span className="opacity-40">|</span>
            <span>{formatTime(result.exitTime)}</span>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10">
          <p className="text-white/80 text-3xl">Great session! See you next time 👋</p>
        </div>
      </div>
    );
  }

  if (result.status === 'expired' || result.status === 'not_found' || result.status === 'error') {
    return (
      <div className="w-full max-w-2xl bg-[#2d0a0a] border-2 border-[#f87171] rounded-[3rem] p-12 text-center space-y-8 animate-in zoom-in duration-300">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[#f87171] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(248,113,113,0.4)]">
            <X size={60} className="text-[#2d0a0a] stroke-[4px]" />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-[#f87171] text-3xl font-black tracking-widest uppercase">Access Denied</h3>
          {result.memberName && (
            <h2 className="text-white text-5xl font-bold tracking-tight truncate">{result.memberName}</h2>
          )}
          <p className="text-white/70 text-2xl font-medium pt-2">
            {result.status === 'expired' 
              ? "Membership Expired — Please see the front desk" 
              : result.status === 'not_found'
                ? "Member Not Found — Please register at the front desk"
                : result.message}
          </p>
        </div>
      </div>
    );
  }

  if (result.status === 'cooldown') {
    return (
      <div className="w-full max-w-2xl bg-[#2d2000] border-2 border-[#fbbf24] rounded-[3rem] p-12 text-center space-y-8 animate-in zoom-in duration-300">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[#fbbf24] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.4)]">
            <Clock size={50} className="text-[#2d2000]" />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-[#fbbf24] text-3xl font-black tracking-widest uppercase">Please Wait</h3>
          <h2 className="text-white text-6xl font-bold tracking-tight">{result.memberName}</h2>
          <p className="text-white text-4xl font-mono pt-4">
            Try again in <span className="text-[#fbbf24]">{countdown}</span> seconds
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default Scanner;
