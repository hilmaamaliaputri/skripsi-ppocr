import React, { useState, useEffect } from 'react';
import type { FrameItem } from '../types/operator';
import { Camera, Focus, RefreshCw } from 'lucide-react';

interface CameraViewfinderProps {
  isCapturing: boolean;
  onTriggerBurst: () => void;
  slotCount: number;
  decimalPlaces: number;
  frames?: FrameItem[];
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  isCapturing,
  onTriggerBurst,
  slotCount,
  frames,
}) => {
  const [burstFrame, setBurstFrame] = useState<number>(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isCapturing) {
      setBurstFrame(1);
      let count = 1;
      interval = setInterval(() => {
        count += 1;
        setBurstFrame(count);
        if (count >= 5) clearInterval(interval);
      }, 70);
    } else {
      setBurstFrame(0);
    }
    return () => clearInterval(interval);
  }, [isCapturing]);

  return (
    <div className="rounded bg-industrial-900 border border-industrial-800 p-4 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-2 border-b border-industrial-800">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
            Viewfinder Kamera Industri (Live Stream)
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-industrial-400">
          <span>640x480 @ 30 FPS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>
      </div>

      {/* Viewfinder Display Area */}
      <div className="relative my-3 aspect-video bg-display-bg rounded border border-industrial-800 flex items-center justify-center overflow-hidden">
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Viewfinder Target Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Focus className="w-12 h-12 text-industrial-700 opacity-40" />
        </div>

        {/* ROI Alignment Bounding Box */}
        <div className="relative w-4/5 h-2/5 border-2 border-dashed border-cyan-400/80 rounded flex items-center justify-center p-2 bg-black/40">
          {/* Corner Brackets */}
          <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
          <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
          <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

          {/* Vertical Slot Divider Markers */}
          <div className="absolute inset-x-4 inset-y-1 flex justify-between pointer-events-none opacity-40">
            {Array.from({ length: slotCount + 1 }).map((_, idx) => (
              <div key={idx} className="w-[1px] h-full bg-cyan-300 border-dashed" />
            ))}
          </div>

          {/* Sample Scale Simulation Display in Viewfinder */}
          <div className="font-display text-4xl sm:text-5xl font-bold tracking-widest text-emerald-400 select-none led-glow z-10">
            25.04
          </div>

          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-400/80">
            ROI ALIGNED &bull; {slotCount} DIGITS
          </div>
        </div>

        {/* Shutter Burst Flash Animation */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-none transition-opacity pointer-events-none animate-ping" />
        )}

        {/* Burst Status Overlay */}
        {isCapturing && (
          <div className="absolute top-3 left-3 bg-red-950/90 border border-red-700 px-3 py-1 rounded text-xs font-mono text-red-200 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            BURST FRAME {burstFrame}/5 (150ms)
          </div>
        )}
      </div>

      {/* Visual Burst Frame Results Strip (Setiap Frame Diperlihatkan) */}
      {frames && frames.length > 0 && (
        <div className="mb-3 p-2 rounded bg-industrial-950 border border-industrial-800">
          <div className="flex items-center justify-between pb-1.5 border-b border-industrial-800/80 mb-2">
            <span className="text-[10px] font-mono font-bold text-industrial-400 uppercase tracking-wider">
              Keputusan Tiap Frame ({frames.length} Frame Burst):
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Konsensus Temporal</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {frames.map((f) => (
              <div
                key={f.frame_idx}
                className="rounded bg-industrial-900 p-1.5 border border-industrial-800 text-center flex flex-col justify-between"
              >
                <div className="w-full aspect-[4/3] bg-black rounded overflow-hidden flex items-center justify-center border border-industrial-800 mb-1">
                  {f.image_url ? (
                    <img
                      src={f.image_url}
                      alt={`Frame ${f.frame_idx}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[9px] font-mono text-industrial-500">F#{f.frame_idx}</span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-industrial-400 font-bold">Frame #{f.frame_idx}</span>
                <span className="text-[11px] font-mono font-bold text-white truncate">{f.raw_text}</span>
                <span className="text-[9px] font-mono text-industrial-400">{(f.confidence * 100).toFixed(0)}%</span>
                <span
                  className={`text-[8px] font-mono font-bold mt-1 px-1 py-0.5 rounded ${
                    f.decision === 'TERIMA'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : f.decision === 'KONFIRMASI'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {f.decision}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operator Trigger Button */}
      <button
        onClick={onTriggerBurst}
        disabled={isCapturing}
        className="w-full py-3 px-4 rounded bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 text-white font-mono font-bold text-sm tracking-wide transition-all border border-emerald-400/40 flex items-center justify-center gap-2 shadow-lg"
      >
        <RefreshCw className={`w-4 h-4 ${isCapturing ? 'animate-spin' : ''}`} />
        <span>{isCapturing ? 'MEMPROSES BURST 5-FRAME...' : 'AMBIL TIMBANGAN [SPACE]'}</span>
      </button>
    </div>
  );
};
