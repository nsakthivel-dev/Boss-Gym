import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { processAttendance, fetchMemberTodayWorkout } from '../utils/attendanceService';
import MemberFormModal from '../components/MemberFormModal';
import { 
  Camera, MapPin, XCircle, AlertTriangle, Ban, CheckCircle, 
  LogOut, Hourglass, Loader2, Dumbbell, ArrowRight, RefreshCw, 
  Smartphone, Flame, ShieldCheck, Zap, QrCode, ArrowLeft,
  ChevronRight, Clock, UserPlus, Check, Award
} from 'lucide-react';

const CheckinPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings: gymSettings, loading: settingsLoading } = useSettings();

  // Page States: 'welcome', 'scanning', 'locating', 'phone_input', 'processing', 'success_checkin', 'success_checkout', 'error'
  const [step, setStep] = useState('welcome');
  const [phone, setPhone] = useState(localStorage.getItem('nbg_saved_phone') || '');
  const [scannedToken, setScannedToken] = useState(searchParams.get('token') || searchParams.get('qr') || '');
  const [coords, setCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  
  // Results & Errors
  const [errorDetails, setErrorDetails] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Scanner ref
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = "html5-qr-reader";

  // If token was passed via URL parameter (e.g. member scanned wall QR with native camera)
  useEffect(() => {
    const urlToken = searchParams.get('token') || searchParams.get('qr');
    if (urlToken) {
      setScannedToken(urlToken);
      // Automatically proceed to location verification
      setStep('locating');
    }
  }, [searchParams]);

  // When step is 'locating', request GPS
  useEffect(() => {
    if (step === 'locating') {
      acquireLocation();
    }
  }, [step]);

  // Camera scanner lifecycle
  useEffect(() => {
    if (step === 'scanning') {
      const startScanner = async () => {
        try {
          // Wait for DOM element
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
              // Successfully decoded QR
              scanner.stop().then(() => {
                setScannedToken(decodedText);
                setStep('locating');
              }).catch(() => {
                setScannedToken(decodedText);
                setStep('locating');
              });
            },
            () => {
              // Parse error / frame skipped
            }
          );
        } catch (err) {
          console.error("Camera scanner start failed:", err);
          setErrorDetails({
            code: 'CAMERA_DENIED',
            message: 'Camera permission denied or camera not found. Please allow camera access in your browser settings or enter the code manually.'
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

  // Countdown timer for duplicate scan
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

  const acquireLocation = () => {
    if (!navigator.geolocation) {
      setErrorDetails({
        code: 'LOCATION_UNSUPPORTED',
        message: 'Geolocation is not supported by your browser or device.'
      });
      setStep('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, accuracy });
        setGpsAccuracy(Math.round(accuracy));

        // If phone already available, proceed directly to verify
        if (phone && phone.trim().length === 10) {
          handleExecuteAttendance(phone.trim(), { latitude, longitude, accuracy });
        } else {
          setStep('phone_input');
        }
      },
      (geoErr) => {
        console.error("Geolocation error:", geoErr);
        if (geoErr.code === 1) {
          setErrorDetails({
            code: 'LOCATION_DENIED',
            message: 'Location permission is required to verify gym attendance. Please allow location in your browser settings and try again.'
          });
        } else {
          setErrorDetails({
            code: 'LOCATION_ERROR',
            message: 'Unable to retrieve your device coordinates. Please ensure GPS is turned on and try again.'
          });
        }
        setStep('error');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
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
        memberOverride,
        gymSettings
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

      // Success
      setResultData(res);
      if (res.action === 'check_in') {
        setStep('success_checkin');
      } else {
        setStep('success_checkout');
      }
    } catch (err) {
      console.error("Attendance execution error:", err);
      setErrorDetails({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the attendance service. Please check your internet connection and try again.'
      });
      setStep('error');
    }
  };

  const handleRegistrationCompleted = (newMember) => {
    setShowRegisterModal(false);
    // Continue attendance flow seamlessly with the newly created member!
    if (coords) {
      handleExecuteAttendance(newMember.phone, coords, newMember);
    } else {
      setStep('locating');
    }
  };

  const containerClass = "min-h-screen bg-[#f8f7f3] flex items-center justify-center p-4 font-sans relative overflow-hidden";
  const cardClass = "w-full max-w-[460px] bg-white border border-[#e7e2d5] rounded-3xl p-6 sm:p-8 text-center shadow-xl animate-fade-in relative z-10";

  // ==========================================
  // 1. WELCOME SCREEN (INITIAL STATE)
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
              Contactless Attendance Kiosk
            </p>
            <p className="text-neutral-500 text-xs mt-1 font-medium">
              Geofenced Check-in & Workout Routine
            </p>
          </div>

          <div className="space-y-3.5 my-6">
            <div className="p-4 bg-[#faf9f6] rounded-2xl border border-[#e7e2d5] text-left flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 uppercase font-athletic">Scan Entrance QR</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Point your camera at the official New Boss Gym poster.</p>
              </div>
            </div>

            <div className="p-4 bg-[#faf9f6] rounded-2xl border border-[#e7e2d5] text-left flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 uppercase font-athletic">Verify GPS Location</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Ensure you are physically on-site within {gymSettings?.radius || 50}m.</p>
              </div>
            </div>

            <div className="p-4 bg-[#faf9f6] rounded-2xl border border-[#e7e2d5] text-left flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center shrink-0 font-bold text-xs">
                3
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 uppercase font-athletic">Instant Workout Sync</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">View today's assigned split, exercises, sets, and reps.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('scanning')}
            className="w-full min-h-[48px] py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-gold-sm transition-all flex items-center justify-center gap-2 active:scale-95 font-athletic cursor-pointer"
          >
            <Camera size={16} />
            <span>Open Camera & Scan QR</span>
          </button>

          <div className="mt-4 pt-4 border-t border-[#e7e2d5] flex items-center justify-between text-xs">
            <Link to="/" className="text-neutral-500 hover:text-neutral-900 font-bold flex items-center gap-1 font-athletic">
              <ArrowLeft size={13} />
              <span>Back to Home</span>
            </Link>
            <button
              onClick={() => {
                setScannedToken('NBG_ATTENDANCE_TOKEN:DEFAULT');
                setStep('locating');
              }}
              className="text-gold-700 hover:text-gold-800 font-bold text-[11px] font-athletic cursor-pointer"
            >
              Manual Verification
            </button>
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
            Align the New Boss Gym attendance QR code within the frame to verify attendance.
          </p>

          {/* Scanner Viewfinder Box */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-gold-400 bg-neutral-950 aspect-square max-w-[280px] mx-auto shadow-2xl flex items-center justify-center">
            <div id={scannerContainerId} className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none border-4 border-gold-400/40 rounded-3xl animate-pulse" />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => {
                // Fallback manual token if camera is obstructed
                setScannedToken('NBG_ATTENDANCE_TOKEN:DEFAULT');
                setStep('locating');
              }}
              className="py-3 px-4 rounded-xl bg-[#faf9f6] hover:bg-neutral-100 border border-[#e7e2d5] text-neutral-700 font-bold text-xs uppercase tracking-wider font-athletic cursor-pointer"
            >
              Cannot Scan? Continue With GPS & Phone
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
            Confirming physical presence at New Boss Gym premises within the allowed {gymSettings?.radius || 50}m radius.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. PHONE INPUT SCREEN (IDENTIFY ATHLETE)
  // ==========================================
  if (step === 'phone_input') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-4 font-athletic">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Facility Perimeter Verified ({gpsAccuracy ? `±${gpsAccuracy}m` : 'GPS Verified'})</span>
          </div>

          <h2 className="text-xl font-black text-neutral-900 uppercase font-athletic mb-1">
            Athlete Identification
          </h2>
          <p className="text-xs text-neutral-500 mb-6">
            Enter your registered 10-digit mobile number to log check-in or check-out.
          </p>

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="text-left">
              <label className="text-[10px] font-black text-neutral-600 uppercase tracking-wider block mb-2 font-athletic">
                Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input 
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-xl font-black bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl py-4 pl-10 pr-4 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-gold-500 focus:bg-white transition-all font-mono"
                  autoFocus
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={phone.length < 10}
              className="w-full min-h-[48px] py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-gold-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 font-athletic cursor-pointer"
            >
              <span>Confirm & Process Attendance</span>
              <ArrowRight size={16} />
            </button>
          </form>

        </div>
      </div>
    );
  }

  // ==========================================
  // 5. PROCESSING SCREEN
  // ==========================================
  if (step === 'processing') {
    return (
      <div className={containerClass}>
        <div className={cardClass}>
          <div className="w-16 h-16 rounded-2xl bg-gold-50 border border-gold-300 flex items-center justify-center mx-auto mb-4 text-gold-700 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-neutral-900 text-lg font-black uppercase font-athletic">
            Processing Attendance
          </h2>
          <p className="text-neutral-500 text-xs mt-2 max-w-xs mx-auto">
            Validating membership, evaluating active session state, and fetching assigned workout...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. NOT REGISTERED SCREEN (TRIGGER REGISTRATION)
  // ==========================================
  if (step === 'not_registered') {
    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-amber-300`}>
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-neutral-900 text-lg font-black uppercase font-athletic">
            Member Registration Required
          </h2>
          <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
            The mobile number <strong className="text-neutral-900 font-mono font-bold">{phone}</strong> is not currently registered in our athlete directory.
          </p>
          <p className="text-neutral-500 text-xs mt-1">
            Enrol now to register and proceed directly into today's attendance session.
          </p>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="mt-6 w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-gold-sm transition-all flex items-center justify-center gap-2 font-athletic active:scale-95 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Complete Athlete Registration</span>
          </button>

          <button
            onClick={() => setStep('phone_input')}
            className="mt-3 w-full py-3 bg-[#faf9f6] text-neutral-600 rounded-xl text-xs font-bold uppercase hover:bg-neutral-100 transition-colors"
          >
            Re-enter Mobile Number
          </button>
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
  // 7. DUPLICATE SCAN SCREEN (30-SEC COOLDOWN)
  // ==========================================
  if (step === 'duplicate_scan') {
    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-amber-300`}>
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Hourglass className="w-7 h-7 animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 font-athletic">
            Duplicate Protection Active
          </span>
          <h2 className="text-xl font-black text-neutral-900 uppercase font-athletic mt-1">
            You Scanned Recently
          </h2>
          {errorDetails?.memberName && (
            <p className="text-sm font-bold text-neutral-800 mt-1">{errorDetails.memberName}</p>
          )}

          <div className="my-5 p-4 bg-[#faf9f6] rounded-2xl border border-amber-200">
            <p className="text-3xl font-black text-gold-700 font-athletic tracking-tight">
              {secondsRemaining}s
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Please wait before scanning again.
            </p>
          </div>

          <button
            onClick={() => setStep('phone_input')}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors font-athletic cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 8. CHECK-IN SUCCESS SCREEN (WITH WORKOUT!)
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
            Check-In Successful
          </span>
          <h2 className="text-2xl font-black text-neutral-900 uppercase mt-0.5 mb-1 font-athletic">
            {member.name}
          </h2>

          {/* Verification Details Strip */}
          <div className="bg-[#faf9f6] border border-[#e7e2d5] rounded-2xl p-3.5 my-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Checked In</span>
              <span className="font-mono font-bold text-neutral-900 text-[11px] block mt-0.5">{timeFormatted}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Location</span>
              <span className="font-black text-emerald-600 text-[11px] block mt-0.5">VERIFIED</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 font-athletic block">Distance</span>
              <span className="font-mono font-bold text-neutral-900 text-[11px] block mt-0.5">{session.distance} m</span>
            </div>
          </div>

          {/* TODAY'S ASSIGNED WORKOUT CARD */}
          <div className="text-left mt-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gold-700 font-athletic flex items-center gap-1.5">
                <Flame size={14} className="text-gold-600" />
                <span>Today's Assigned Workout</span>
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
                      Routine Breakdown
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
                    Standard athletic training split active. Consult Master Mani Suni for target weights.
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

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#e7e2d5]">
            <button
              onClick={() => {
                setStep('welcome');
                setScannedToken('');
                setResultData(null);
              }}
              className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors font-athletic cursor-pointer active:scale-95"
            >
              Done / Log Another Athlete
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
  // 9. CHECK-OUT SUCCESS SCREEN
  // ==========================================
  if (step === 'success_checkout' && resultData) {
    const { member, session, workout } = resultData;
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
            Check-Out Successful
          </span>
          <h2 className="text-2xl font-black text-neutral-900 uppercase mt-0.5 mb-1 font-athletic">
            {member.name}
          </h2>

          <div className="my-3 inline-block bg-blue-50 border border-blue-200 text-blue-900 px-5 py-2 rounded-full font-black text-xs font-athletic">
            Total Workout Duration: {durationDisplay}
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
              <span className="font-black text-blue-700 text-[11px] block mt-0.5">COMPLETED</span>
            </div>
          </div>

          <p className="text-neutral-500 text-xs my-4 font-medium">
            Great training session today! Rest, refuel, and recover for your next workout.
          </p>

          <button
            onClick={() => {
              setStep('welcome');
              setScannedToken('');
              setResultData(null);
            }}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors font-athletic cursor-pointer active:scale-95"
          >
            Done / Mark Another Athlete
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 10. ERROR SCREEN
  // ==========================================
  if (step === 'error' && errorDetails) {
    const isOutside = errorDetails.code === 'OUTSIDE_GEOFENCE';

    return (
      <div className={containerClass}>
        <div className={`${cardClass} border-red-300`}>
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-7 h-7" />
          </div>

          <h2 className="text-neutral-900 text-lg font-black uppercase font-athletic">
            {isOutside ? "Location Not Verified" : "Verification Failed"}
          </h2>

          <p className="text-neutral-600 text-xs mt-2 leading-relaxed">
            {errorDetails.message || "An error occurred during verification."}
          </p>

          {isOutside && (
            <div className="mt-4 p-3.5 bg-[#faf9f6] rounded-2xl border border-[#e7e2d5] text-left w-full text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Required Radius:</span>
                <span className="font-bold text-neutral-900">{errorDetails.allowedRadius || 50} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Detected Distance:</span>
                <span className="font-bold text-red-600">{errorDetails.detectedDistance || 0} m</span>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => {
                if (coords) {
                  setStep('phone_input');
                } else {
                  setStep('welcome');
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic cursor-pointer active:scale-95"
            >
              Try Again
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
