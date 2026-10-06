import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { 
  processAttendance, 
  fetchMemberTodayWorkout, 
  extractTokenFromScan,
  getGymLocationConfig,
  verifyGymLocationOnly,
  acquireBestLocation
} from '../utils/attendanceService';
import MemberFormModal from '../components/MemberFormModal';
import { 
  Camera, MapPin, XCircle, AlertTriangle, Ban, CheckCircle, 
  LogOut, Hourglass, Loader2, Dumbbell, ArrowRight, RefreshCw, 
  Smartphone, Flame, ShieldCheck, Zap, QrCode, ArrowLeft,
  ChevronRight, Clock, UserPlus, Check, Award, Compass, WifiOff,
  Wifi
} from 'lucide-react';

const CheckinPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings: gymSettings, loading: settingsLoading } = useSettings();
  const { currentUser } = useAuth();

  // Page States: 
  // 'welcome', 'scanning', 'locating', 'phone_input', 'processing', 
  // 'success_checkin', 'success_checkout', 'error', 'duplicate_scan', 'not_registered',
  // 'manual_locating', 'manual_result'
  const [step, setStep] = useState('welcome');
  const [phone, setPhone] = useState(localStorage.getItem('nbg_saved_phone') || '');
  const [scannedToken, setScannedToken] = useState(searchParams.get('token') || '');
  const [coords, setCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  
  // Results & Errors
  const [errorDetails, setErrorDetails] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [manualResult, setManualResult] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Scanner and submission locks to prevent duplicate events (Requirement 12)
  const html5QrCodeRef = useRef(null);
  const scanLockedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const scannerContainerId = "html5-qr-reader";

  // Revalidate gym location and dynamic data when PWA is reopened / focused / reconnected (Requirement 18, 19, 24)
  useEffect(() => {
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        getGymLocationConfig().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleRevalidate);
    window.addEventListener('focus', handleRevalidate);
    window.addEventListener('online', handleRevalidate);

    return () => {
      document.removeEventListener('visibilitychange', handleRevalidate);
      window.removeEventListener('focus', handleRevalidate);
      window.removeEventListener('online', handleRevalidate);
    };
  }, []);

  // If token was passed via URL parameter (e.g. member scanned wall QR with smartphone camera)
  useEffect(() => {
    const urlToken = searchParams.get('token') || '';
    if (urlToken) {
      scanLockedRef.current = true;
      setScannedToken(urlToken);
      setStep('locating');
    }
  }, [searchParams]);

  // When step is 'locating', acquire device GPS
  useEffect(() => {
    if (step === 'locating') {
      acquireLocation();
    }
  }, [step]);

  // Camera scanner lifecycle
  useEffect(() => {
    if (step === 'scanning') {
      scanLockedRef.current = false;
      const startScanner = async () => {
        try {
          await new Promise(r => setTimeout(r, 150));
          const el = document.getElementById(scannerContainerId);
          if (!el) return;

          const scanner = new Html5Qrcode(scannerContainerId);
          html5QrCodeRef.current = scanner;

          const config = {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0
          };

          await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              // Lock immediately to prevent duplicate scanner callbacks (Requirement 12)
              if (scanLockedRef.current) return;
              scanLockedRef.current = true;

              const token = extractTokenFromScan(decodedText);
              setScannedToken(token || decodedText);

              const onScanSuccess = () => {
                setStep('locating');
              };

              scanner.stop().then(onScanSuccess).catch(onScanSuccess);
            },
            () => {}
          );
        } catch (err) {
          console.error("Camera scanner start failed:", err);
          setErrorDetails({
            code: 'CAMERA_DENIED',
            message: 'Camera permission denied or camera not found. Please allow camera access in your browser settings.'
          });
          setStep('error');
        }
      };

      startScanner();

      return () => {
        if (html5QrCodeRef.current) {
          try {
            if (html5QrCodeRef.current.isScanning) {
              html5QrCodeRef.current.stop().catch(() => {});
            }
          } catch (e) {}
        }
      };
    }
  }, [step]);

  // Countdown timer for 30-second duplicate scan protection
  useEffect(() => {
    let timer;
    if (step === 'duplicate_scan' && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setStep('phone_input');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, secondsRemaining]);

  const acquireLocation = async () => {
    if (!navigator.onLine) {
      setErrorDetails({
        code: 'OFFLINE',
        message: "You're offline. Connect to the internet to verify your current gym location and record attendance."
      });
      setStep('error');
      return;
    }

    if (!navigator.geolocation) {
      setErrorDetails({
        code: 'LOCATION_UNSUPPORTED',
        message: 'Geolocation is not supported by your browser or device.'
      });
      setStep('error');
      return;
    }

    try {
      const position = await acquireBestLocation({
        timeoutMs: 8000,
        targetAccuracy: 40,
        onProgress: (progressCoords) => {
          setGpsAccuracy(progressCoords.accuracy);
        }
      });

      const { latitude, longitude, accuracy } = position;
      setCoords({ latitude, longitude, accuracy });
      setGpsAccuracy(accuracy);

      // If phone already available, proceed directly to verify
      if (phone && phone.trim().length === 10) {
        handleExecuteAttendance(phone.trim(), { latitude, longitude, accuracy });
      } else {
        setStep('phone_input');
      }
    } catch (geoErr) {
      console.error("Geolocation error:", geoErr);
      if (geoErr.code === 1) {
        setErrorDetails({
          code: 'LOCATION_DENIED',
          message: 'Location permission is required to verify gym attendance. Please allow location in your browser settings and try again.'
        });
      } else {
        setErrorDetails({
          code: 'LOCATION_ERROR',
          message: 'Unable to retrieve your device coordinates. Please ensure GPS is enabled and turn on Wi-Fi to boost indoor accuracy.'
        });
      }
      setStep('error');
    }
  };

  const handlePhoneSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) return;

    localStorage.setItem('nbg_saved_phone', cleanPhone);
    handleExecuteAttendance(cleanPhone, coords);
  };

  const handleExecuteAttendance = async (athletePhone, currentCoords, memberOverride = null) => {
    setStep('processing');
    setErrorDetails(null);

    try {
      const res = await processAttendance({
        scannedText: scannedToken || searchParams.get('token') || '',
        phone: athletePhone,
        coords: currentCoords,
        memberOverride
      });

      if (!res.success) {
        if (res.code === 'NOT_REGISTERED') {
          setErrorDetails(res);
          setStep('not_registered');
          return;
        }

        if (res.code === 'DUPLICATE_SCAN') {
          setSecondsRemaining(res.secondsRemaining || 30);
          setErrorDetails(res);
          setStep('duplicate_scan');
          return;
        }

        setErrorDetails(res);
        setStep('error');
        return;
      }

      // Success!
      setResultData(res);
      if (res.action === 'check_in') {
        setStep('success_checkin');
      } else {
        setStep('success_checkout');
      }
    } catch (err) {
      console.error("Attendance execution error:", err);
      const isPermission = err?.code === 'permission-denied' || (err?.message && err.message.toLowerCase().includes('permission'));
      const isNetwork = err?.code === 'unavailable' || !navigator.onLine;

      let msg = 'Unable to connect to the attendance service. Please check your internet connection and try again.';
      if (isPermission) {
        msg = 'Database permission issue. Please ensure the updated Firestore security rules are deployed in Firebase Console.';
      } else if (err?.message && !err.message.includes('INTERNAL ASSERTION')) {
        msg = err.message;
      }

      setErrorDetails({
        code: isPermission ? 'PERMISSION_DENIED' : (isNetwork ? 'OFFLINE' : 'EXECUTION_ERROR'),
        message: msg,
        technicalDetails: err?.message || String(err)
      });
      setStep('error');
    }
  };

  const handleRegistrationCompleted = (newMember) => {
    setShowRegisterModal(false);
    // Continue attendance flow seamlessly for the same member!
    if (coords) {
      handleExecuteAttendance(newMember.phone, coords, newMember);
    } else {
      setStep('locating');
    }
  };

  // Dedicated Manual Location Verification (Zero attendance recorded - Requirement 1, 3)
  const handleStartManualVerification = async () => {
    setStep('manual_locating');
    if (!navigator.onLine) {
      setManualResult({
        verified: false,
        message: 'Unable to verify the current gym location. Please check your internet connection and try again.'
      });
      setStep('manual_result');
      return;
    }

    if (!navigator.geolocation) {
      setManualResult({
        verified: false,
        message: 'Geolocation is not supported by your browser.'
      });
      setStep('manual_result');
      return;
    }

    try {
      const pos = await acquireBestLocation({
        timeoutMs: 8000,
        targetAccuracy: 40,
        onProgress: (progressCoords) => {
          setGpsAccuracy(progressCoords.accuracy);
        }
      });
      const { latitude, longitude, accuracy } = pos;
      const result = await verifyGymLocationOnly({ latitude, longitude, accuracy });
      setManualResult(result);
      setStep('manual_result');
    } catch (err) {
      setManualResult({
        verified: false,
        message: 'Unable to retrieve device GPS. Please turn on location permissions or turn on Wi-Fi for indoor positioning.'
      });
      setStep('manual_result');
    }
  };

  const containerClass = "min-h-screen bg-[#f8f7f3] flex items-center justify-center p-4 font-sans relative overflow-hidden";
  const cardClass = "w-full max-w-[460px] bg-white border border-[#e7e2d5] rounded-3xl p-6 sm:p-8 text-center shadow-xl animate-fade-in relative z-10";

  // ==========================================
  // 1. WELCOME SCREEN (INITIAL STATE)
  // Two Separate Actions: [ SCAN GYM QR ] and [ MANUAL VERIFICATION ]
  // ==========================================
  if (step === 'welcome' && !scannedToken) {
    return (
      <div className={containerClass}>
        <div className="absolute w-96 h-96 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className={cardClass}>
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-neutral-950 shadow-gold-sm">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h1 className="text-neutral-900 text-2xl font-black uppercase tracking-tight font-athletic">
              {gymSettings?.gymName || 'New Boss Gym'}
            </h1>
            <p className="text-gold-700 text-xs font-black uppercase tracking-widest mt-1 font-athletic">
              Official Attendance Kiosk
            </p>
            <p className="text-neutral-500 text-xs mt-1 font-medium">
              Geofenced Check-in & Workout Routine
            </p>
          </div>

          <div className="space-y-3 my-6">
            <div className="p-3.5 bg-[#faf9f6] rounded-2xl border border-[#e7e2d5] text-left flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 uppercase font-athletic">Scan Gym QR</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Scan the official entrance QR on the gym wall to log attendance.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#faf9f6] rounded-2xl border border-[#e7e2d5] text-left flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 uppercase font-athletic">Manual Verification</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Test device GPS location against gym geofence without recording attendance.</p>
              </div>
            </div>
          </div>

          {/* TWO SEPARATE ACTIONS (Requirement 3) */}
          <div className="space-y-2.5">
            <button
              onClick={() => {
                scanLockedRef.current = false;
                setStep('scanning');
              }}
              className="w-full min-h-[48px] py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-gold-sm transition-all flex items-center justify-center gap-2 active:scale-95 font-athletic cursor-pointer"
            >
              <Camera size={16} />
              <span>SCAN GYM QR</span>
            </button>

            <button
              onClick={handleStartManualVerification}
              className="w-full min-h-[46px] py-3 bg-white hover:bg-neutral-50 border-2 border-gold-300 text-gold-800 hover:text-gold-900 font-black rounded-2xl text-xs uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 font-athletic cursor-pointer"
            >
              <Compass size={16} className="text-gold-600" />
              <span>MANUAL VERIFICATION</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#e7e2d5] flex items-center justify-center text-xs">
            <Link to="/" className="text-neutral-500 hover:text-neutral-900 font-bold flex items-center gap-1 font-athletic">
              <ArrowLeft size={13} />
              <span>Back to Home</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // 2. SCANNING SCREEN (CAMERA ACTIVE)
  // ==========================================
  if (step === 'scanning') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setStep('welcome')}
              className="p-2 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-xs font-black uppercase text-gold-700 font-athletic">
              Scan Gym Entrance QR
            </span>
            <div className="w-8" />
          </div>

          <p className="text-xs text-neutral-500 mb-4">
            Align the official New Boss Gym entrance QR code within the frame to verify attendance.
          </p>

          {/* Scanner Viewfinder Box */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-gold-400 bg-neutral-950 aspect-square max-w-[280px] mx-auto shadow-2xl flex items-center justify-center">
            <div id={scannerContainerId} className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none border-4 border-gold-400/40 rounded-3xl animate-pulse" />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => setStep('welcome')}
              className="w-full py-3 px-4 rounded-xl bg-[#faf9f6] hover:bg-neutral-100 border border-[#e7e2d5] text-neutral-700 font-bold text-xs uppercase tracking-wider font-athletic cursor-pointer"
            >
              Cancel & Return to Check-In Page
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // 3. LOCATING SCREEN (GPS IN PROGRESS)
  // ==========================================
  if (step === 'locating') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="w-16 h-16 rounded-2xl bg-gold-50 border border-gold-300 flex items-center justify-center mx-auto mb-4 text-gold-700 animate-pulse">
            <MapPin className="w-8 h-8" />
          </div>
          <h2 className="text-neutral-900 text-lg font-black uppercase font-athletic">
            Verifying Gym Geofence
          </h2>
          <div className="mt-3 flex justify-center">
            <Loader2 className="w-6 h-6 text-gold-600 animate-spin" />
          </div>
          <p className="text-neutral-500 text-xs mt-3 max-w-xs mx-auto font-medium">
            {gpsAccuracy 
              ? `Calibrating device GPS (current accuracy ±${gpsAccuracy}m)...`
              : 'Acquiring satellite and Wi-Fi positioning for New Boss Gym perimeter...'}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. MANUAL VERIFICATION - LOCATING
  // ==========================================
  if (step === 'manual_locating') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="w-16 h-16 rounded-2xl bg-gold-50 border border-gold-300 flex items-center justify-center mx-auto mb-4 text-gold-700 animate-pulse">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-neutral-900 text-lg font-black uppercase font-athletic">
            Checking Physical Location
          </h2>
          <div className="mt-3 flex justify-center">
            <Loader2 className="w-6 h-6 text-gold-600 animate-spin" />
          </div>
          <p className="text-neutral-500 text-xs mt-3 max-w-xs mx-auto font-medium">
            {gpsAccuracy 
              ? `Calibrating device GPS (current accuracy ±${gpsAccuracy}m)...`
              : 'Requesting device GPS and fetching current gym geofence configuration from backend...'}
          </p>
          <div className="mt-4 pt-3 border-t border-[#e7e2d5]">
            <button
              onClick={() => setStep('welcome')}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 font-athletic"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. MANUAL VERIFICATION - RESULT (GPS ONLY, NO QR, NO ATTENDANCE)
  // Flow: CHECK-IN PAGE -> MANUAL VERIFICATION -> GPS -> Current Gym Location -> Result -> BACK -> CHECK-IN PAGE
  // ==========================================
  if (step === 'manual_result' && manualResult) {
    const isVerified = manualResult.verified;

    return (
      <div className={containerClass}>
        <div className={`${cardClass} ${isVerified ? 'border-emerald-300' : 'border-red-300'}`}>
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => setStep('welcome')}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-athletic"
              title="Return to Check-In Page"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-athletic">
              Location Verification Only
            </span>
            <div className="w-8" />
          </div>

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
            isVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {isVerified ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <h2 className="text-xl font-black uppercase font-athletic text-neutral-900">
            {isVerified ? "LOCATION VERIFIED" : "LOCATION NOT VERIFIED"}
          </h2>

          <p className={`text-xs mt-1.5 font-bold ${isVerified ? 'text-emerald-700' : 'text-red-700'}`}>
            {isVerified 
              ? "You are inside the gym attendance area." 
              : "You are outside the gym attendance area."}
          </p>

          {/* Distance Info Grid */}
          <div className="bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl p-4 my-5 grid grid-cols-2 gap-3 text-left text-xs">
            <div>
              <span className="text-[10px] uppercase font-black text-neutral-400 font-athletic block">Distance</span>
              <span className="font-mono font-bold text-neutral-900 text-sm block mt-0.5">
                {manualResult.distance != null ? `${manualResult.distance}m` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-neutral-400 font-athletic block">Allowed Radius</span>
              <span className="font-mono font-bold text-neutral-900 text-sm block mt-0.5">
                {manualResult.allowedRadius != null ? `${manualResult.allowedRadius}m` : '50m'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 mb-5">
            Note: Manual Verification only confirms your GPS geofence. No attendance record has been created.
          </p>

          <div className="space-y-2">
            {/* BACK Button returns to Check-In Page (Requirement 1, TEST 3) */}
            <button
              onClick={() => setStep('welcome')}
              className="w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft size={15} />
              <span>Back to Check-In Page</span>
            </button>
            <button
              onClick={handleStartManualVerification}
              className="w-full py-2.5 bg-white hover:bg-neutral-50 border border-[#e7e2d5] text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl font-athletic cursor-pointer"
            >
              Re-check Location
            </button>
            <Link
              to="/"
              className="block py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 font-athletic"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. PHONE INPUT SCREEN (IDENTIFY ATHLETE)
  // ==========================================
  if (step === 'phone_input') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-4 font-athletic">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Facility Geofence Verified ({gpsAccuracy ? `±${gpsAccuracy}m` : 'GPS Verified'})</span>
          </div>

          <h2 className="text-neutral-900 text-xl font-black uppercase font-athletic">
            Athlete Identification
          </h2>
          <p className="text-xs text-neutral-500 mt-1 mb-6">
            Enter your 10-digit registered mobile number to log attendance.
          </p>

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="text-left">
              <label className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block mb-1.5 font-athletic">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-neutral-400">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#faf9f6] border border-[#e7e2d5] rounded-xl pl-12 pr-4 py-3.5 text-sm font-mono font-bold text-neutral-900 focus:outline-none focus:border-gold-500 focus:bg-white transition-all tracking-wider"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={phone.trim().length !== 10}
              className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all disabled:opacity-50 active:scale-95 font-athletic cursor-pointer"
            >
              Verify & Complete Attendance
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#e7e2d5]">
            <button
              onClick={() => setStep('welcome')}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 font-athletic"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 7. PROCESSING SCREEN
  // ==========================================
  if (step === 'processing') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="w-16 h-16 rounded-2xl bg-gold-50 border border-gold-300 flex items-center justify-center mx-auto mb-4 text-gold-700">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-neutral-900 text-lg font-black uppercase font-athletic">
            Processing Attendance
          </h2>
          <p className="text-neutral-500 text-xs mt-2">
            Verifying membership validity and updating real-time attendance session...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 8. DUPLICATE SCAN SCREEN (30-SECOND COOLDOWN)
  // ==========================================
  if (step === 'duplicate_scan') {
    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-amber-300`}>
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Hourglass className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-neutral-900 text-lg font-black uppercase font-athletic">
            Scan Cooldown Active
          </h2>
          <p className="text-neutral-600 text-xs mt-2 leading-relaxed">
            You scanned recently. Please wait before scanning again.
          </p>
          <div className="my-6 py-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
            <span className="font-mono text-3xl font-black text-amber-700">
              {secondsRemaining}s
            </span>
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mt-1 font-athletic">
              Cooldown Remaining
            </p>
          </div>
          <Link
            to="/"
            className="block text-xs font-bold text-neutral-500 hover:text-neutral-900 font-athletic"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // 9. UNREGISTERED MEMBER SCREEN
  // ==========================================
  if (step === 'not_registered') {
    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-amber-300`}>
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-neutral-900 text-lg font-black uppercase font-athletic">
            Member Registration Required
          </h2>
          <p className="text-neutral-600 text-xs mt-2 leading-relaxed">
            Mobile number <strong className="font-mono text-neutral-900">{phone}</strong> is not registered in our athlete database.
          </p>
          <div className="my-6 space-y-3">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic active:scale-95 cursor-pointer"
            >
              Enrol as New Athlete
            </button>
            <button
              onClick={() => {
                setPhone('');
                setStep('phone_input');
              }}
              className="w-full py-3 bg-[#faf9f6] hover:bg-neutral-100 border border-[#e7e2d5] text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl font-athletic cursor-pointer"
            >
              Enter Different Phone Number
            </button>
          </div>
        </div>

        {showRegisterModal && (
          <MemberFormModal
            initialPhone={phone}
            onClose={() => setShowRegisterModal(false)}
            onSaved={handleRegistrationCompleted}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // 10. CHECK-IN SUCCESS SCREEN (WITH WORKOUT!)
  // ==========================================
  if (step === 'success_checkin' && resultData) {
    const { member, session, workout } = resultData;
    const timeFormatted = session.entryTime.toLocaleTimeString('en-IN', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });

    return (
      <div className={containerClass}>
        <div className="w-full max-w-[500px] bg-white border border-emerald-300 rounded-3xl p-6 sm:p-8 text-center shadow-2xl animate-fade-in relative z-10 max-h-[92vh] overflow-y-auto custom-scrollbar">
          
          {/* Header Badge */}
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircle className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 font-athletic block">
            CHECK-IN SUCCESSFUL
          </span>
          <h2 className="text-2xl font-black text-neutral-900 uppercase mt-0.5 mb-1 font-athletic">
            {member.name}
          </h2>
          <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
            <Check size={14} /> Attendance Registered
          </span>

          {/* Verification Details Strip */}
          <div className="bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl p-3.5 my-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Check-in</span>
              <span className="font-mono font-bold text-neutral-900 text-[11px] block mt-0.5">{timeFormatted}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Location</span>
              <span className="font-black text-emerald-600 text-[11px] block mt-0.5">VERIFIED</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Distance</span>
              <span className="font-mono font-bold text-neutral-900 text-[11px] block mt-0.5">{session.distance}m</span>
            </div>
          </div>

          {/* TODAY'S ASSIGNED WORKOUT CARD */}
          <div className="text-left mt-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gold-700 font-athletic flex items-center gap-1.5">
                <Flame size={14} className="text-gold-600" />
                <span>TODAY'S WORKOUT</span>
              </span>
              <span className="text-[10px] font-bold text-neutral-400 font-mono">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {workout ? (
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-3xl p-5 text-white shadow-xl space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white uppercase font-athletic leading-tight">
                    {workout.title}
                  </h3>
                  <p className="text-xs text-gold-400 font-medium mt-0.5">
                    {workout.muscles || 'Target Muscle Group'}
                  </p>
                </div>

                {workout.exercises && workout.exercises.length > 0 ? (
                  <div className="space-y-2 border-t border-[#262626] pt-3">
                    <span className="text-[10px] uppercase font-black text-neutral-400 font-athletic block">
                      Routine Exercises
                    </span>
                    {workout.exercises.map((ex, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#202020] text-xs">
                        <span className="font-bold text-white uppercase font-athletic">{ex.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gold-400 text-xs font-bold">{ex.sets} × {ex.reps}</span>
                          {ex.notes && (
                            <span className="text-[10px] text-neutral-400 hidden sm:inline truncate max-w-[120px]">
                              ({ex.notes})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#202020] rounded-xl text-xs text-neutral-300">
                    Standard training routine active. Focus on controlled form.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl text-center text-neutral-500 text-xs">
                <Dumbbell className="w-6 h-6 mx-auto mb-1 text-gold-600" />
                <p className="font-bold text-neutral-900">No workout has been assigned for today.</p>
                <p className="text-[11px] mt-0.5">Enjoy your free training session or ask your trainer for a routine.</p>
              </div>
            )}
          </div>

          {/* Action Buttons for Current Member Only */}
          <div className="space-y-2 pt-2 border-t border-[#e7e2d5]">
            <Link
              to={`/members/${member.id}`}
              className="w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all font-athletic flex items-center justify-center gap-2 shadow-gold-sm active:scale-95"
            >
              <Award size={15} />
              <span>VIEW MY ATTENDANCE</span>
            </Link>
            <Link
              to="/schedule"
              className="w-full py-3 bg-[#faf9f6] hover:bg-neutral-100 border border-[#e7e2d5] text-neutral-800 font-black rounded-xl text-xs uppercase tracking-wider transition-colors font-athletic flex items-center justify-center gap-2 active:scale-95"
            >
              <Flame size={15} className="text-gold-600" />
              <span>VIEW MY WORKOUT</span>
            </Link>
            <Link
              to="/"
              className="block py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 font-athletic"
            >
              Back to Home
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // 11. CHECK-OUT SUCCESS SCREEN
  // ==========================================
  if (step === 'success_checkout' && resultData) {
    const { member, session } = resultData;
    const entryFormatted = session.entryTime.toLocaleTimeString('en-IN', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
    const exitFormatted = session.exitTime.toLocaleTimeString('en-IN', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });

    const durationDisplay = session.durationMinutes >= 60 
      ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m` 
      : `${session.durationMinutes}m`;

    return (
      <div className={containerClass}>
        <div className="w-full max-w-[480px] bg-white border border-blue-300 rounded-3xl p-6 sm:p-8 text-center shadow-2xl animate-fade-in relative z-10 max-h-[92vh] overflow-y-auto custom-scrollbar">
          
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <LogOut className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 font-athletic block">
            CHECK-OUT SUCCESSFUL
          </span>
          <h2 className="text-2xl font-black text-neutral-900 uppercase mt-0.5 mb-1 font-athletic">
            {member.name}
          </h2>

          <div className="my-3 inline-block bg-blue-50 border border-blue-200 text-blue-900 px-5 py-2 rounded-full font-black text-xs font-athletic">
            Total Floor Duration: {durationDisplay}
          </div>

          <div className="bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl p-4 my-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Check-in</span>
              <span className="font-mono font-bold text-neutral-900 text-[11px] block mt-0.5">{entryFormatted}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Check-out</span>
              <span className="font-mono font-bold text-neutral-900 text-[11px] block mt-0.5">{exitFormatted}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Location</span>
              <span className="font-black text-emerald-600 text-[11px] block mt-0.5">VERIFIED</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Session</span>
              <span className="font-black text-blue-700 text-[11px] block mt-0.5">CLOSED</span>
            </div>
          </div>

          <p className="text-neutral-500 text-xs my-4 font-medium">
            Great training session today! Rest, refuel, and recover for your next workout.
          </p>

          <div className="space-y-2 pt-2 border-t border-[#e7e2d5]">
            <Link
              to={`/members/${member.id}`}
              className="w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all font-athletic flex items-center justify-center gap-2 shadow-gold-sm active:scale-95"
            >
              <Award size={15} />
              <span>VIEW MY ATTENDANCE</span>
            </Link>
            <Link
              to="/"
              className="block py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 font-athletic"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 12. ERROR SCREEN
  // ==========================================
  if (step === 'error' && errorDetails) {
    const isOutside = errorDetails.code === 'OUTSIDE_GEOFENCE';
    const isOffline = errorDetails.code === 'OFFLINE';

    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-red-300`}>
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            {isOffline ? <WifiOff className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
          </div>

          <h2 className="text-neutral-900 text-lg font-black uppercase font-athletic">
            {isOutside ? "Location Not Verified" : isOffline ? "Offline" : "Verification Failed"}
          </h2>

          <p className="text-neutral-600 text-xs mt-2 leading-relaxed">
            {errorDetails.message || "An error occurred during verification."}
          </p>

          {errorDetails.technicalDetails && errorDetails.technicalDetails !== errorDetails.message && (
            <p className="mt-2 text-[10px] text-neutral-400 font-mono bg-[#faf9f6] border border-[#e7e2d5] p-2 rounded-xl break-all">
              {errorDetails.technicalDetails}
            </p>
          )}

          {isOutside && errorDetails.detectedDistance != null && (
            <div className="mt-4 p-3.5 bg-[#faf9f6] rounded-2xl border border-[#e7e2d5] text-left w-full text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans font-medium">Distance:</span>
                <span className="font-bold text-red-600">{errorDetails.detectedDistance}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans font-medium">Allowed Radius:</span>
                <span className="font-bold text-neutral-700">{errorDetails.allowedRadius || 50}m</span>
              </div>
            </div>
          )}

          {errorDetails.code === 'LOCATION_LOW_ACCURACY' && (
            <div className="mt-4 p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-left w-full space-y-2">
              <span className="text-[11px] font-black uppercase text-amber-900 font-athletic flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-amber-600" />
                <span>Indoor Accuracy Boost Tips</span>
              </span>
              <ul className="text-xs text-amber-800 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-600 shrink-0">•</span>
                  <span><strong>Turn on Wi-Fi:</strong> Mobile phones use Wi-Fi signals to dramatically improve indoor positioning accuracy (no login required).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-600 shrink-0">•</span>
                  <span><strong>Google / Apple Precise Location:</strong> Ensure high accuracy location is turned on in your device settings.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-600 shrink-0">•</span>
                  <span><strong>Step near the entrance:</strong> Thick gym walls and metal roofs shield satellite reception. Moving near a doorway or window enables an instant lock.</span>
                </li>
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => {
                setErrorDetails(null);
                setStep('scanning');
              }}
              className="w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic active:scale-95 cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={handleStartManualVerification}
              className="w-full py-2.5 bg-white hover:bg-neutral-50 border border-[#e7e2d5] text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl font-athletic cursor-pointer"
            >
              Manual Location Check
            </button>
            <Link
              to="/"
              className="py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 font-athletic"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CheckinPage;
