import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, QrCode, MapPin, Dumbbell, Sparkles, ShieldCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const QRPage = () => {
  const { settings: gymSettings } = useSettings();
  const gymName = gymSettings?.gymName || 'NEW BOSS GYM';
  const latitude = gymSettings?.latitude || 0;
  const longitude = gymSettings?.longitude || 0;
  
  const geoURI = `geo:${latitude},${longitude}`;
  const qrUrl = `https://newbossgym.in.net/checkin`;
  
  const [qrType, setQrType] = useState('geo');
  const [qrValue, setQrValue] = useState(`geo:${latitude},${longitude}`);

  useEffect(() => {
    if (qrType === 'geo') {
      setQrValue(`geo:${latitude},${longitude}`);
    } else {
      setQrValue(`https://newbossgym.in.net/checkin`);
    }
  }, [qrType, latitude, longitude]);

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;

    requestAnimationFrame(() => {
      const qrSize = canvas.width;
      const quietZone = 40;
      const textAreaHeight = 130;
      
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = qrSize + (quietZone * 2);
      downloadCanvas.height = qrSize + (quietZone * 2) + textAreaHeight;
      
      const ctx = downloadCanvas.getContext('2d');

      // Crisp background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

      // Gold border frame
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, downloadCanvas.width - 12, downloadCanvas.height - 12);

      // Draw QR code with quiet zone
      ctx.drawImage(canvas, quietZone, quietZone);

      // Gym name text below QR
      ctx.fillStyle = '#111111';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.font = 'bold 28px Montserrat, Arial, sans-serif';
      ctx.fillText(gymName.toUpperCase(), downloadCanvas.width / 2, qrSize + quietZone + 35);
      
      ctx.font = 'bold 16px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#9f7d16';
      ctx.fillText(
        qrType === 'geo' ? 'GPS FACILITY VERIFICATION CODE' : 'ATHLETE CHECK-IN KIOSK', 
        downloadCanvas.width / 2, 
        qrSize + quietZone + 70
      );

      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(
        'SCAN UPON ENTERING & EXITING THE GYM', 
        downloadCanvas.width / 2, 
        qrSize + quietZone + 95
      );

      const link = document.createElement('a');
      link.download = `${gymName.toLowerCase().replace(/\s+/g, '_')}_${qrType}_qr.png`;
      link.href = downloadCanvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 md:space-y-8 animate-fade-in font-sans">
      <div className="text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-700 font-athletic block mb-1">
          Front Desk & Turnstile Setup
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-neutral-900 uppercase tracking-tight flex items-center justify-center gap-2.5 font-athletic">
          <QrCode className="text-gold-600 w-8 h-8" />
          <span>Wall QR Poster</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
          Print this high-resolution QR sign for your entrance wall or reception desk so athletes can scan to check in.
        </p>
      </div>

      {/* QR Type Selector */}
      <div className="bg-white border border-[#e7e2d5] rounded-2xl p-2 shadow-xs flex gap-2">
        <button
          onClick={() => setQrType('geo')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all font-athletic ${
            qrType === 'geo'
              ? 'bg-neutral-900 text-gold-400 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-[#faf9f6]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Location (Geo URI)
        </button>
        <button
          onClick={() => setQrType('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all font-athletic ${
            qrType === 'url'
              ? 'bg-neutral-900 text-gold-400 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-[#faf9f6]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Check-in URL
        </button>
      </div>

      {/* QR Card */}
      <div className="bg-white border border-[#e7e2d5] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center gap-5 text-center">
        <div className="bg-white p-5 rounded-3xl border-2 border-dashed border-gold-300 shadow-sm">
          <QRCodeCanvas
            id="qr-canvas"
            value={qrValue}
            size={260}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#111111"
          />
        </div>

        <div>
          <p className="text-neutral-900 font-black text-xl uppercase tracking-wider font-athletic">{gymName}</p>
          <p className="text-neutral-500 text-xs mt-1 font-medium">
            {qrType === 'geo' ? 'GPS Perimeter Verification Code' : 'Self Check-in Portal URL'}
          </p>
        </div>

        <button
          onClick={downloadQR}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-neutral-950 font-black px-8 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-gold-sm transition-all font-athletic active:scale-95"
        >
          <Download className="w-4 h-4" /> <span>Download High-Res Poster PNG</span>
        </button>

        <div className="w-full bg-[#faf9f6] rounded-2xl p-3.5 border border-[#e7e2d5] text-center">
          <p className="text-neutral-500 text-[11px] font-mono break-all">
            {qrValue}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRPage;
