import React from 'react';
import type { DecisionType } from '../types/operator';
import { CheckCircle2, AlertOctagon, HelpCircle, Check, X } from 'lucide-react';

interface DecisionDisplayProps {
  decision: DecisionType;
  weightValue: string | null;
  confidence: number;
  latencyMs: number;
  onManualApprove: () => void;
  onManualCancel: () => void;
  rejectionReason?: string;
}

export const DecisionDisplay: React.FC<DecisionDisplayProps> = ({
  decision,
  weightValue,
  confidence,
  latencyMs,
  onManualApprove,
  onManualCancel,
  rejectionReason,
}) => {
  const getBannerConfig = () => {
    switch (decision) {
      case 'TERIMA':
        return {
          bg: 'bg-emerald-600',
          text: 'text-white',
          border: 'border-emerald-500',
          title: 'TERIMA (AUTO-VERIFIED)',
          icon: <CheckCircle2 className="w-6 h-6 text-white" />,
          subtitle: 'Pembacaan valid & tersimpan di audit log.',
        };
      case 'TOLAK':
        return {
          bg: 'bg-red-600',
          text: 'text-white',
          border: 'border-red-500',
          title: 'TOLAK (REJECTED)',
          icon: <AlertOctagon className="w-6 h-6 text-white" />,
          subtitle: rejectionReason || 'Anomali terdeteksi pada lapis verifikasi.',
        };
      case 'KONFIRMASI':
        return {
          bg: 'bg-amber-500',
          text: 'text-industrial-950',
          border: 'border-amber-400',
          title: 'KONFIRMASI OPERATOR',
          icon: <HelpCircle className="w-6 h-6 text-industrial-950" />,
          subtitle: 'Keyakinan di bawah ambang batas (L4). Perlu verifikasi manual.',
        };
      default:
        return {
          bg: 'bg-industrial-800',
          text: 'text-industrial-200',
          border: 'border-industrial-700',
          title: 'STANDBY (SIAP AKUISISI)',
          icon: null,
          subtitle: 'Arahkan kamera ke display timbangan lalu tekan Space.',
        };
    }
  };

  const banner = getBannerConfig();

  return (
    <div className="rounded bg-industrial-900 border border-industrial-800 p-4 flex flex-col justify-between h-full">
      {/* Top Banner Status */}
      <div className={`p-3 rounded border ${banner.bg} ${banner.border} ${banner.text} transition-colors flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {banner.icon}
          <div>
            <div className="font-mono font-extrabold text-sm sm:text-base tracking-wider uppercase">
              {banner.title}
            </div>
            <div className="text-xs font-mono opacity-90">
              {banner.subtitle}
            </div>
          </div>
        </div>

        {decision !== 'BATAL' && (
          <div className="text-right font-mono text-xs opacity-90 hidden sm:block">
            <div>Conf: {(confidence * 100).toFixed(1)}%</div>
            <div>{latencyMs.toFixed(1)} ms</div>
          </div>
        )}
      </div>

      {/* Large Weight Readout Display */}
      <div className="my-4 py-8 px-4 rounded bg-display-bg border border-industrial-800 text-center flex flex-col items-center justify-center">
        <span className="text-xs font-mono text-industrial-400 uppercase tracking-widest mb-1">
          Bobot Bersih Terverifikasi
        </span>
        <div className="flex items-baseline justify-center gap-3">
          <span
            className={`font-display text-6xl sm:text-7xl font-bold tracking-tight select-none ${
              decision === 'TERIMA'
                ? 'text-emerald-400 led-glow'
                : decision === 'TOLAK'
                ? 'text-red-500 led-red-glow line-through'
                : decision === 'KONFIRMASI'
                ? 'text-amber-400 led-amber-glow'
                : 'text-industrial-600'
            }`}
          >
            {weightValue || '----.--'}
          </span>
          <span className="font-mono text-2xl font-bold text-industrial-400">kg</span>
        </div>
      </div>

      {/* Manual Approval Action Bar (When in KONFIRMASI state) */}
      {decision === 'KONFIRMASI' ? (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onManualApprove}
            className="py-2.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 border border-emerald-400 transition-colors"
          >
            <Check className="w-4 h-4" />
            TERIMA MANUAL [M]
          </button>
          <button
            onClick={onManualCancel}
            className="py-2.5 px-3 rounded bg-industrial-800 hover:bg-industrial-700 text-industrial-300 font-mono font-bold text-xs flex items-center justify-center gap-2 border border-industrial-700 transition-colors"
          >
            <X className="w-4 h-4" />
            BATALKAN [ESC]
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs font-mono text-industrial-400 pt-2 border-t border-industrial-800">
          <span>Pintasan: <kbd className="px-1.5 py-0.5 rounded bg-industrial-800 border border-industrial-700 text-industrial-200">Space</kbd> Timbang</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-industrial-800 border border-industrial-700 text-industrial-200">M</kbd> Verifikasi Manual</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-industrial-800 border border-industrial-700 text-industrial-200">Esc</kbd> Reset</span>
        </div>
      )}
    </div>
  );
};
