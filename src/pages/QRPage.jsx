import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, QrCode, MapPin } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const QRPage = () => {
  const { settings: gymSettings } = useSettings();
  const gymName = gymSettings?.gymName || 'GYMCORE';
  const latitude = gymSettings?.latitude || 0;
  const longitude = gymSettings?.longitude || 0;
  
  // Generate geo URI format: geo:LATITUDE,LONGITUDE
  const geoURI = `geo:${latitude},${longitude}`;
  const qrUrl = `https://newbossgym.in.net/checkin`;
  
  const [qrType, setQrType] = useState('geo'); // 'geo' or 'url'
  const [qrValue, setQrValue] = useState(`geo:${latitude},${longitude}`);

  // Update QR value when settings or type changes
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

    // Wait for the next frame to ensure QR is fully rendered
    requestAnimationFrame(() => {
      // Create a larger canvas for the download with white background and quiet zone
      const qrSize = canvas.width;
      const quietZone = 40; // Adequate white border for scannability
      const textAreaHeight = 150;
      
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = qrSize + (quietZone * 2);
      downloadCanvas.height = qrSize + (quietZone * 2) + textAreaHeight;
      
      const ctx = downloadCanvas.getContext('2d');

      // White background (better for printing and scanning)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

      // Draw QR code with quiet zone
      ctx.drawImage(canvas, quietZone, quietZone);

      // Add gym name text below QR
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.font = 'bold 48px Inter, Arial, sans-serif';
      ctx.fillText(`${gymName} - ${qrType === 'geo' ? 'LOCATION' : 'CHECK-IN'}`, downloadCanvas.width / 2, qrSize + quietZone + 40);
      
      ctx.font = '32px Inter, Arial, sans-serif';
      ctx.fillStyle = '#555555';
      ctx.fillText(
        qrType === 'geo' ? geoURI : 'Scan to Mark Attendance', 
        downloadCanvas.width / 2, 
        qrSize + quietZone + 85
      );

      // Convert to PNG and trigger download
      const link = document.createElement('a');
      link.download = `${gymName.toLowerCase()}_${qrType}_qr.png`;
      link.href = downloadCanvas.toDataURL('image/png');
      link.click();
    });
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

      {/* QR Type Selector */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex gap-3">
          <button
            onClick={() => setQrType('geo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
              qrType === 'geo'
                ? 'bg-primary text-black'
                : 'bg-secondary text-muted hover:bg-secondary/80'
            }`}
          >
            <MapPin className="w-5 h-5" />
            Location (Geo URI)
          </button>
          <button
            onClick={() => setQrType('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
              qrType === 'url'
                ? 'bg-primary text-black'
                : 'bg-secondary text-muted hover:bg-secondary/80'
            }`}
          >
            <QrCode className="w-5 h-5" />
            Check-in URL
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6">
        <div className="bg-white p-6 rounded-2xl">
          <QRCodeCanvas
            id="qr-canvas"
            value={qrValue}
            size={300}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>

        <div className="text-center space-y-2">
          <p className="text-white font-bold text-xl">{gymName}</p>
          <p className="text-muted text-sm">
            {qrType === 'geo' ? 'Location QR Code' : 'Scan to mark attendance'}
          </p>
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
          {qrType === 'geo' ? 'Geo URI: ' : 'URL: '}
          <code className="text-primary break-all">{qrValue}</code>
        </p>
      </div>
    </div>
  );
};

export default QRPage;
