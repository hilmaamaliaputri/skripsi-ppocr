import React from 'react';
import { Sliders, CheckCircle2, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export type PPOCRv6Variant = 'tiny' | 'small' | 'medium';

export interface ModelParameters {
  model_variant: PPOCRv6Variant;
  unlit_filter_mode: 'aktif' | 'nonaktif';
  verification_mode: 'aktif' | 'nonaktif';
}

interface ParameterToolbarProps {
  parameters: ModelParameters;
  onChangeParameters: (params: ModelParameters) => void;
  onApplyOptimalPreset: () => void;
  onApplyBaselinePreset: () => void;
  isOptimal: boolean;
}

export const ParameterToolbar: React.FC<ParameterToolbarProps> = ({
  parameters,
  onChangeParameters,
  onApplyOptimalPreset,
  onApplyBaselinePreset,
  isOptimal,
}) => {
  return (
    <div className="p-4 rounded-lg bg-industrial-900 border border-industrial-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 theme-card">
      {/* Title & Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-industrial-100 theme-text-primary">
              Parameter Model PP-OCRv6 (Tiny, Small, Medium)
            </span>
            {isOptimal ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> MODEL SKRIPSI: SMALL (OPTIMAL)
              </span>
            ) : parameters.verification_mode === 'nonaktif' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> TANPA VERIFIKASI (RAW OCR)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFIKASI AKTIF
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-industrial-400 mt-0.5">
            Pilih varian kapasitas model dan amati dampaknya terhadap latensi CPU, deteksi segmen padam, dan akurasi.
          </p>
        </div>
      </div>

      {/* Dropdown Controls & Presets */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. PP-OCRv6 Variant (Tiny, Small, Medium) */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-industrial-400 uppercase font-semibold flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> 1. Varian Model PP-OCRv6:
          </label>
          <select
            value={parameters.model_variant}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                model_variant: e.target.value as PPOCRv6Variant,
              })
            }
            className="bg-industrial-950 border border-industrial-800 rounded px-2.5 py-1.5 text-xs font-mono text-industrial-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="small">PP-OCRv6-small (7.8 MB • Standar Skripsi)</option>
            <option value="tiny">PP-OCRv6-tiny (2.1 MB • Ultra Cepat Edge)</option>
            <option value="medium">PP-OCRv6-medium (18.4 MB • Server Grade)</option>
          </select>
        </div>

        {/* 2. Unlit Segment Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-industrial-400 uppercase font-semibold">
            2. Filter Segmen Padam:
          </label>
          <select
            value={parameters.unlit_filter_mode}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                unlit_filter_mode: e.target.value as 'aktif' | 'nonaktif',
              })
            }
            className="bg-industrial-950 border border-industrial-800 rounded px-2.5 py-1.5 text-xs font-mono text-industrial-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="aktif">Aktif (Adaptive Otsu + Profiler)</option>
            <option value="nonaktif">Nonaktif (Mentah - Rawan Angka 8)</option>
          </select>
        </div>

        {/* 3. 4-Layer Verification Pipeline */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-industrial-400 uppercase font-semibold">
            3. Verifikasi 4-Lapis:
          </label>
          <select
            value={parameters.verification_mode}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                verification_mode: e.target.value as 'aktif' | 'nonaktif',
              })
            }
            className="bg-industrial-950 border border-industrial-800 rounded px-2.5 py-1.5 text-xs font-mono text-industrial-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="aktif">Aktif (Fail-Fast L1-L4)</option>
            <option value="nonaktif">Nonaktif (Output Model Langsung)</option>
          </select>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 pt-4 sm:pt-0">
          <button
            onClick={onApplyOptimalPreset}
            className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
              isOptimal
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-industrial-800 hover:bg-industrial-700 text-industrial-200 border border-industrial-700'
            }`}
            title="Terapkan konfigurasi utama skripsi: PP-OCRv6-small dengan filter segmen dan verifikasi 4-lapis"
          >
            Preset Skripsi (Small)
          </button>
          <button
            onClick={onApplyBaselinePreset}
            className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
              parameters.verification_mode === 'nonaktif'
                ? 'bg-red-900/60 text-red-200 border border-red-700 font-bold'
                : 'bg-industrial-800 hover:bg-industrial-700 text-industrial-300 border border-industrial-700'
            }`}
            title="Uji baseline mentah tanpa verifikasi untuk melihat kemunculan false positive angka 8"
          >
            Baseline Mentah
          </button>
        </div>
      </div>
    </div>
  );
};
