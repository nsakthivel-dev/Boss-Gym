import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, MapPin, QrCode, X, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const WallQRModal = ({ onClose }) => {
  const { settings: gymSettings } = useSettings();
  const checkinURL = `https://newbossgym.in.net/checkin`;
  const latitude = gymSettings?.latitude || 0;
  const longitude = gymSettings?.longitude || 0;
  const geoURI = `geo:${latitude},${longitude}`;

  const [qrType, setQrType] = useState('url'); // Default to URL for wall QR
  const qrValue = qrType === 'geo' ? geoURI : checkinURL;

  const downloadQR = () => {
    const canvas = document.getElementById("wall-qr-canvas");
    if (!canvas) return;

    requestAnimationFrame(() => {
      const qrSize = canvas.width;
      const padding = 40;
      const textAreaHeight = 110;
      
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
        (gymSettings?.gymName || "NEW BOSS GYM").toUpperCase(),
        exportCanvas.width / 2,
        qrSize + padding + 32
      );

      // Instruction text in gold
      ctx.fillStyle = "#9f7d16";
      ctx.font = "bold 14px Montserrat, Arial, sans-serif";
      ctx.fillText(
        qrType === 'geo' ? 'GPS FACILITY VERIFICATION CODE' : 'ATHLETE CHECK-IN KIOSK',
        exportCanvas.width / 2,
        qrSize + padding + 62
      );

      ctx.fillStyle = "#666666";
      ctx.font = "11px Arial, sans-serif";
      ctx.fillText(
        'SCAN UPON ENTERING & EXITING THE GYM',
        exportCanvas.width / 2,
        qrSize + padding + 85
      );

      // Trigger download
      const link = document.createElement("a");
      link.download = `${(gymSettings?.gymName || 'gym').toLowerCase()}_${qrType}_wall_qr.png`;
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
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-2 rounded-xl hover:bg-neutral-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-neutral-950 shadow-gold-sm">
          <QrCode size={24} />
        </div>

        <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight font-athletic">Wall QR Poster</h2>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
          High-resolution QR code designed for front-desk printing and quick athlete attendance.
        </p>
        
        {/* QR Type Selector */}
        <div className="flex gap-2 my-5 bg-[#faf9f6] p-1.5 rounded-2xl border border-[#e7e2d5]">
          <button
            onClick={() => setQrType('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all font-athletic ${
              qrType === 'url'
                ? 'bg-neutral-900 text-gold-400 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <QrCode size={15} />
            <span>Check-in URL</span>
          </button>
          <button
            onClick={() => setQrType('geo')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all font-athletic ${
              qrType === 'geo'
                ? 'bg-neutral-900 text-gold-400 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <MapPin size={15} />
            <span>Geo URI</span>
          </button>
        </div>

        {/* QR Canvas Container */}
        <div className="bg-white p-5 rounded-3xl border-2 border-dashed border-gold-300 mx-auto w-fit shadow-xs mb-5">
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

        <button
          onClick={downloadQR}
          className="w-full min-h-[44px] py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all flex items-center justify-center gap-2 font-athletic active:scale-95"
        >
          <Download size={16} />
          <span>Download Printable PNG</span>
        </button>
      </div>
    </div>
  );
};

export default WallQRModal;
