import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';

const WallQRModal = ({ onClose }) => {
  const checkinURL = "https://boss-gym.onrender.com/checkin";


  const downloadQR = () => {
    const canvas = document.getElementById("wall-qr-canvas");
    if (!canvas) return;

    // Create a new canvas with white background and padding
    const padding = 40;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width + padding * 2;
    exportCanvas.height = canvas.width + padding * 2 + 80;
    const ctx = exportCanvas.getContext("2d");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw QR code centered
    ctx.drawImage(canvas, padding, padding);

    // Add gym name text below QR
    ctx.fillStyle = "#000000";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      import.meta.env.VITE_GYM_NAME || "GYM",
      exportCanvas.width / 2,
      canvas.height + padding + 35
    );

    // Add instruction text
    ctx.fillStyle = "#555555";
    ctx.font = "13px Inter, sans-serif";
    ctx.fillText(
      "Scan to mark attendance",
      exportCanvas.width / 2,
      canvas.height + padding + 58
    );

    // Trigger download
    const link = document.createElement("a");
    link.download = "gymcore-wall-qr.png";
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
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
        
        <div className="bg-white rounded-[12px] p-5 inline-block mx-auto mb-3 shadow-inner">
          <QRCodeCanvas
            id="wall-qr-canvas"
            value={checkinURL}
            size={220}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="text-[#a3a3a3] text-[12px] mt-3 break-all px-4 font-mono">
          {checkinURL}
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
