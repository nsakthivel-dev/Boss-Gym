import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, MapPin, QrCode } from 'lucide-react';
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

    // Wait for the next frame to ensure QR is fully rendered
    requestAnimationFrame(() => {
      // Create a new canvas with white background and padding
      const qrSize = canvas.width;
      const padding = 40;
      const textAreaHeight = 70;
      
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = qrSize + padding * 2;
      exportCanvas.height = qrSize + padding * 2 + textAreaHeight;
      const ctx = exportCanvas.getContext("2d");

      // White background (better for printing and scanning)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Draw QR code centered with quiet zone
      ctx.drawImage(canvas, padding, padding);

      // Add gym name text below QR
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        gymSettings?.gymName || "GYM",
        exportCanvas.width / 2,
        qrSize + padding + 20
      );

      // Add instruction text
      ctx.fillStyle = "#555555";
      ctx.font = "10px Inter, Arial, sans-serif";
      ctx.fillText(
        qrType === 'geo' ? 'Location QR' : 'Scan to mark attendance',
        exportCanvas.width / 2,
        qrSize + padding + 42
      );

      // Trigger download
      const link = document.createElement("a");
      link.download = `${(gymSettings?.gymName || 'gym').toLowerCase()}_${qrType}_qr.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[12px] p-8 max-w-[420px] w-[90%] text-center shadow-2xl scale-in-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white text-[20px] font-bold">Gym Wall QR Code</h2>
        <p className="text-[#a3a3a3] text-[13px] mt-1">Print this and stick it on your gym wall</p>
        
        <div className="border-t border-[#2a2a2a] my-5"></div>
        
        {/* QR Type Selector */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setQrType('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12px] font-bold transition-all ${
              qrType === 'url'
                ? 'bg-[#e8c97e] text-[#0f0f0f]'
                : 'bg-[#2a2a2a] text-[#a3a3a3] hover:bg-[#333333]'
            }`}
          >
            <QrCode size={14} />
            Check-in URL
          </button>
          <button
            onClick={() => setQrType('geo')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12px] font-bold transition-all ${
              qrType === 'geo'
                ? 'bg-[#e8c97e] text-[#0f0f0f]'
                : 'bg-[#2a2a2a] text-[#a3a3a3] hover:bg-[#333333]'
            }`}
          >
            <MapPin size={14} />
            Location
          </button>
        </div>
        
        <div className="bg-white rounded-[12px] p-5 inline-block mx-auto mb-3 shadow-inner">
          <QRCodeCanvas
            id="wall-qr-canvas"
            value={qrValue}
            size={220}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={true}
          />
        </div>

        <p className="text-[#a3a3a3] text-[12px] mt-3 break-all px-4 font-mono">
          {qrValue}
        </p>
        
        <p className="text-[#a3a3a3] text-[12px] mt-2">
          Members scan this with their phone camera to mark attendance
        </p>

        <div className="flex gap-3 mt-8">
          <button 
            onClick={downloadQR}
            className="flex-1 bg-[#e8c97e] text-[#0f0f0f] font-bold py-2.5 px-5 rounded-[8px] text-[14px] flex items-center justify-center gap-2 hover:bg-[#d9bc70] transition-colors"
          >
            <Download size={18} />
            Download PNG
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-transparent border border-[#2a2a2a] text-white py-2.5 px-5 rounded-[8px] text-[14px] hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WallQRModal;
