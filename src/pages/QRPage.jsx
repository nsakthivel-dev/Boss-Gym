import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const QRPage = () => {
  const { settings: gymSettings } = useSettings();
  const gymName = gymSettings?.gymName || 'GYMCORE';
  const qrUrl = 'https://boss-gym.onrender.com/checkin';

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;

    // Create a larger canvas for the download with a label
    const downloadCanvas = document.createElement('canvas');
    const ctx = downloadCanvas.getContext('2d');
    const size = 1000;
    const padding = 100;
    
    downloadCanvas.width = size;
    downloadCanvas.height = size + 150;

    // Background
    ctx.fillStyle = '#171717';
    ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // QR Code
    ctx.drawImage(canvas, padding, padding, size - padding * 2, size - padding * 2);

    // Text details
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    ctx.font = 'bold 60px Inter, sans-serif';
    ctx.fillText(`${gymName} - SELF CHECK-IN`, size / 2, size + 20);
    
    ctx.font = '40px Inter, sans-serif';
    ctx.fillStyle = '#a3a3a3';
    ctx.fillText('Scan to Mark Attendance', size / 2, size + 80);

    const link = document.createElement('a');
    link.download = `${gymName.toLowerCase()}_wall_qr.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <QrCode className="text-primary" /> Wall QR Code
        </h1>
        <p className="text-muted text-sm mt-2">
          Display this QR code at the gym entrance for members to scan.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6">
        <div className="bg-white p-6 rounded-2xl">
          <QRCodeCanvas
            id="qr-canvas"
            value={qrUrl}
            size={300}
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="text-center space-y-2">
          <p className="text-white font-bold text-xl">{gymName}</p>
          <p className="text-muted text-sm">Scan to mark attendance</p>
        </div>

        <button
          onClick={downloadQR}
          className="flex items-center gap-2 bg-primary text-black font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-95 mt-2"
        >
          <Download className="w-5 h-5" /> Download Printable PNG
        </button>
      </div>

      <div className="bg-secondary/30 rounded-xl p-4 border border-border/50 text-center">
        <p className="text-muted text-xs">
          URL: <code className="text-primary">{qrUrl}</code>
        </p>
      </div>
    </div>
  );
};

export default QRPage;
