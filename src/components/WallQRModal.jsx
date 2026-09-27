import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, QrCode, X, Sparkles, ShieldCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { getActiveGymQR } from '../utils/attendanceService';

const WallQRModal = ({ onClose }) => {
  const { settings: gymSettings } = useSettings();
  const gymName = gymSettings?.gymName || "NEW BOSS GYM";
  const radius = gymSettings?.radius || 50;

  const [activeToken, setActiveToken] = useState('');

  useEffect(() => {
    getActiveGymQR().then(cfg => {
      if (cfg?.token) setActiveToken(cfg.token);
    });
  }, []);

  const checkinBaseUrl = window.location.origin + '/checkin';
  const qrValue = activeToken 
    ? `${checkinBaseUrl}?token=${activeToken}` 
    : `${checkinBaseUrl}`;

  const downloadQR = () => {
    const canvas = document.getElementById("wall-qr-canvas");
    if (!canvas) return;

    requestAnimationFrame(() => {
      const qrSize = canvas.width;
      const padding = 40;
      const textAreaHeight = 130;
      
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = qrSize + padding * 2;
      exportCanvas.height = qrSize + padding * 2 + textAreaHeight;
      const ctx = exportCanvas.getContext("2d");

      // White background for crisp printing
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Gold border accent around entire card
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, exportCanvas.width - 8, exportCanvas.height - 8);

      // Draw QR code centered
      ctx.drawImage(canvas, padding, padding);

      // Gym Name in bold black
      ctx.fillStyle = "#111111";
      ctx.font = "bold 22px Montserrat, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        gymName.toUpperCase(),
        exportCanvas.width / 2,
        qrSize + padding + 32
      );

      // Instruction text in gold
      ctx.fillStyle = "#9f7d16";
      ctx.font = "bold 14px Montserrat, Arial, sans-serif";
      ctx.fillText(
        'OFFICIAL ENTRANCE ATTENDANCE QR',
        exportCanvas.width / 2,
        qrSize + padding + 62
      );

      ctx.fillStyle = "#111111";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(
        'SCAN UPON ENTERING & EXITING THE GYM',
        exportCanvas.width / 2,
        qrSize + padding + 85
      );

      ctx.fillStyle = "#666666";
      ctx.font = "10px Arial, sans-serif";
      ctx.fillText(
        `GPS Geofenced Area: ${radius}m Allowed Perimeter`,
        exportCanvas.width / 2,
        qrSize + padding + 105
      );

      // Trigger download
      const link = document.createElement("a");
      link.download = `${gymName.toLowerCase().replace(/\s+/g, '_')}_wall_qr.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-[#e7e2d5] rounded-3xl p-6 sm:p-8 max-w-[440px] w-full text-center shadow-2xl relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-2 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-neutral-950 shadow-gold-sm">
          <QrCode size={24} />
        </div>

        <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight font-athletic">Wall QR Poster</h2>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
          High-resolution QR code configured for gym entrance and turnstile scanning.
        </p>

        {/* QR Canvas Container */}
        <div className="bg-white p-5 rounded-3xl border-2 border-dashed border-gold-300 mx-auto w-fit shadow-xs my-5">
          <QRCodeCanvas
            id="wall-qr-canvas"
            value={qrValue}
            size={220}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#111111"
          />
        </div>

        <div className="mb-4">
          <p className="text-neutral-900 font-black text-base uppercase font-athletic">{gymName}</p>
          <p className="text-neutral-500 text-[11px] font-mono break-all mt-1">
            {activeToken ? `Token: ${activeToken.slice(0, 16)}...` : 'Connecting to secure QR...'}
          </p>
        </div>

        <button
          onClick={downloadQR}
          className="w-full min-h-[44px] py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all flex items-center justify-center gap-2 font-athletic active:scale-95 cursor-pointer"
        >
          <Download size={16} />
          <span>Download Printable Poster PNG</span>
        </button>
      </div>
    </div>
  );
};

export default WallQRModal;
