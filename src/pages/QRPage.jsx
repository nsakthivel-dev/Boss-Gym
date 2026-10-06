import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Download, QrCode, MapPin, Dumbbell, Sparkles, ShieldCheck, 
  RotateCw, Ban, CheckCircle2, AlertTriangle, Printer, KeyRound,
  Loader2, ShieldAlert
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { 
  getActiveGymQR, regenerateGymQR, revokeGymQR, getGymLocationConfig 
} from '../utils/attendanceService';

const QRPage = () => {
  const { settings: gymSettings } = useSettings();
  const [locationConfig, setLocationConfig] = useState(null);
  const [qrConfig, setQrConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [config, loc] = await Promise.all([
        getActiveGymQR(),
        getGymLocationConfig()
      ]);
      setQrConfig(config);
      setLocationConfig(loc);
    } catch (err) {
      console.error('Failed to load QR configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
  };

  const gymName = locationConfig?.gymName || gymSettings?.gymName || 'New Boss Gym';
  const latitude = locationConfig?.latitude ?? Number(gymSettings?.latitude || 11.9111586);
  const longitude = locationConfig?.longitude ?? Number(gymSettings?.longitude || 79.6347447);
  const radius = locationConfig?.radius ?? Number(gymSettings?.radius || 500);

  // Official Attendance Check-in URL using Secure Gym Token ONLY.
  // Critical: No static latitude, longitude, or radius in the QR string.
  // The QR identifies the gym token; the backend resolves current geofence coordinates.
  const activeToken = qrConfig?.token || 'NBG_SEC_DEFAULT';
  const officialCheckinUrl = `${window.location.origin}/checkin?token=${activeToken}`;

  const handleRegenerate = async () => {
    if (!window.confirm("Regenerating the Gym QR will invalidate any previously printed entrance posters. Are you sure you want to generate a new secure QR token?")) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await regenerateGymQR();
      setQrConfig(res.qrConfig);
      showNotification('success', 'New secure QR token generated successfully. Previous entrance code revoked.');
    } catch (err) {
      showNotification('error', 'Failed to regenerate QR code.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm("Revoking the QR code will immediately disable all athlete check-ins using this QR until a new code is generated. Proceed?")) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await revokeGymQR();
      setQrConfig(res.qrConfig);
      showNotification('success', 'Gym QR code has been revoked. Attendance check-in is paused.');
    } catch (err) {
      showNotification('error', 'Failed to revoke QR code.');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadQRPoster = () => {
    const canvas = document.getElementById('admin-qr-canvas');
    if (!canvas) return;

    requestAnimationFrame(() => {
      const qrSize = canvas.width;
      const quietZone = 50;
      const textAreaHeight = 160;
      
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = qrSize + (quietZone * 2);
      downloadCanvas.height = qrSize + (quietZone * 2) + textAreaHeight;
      
      const ctx = downloadCanvas.getContext('2d');

      // Crisp white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

      // Gold border frame
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, downloadCanvas.width - 16, downloadCanvas.height - 16);

      // Inner thin border
      ctx.strokeStyle = '#e7e2d5';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, downloadCanvas.width - 36, downloadCanvas.height - 36);

      // Draw QR code with quiet zone
      ctx.drawImage(canvas, quietZone, quietZone);

      // Gym name text below QR
      ctx.fillStyle = '#111111';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.font = 'bold 30px Montserrat, Arial, sans-serif';
      ctx.fillText(gymName.toUpperCase(), downloadCanvas.width / 2, qrSize + quietZone + 38);
      
      ctx.font = 'bold 15px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#9f7d16';
      ctx.fillText(
        'OFFICIAL GYM CHECK-IN QR', 
        downloadCanvas.width / 2, 
        qrSize + quietZone + 74
      );

      ctx.font = 'bold 12px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#111111';
      ctx.fillText(
        'SCAN UPON ENTERING & EXITING THE GYM', 
        downloadCanvas.width / 2, 
        qrSize + quietZone + 102
      );

      ctx.font = '11px Arial, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(
        `GPS Geofenced Area: ${radius}m Allowed Radius · Auto-Synced`, 
        downloadCanvas.width / 2, 
        qrSize + quietZone + 128
      );

      const link = document.createElement('a');
      link.download = `${gymName.toLowerCase().replace(/\s+/g, '_')}_official_attendance_qr.png`;
      link.href = downloadCanvas.toDataURL('image/png');
      link.click();
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const isActive = qrConfig?.status === 'active';

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-700 font-athletic block mb-1">
          Attendance Security & Turnstiles
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-neutral-900 uppercase tracking-tight flex items-center justify-center gap-2.5 font-athletic">
          <QrCode className="text-gold-600 w-8 h-8" />
          <span>Gym Check-In QR</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
          Single official entrance QR for New Boss Gym. Automatically synchronizes with admin geo coordinates and geofence radius.
        </p>
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Location & Geofence Metadata Strip (Database Single Source of Truth) */}
      <div className="bg-white border border-[#e7e2d5] rounded-2xl p-4 shadow-xs grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block font-athletic">Gym Facility</span>
          <span className="font-bold text-neutral-900 truncate block">{gymName}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block font-athletic">Current Coordinates</span>
          <span className="font-mono text-neutral-700 text-[11px] truncate block font-bold">
            {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block font-athletic">Allowed Geofence</span>
          <span className="font-black text-gold-700 font-athletic block">{radius} meters</span>
        </div>
      </div>

      {/* Main Single Official QR Card */}
      <div className="bg-white border border-[#e7e2d5] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center gap-5 text-center relative overflow-hidden">
        
        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase font-athletic ${
            isActive 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span>QR STATUS: {isActive ? 'ACTIVE' : 'REVOKED'}</span>
          </span>
        </div>

        {/* QR Code Canvas */}
        <div className={`bg-white p-5 rounded-3xl border-2 shadow-sm transition-all ${
          isActive ? 'border-gold-300' : 'border-red-300 opacity-50 grayscale'
        }`}>
          {loading ? (
            <div className="w-[240px] h-[240px] flex items-center justify-center text-gold-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <QRCodeCanvas
              id="admin-qr-canvas"
              value={officialCheckinUrl}
              size={240}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#111111"
            />
          )}
        </div>

        <div>
          <p className="text-neutral-900 font-black text-xl uppercase tracking-wider font-athletic">{gymName}</p>
          <p className="text-neutral-500 text-xs mt-0.5 font-medium">
            Scan with smartphone camera or inside the athlete portal
          </p>
          <p className="text-neutral-400 text-[11px] font-mono mt-1">
            Secure Token: {activeToken ? `${activeToken.slice(0, 16)}...` : 'Generating...'}
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={downloadQRPoster}
            disabled={!isActive || actionLoading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" /> 
            <span>Download QR Poster</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!isActive || actionLoading}
            className="flex items-center justify-center gap-2 bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] hover:border-gold-400 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all font-athletic active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-gold-400" />
            <span>Print QR Sign</span>
          </button>
        </div>

        {/* Admin Management Controls: Regenerate / Revoke */}
        <div className="w-full border-t border-[#e7e2d5] pt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRegenerate}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border border-gold-300 bg-gold-50 text-gold-800 hover:bg-gold-100 transition-all font-athletic cursor-pointer active:scale-95"
            title="Generate a fresh secure QR token"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4 text-gold-600" />}
            <span>Regenerate QR</span>
          </button>

          {isActive ? (
            <button
              onClick={handleRevoke}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all font-athletic cursor-pointer active:scale-95"
              title="Immediately disable this QR"
            >
              <Ban className="w-4 h-4" />
              <span>Revoke QR</span>
            </button>
          ) : (
            <button
              onClick={handleRegenerate}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-500 transition-all font-athletic cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Reactivate QR</span>
            </button>
          )}
        </div>

        {/* Verification Link Info */}
        <div className="w-full bg-[#faf9f6] rounded-2xl p-3 border border-[#e7e2d5] text-center">
          <p className="text-[10px] uppercase font-bold text-neutral-400 font-athletic">
            Official Attendance Check-in Endpoint
          </p>
          <p className="text-neutral-600 text-[11px] font-mono break-all mt-0.5 select-all">
            {officialCheckinUrl}
          </p>
        </div>

      </div>

    </div>
  );
};

export default QRPage;
