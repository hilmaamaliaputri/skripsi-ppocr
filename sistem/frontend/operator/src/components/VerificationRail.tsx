import React from 'react';
import type { LayerResult } from '../types/operator';
import { Check, X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface VerificationRailProps {
  layers?: {
    temporal: LayerResult;
    structural: LayerResult;
    physical: LayerResult;
    calibration: LayerResult;
  };
}

export const VerificationRail: React.FC<VerificationRailProps> = ({ layers }) => {
  if (!layers) {
    return (
      <div className="p-3 rounded bg-industrial-900 border border-industrial-800 text-center text-xs font-mono text-industrial-500">
        Menunggu akuisisi frame untuk evaluasi lapis...
      </div>
    );
  }

  const layerList = [
    { key: 'temporal', title: 'Stabilitas Multi-Frame', data: layers.temporal },
    { key: 'structural', title: 'Struktur Display & Digit', data: layers.structural },
    { key: 'physical', title: 'Batas & Toleransi Produk', data: layers.physical },
    { key: 'calibration', title: 'Kalibrasi Probabilitas', data: layers.calibration },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {layerList.map((l) => {
        const isPassed = l.data.passed;
        const isWarning = !isPassed && l.key === 'calibration';

        return (
          <div
            key={l.key}
            className={`p-3 rounded border text-xs font-mono flex flex-col justify-between ${
              isPassed
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : isWarning
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                : 'bg-red-950/40 border-red-800/80 text-red-200'
            }`}
          >
            <div className="flex items-center justify-between pb-1">
              <span className="font-bold tracking-tight text-[11px] text-white uppercase">{l.title}</span>
              {isPassed ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5" /> LOLOS
                </span>
              ) : isWarning ? (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> PERLU KONFIRMASI
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                  <X className="w-3.5 h-3.5" /> GAGAL
                </span>
              )}
            </div>

            <div className="mt-1">
              {l.data.reason ? (
                <div className="text-[10px] opacity-90 flex items-start gap-1">
                  <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{l.data.reason}</span>
                </div>
              ) : (
                <div className="text-[10px] text-industrial-400">
                  Verifikasi valid & konsisten
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
