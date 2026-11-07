import React from 'react';
import { Sliders, CheckCircle2, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export type PPOCRv6Variant = 'tiny' | 'small' | 'medium' | 'crnn';

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
    <div className="p-4 sm:p-5 rounded-xl bg-industrial-900 border border-industrial-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 theme-card shadow-sm">
      {/* Title & Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 shadow-sm">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-industrial-100 theme-text-primary">
              Parameter Model & Komparasi Baseline (PP-OCRv6 & CRNN-CTC)
            </span>
            {isOptimal ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3 h-3" /> MODEL SKRIPSI: SMALL (OPTIMAL)
              </span>
            ) : parameters.verification_mode === 'nonaktif' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1 shadow-sm">
                <AlertTriangle className="w-3 h-3" /> RAW BASELINE (FALSE '8' MUNCUL)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-sky-950 text-sky-400 border border-sky-800 flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3" /> VERIFIKASI AKTIF
              </span>
            )}
          </div>
          <p className="text-[11px] font-sans text-industrial-400 mt-1">
            Simulasikan kapasitas bobot model terhadap latensi CPU dan efektivitas eliminasi angka 8 palsu.
          </p>
        </div>
      </div>

      {/* Dropdown Controls & Presets */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. PP-OCRv6 Variant (Tiny, Small, Medium) */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-sans text-industrial-400 uppercase font-semibold flex items-center gap-1">
            <Cpu className="w-3 h-3 text-sky-400" /> 1. Varian Model:
          </label>
          <select
            value={parameters.model_variant}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                model_variant: e.target.value as PPOCRv6Variant,
              })
            }
            className="bg-industrial-950 border border-industrial-800 rounded-lg px-3 py-1.5 text-xs font-sans text-industrial-100 focus:outline-none focus:border-sky-500 cursor-pointer shadow-sm transition-all"
          >
            <option value="small">PP-OCRv6-small (7.8 MB • Standar Skripsi Usulan)</option>
            <option value="crnn">CRNN-CTC (0.12 MB ONNX • Baseline Klasik 2016)</option>
            <option value="tiny">PP-OCRv6-tiny (2.1 MB • Ultra Cepat Edge)</option>
            <option value="medium">PP-OCRv6-medium (18.4 MB • Server Grade)</option>
          </select>
        </div>

        {/* 2. Unlit Segment Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-sans text-industrial-400 uppercase font-semibold">
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
            className="bg-industrial-950 border border-industrial-800 rounded-lg px-3 py-1.5 text-xs font-sans text-industrial-100 focus:outline-none focus:border-sky-500 cursor-pointer shadow-sm transition-all"
          >
            <option value="aktif">Aktif (Adaptive Otsu + Profiler)</option>
            <option value="nonaktif">Nonaktif (Mentah - Rawan Angka 8)</option>
          </select>
        </div>

        {/* 3. 4-Layer Verification Pipeline */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-sans text-industrial-400 uppercase font-semibold">
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
            className="bg-industrial-950 border border-industrial-800 rounded-lg px-3 py-1.5 text-xs font-sans text-industrial-100 focus:outline-none focus:border-sky-500 cursor-pointer shadow-sm transition-all"
          >
            <option value="aktif">Aktif (Fail-Fast L1-L4)</option>
            <option value="nonaktif">Nonaktif (Output Model Mentah)</option>
          </select>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 pt-3 sm:pt-0">
          <button
            onClick={onApplyOptimalPreset}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all shadow-sm ${
              isOptimal
                ? 'bg-emerald-600 text-white font-semibold shadow-emerald-500/20'
                : 'bg-industrial-800 hover:bg-industrial-700 text-industrial-200 border border-industrial-700'
            }`}
            title="Terapkan konfigurasi utama skripsi: PP-OCRv6-small dengan filter segmen dan verifikasi 4-lapis"
          >
            Preset Skripsi (Small)
          </button>
          <button
            onClick={onApplyBaselinePreset}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all shadow-sm ${
              parameters.verification_mode === 'nonaktif'
                ? 'bg-rose-900/60 text-rose-200 border border-rose-700 font-semibold'
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
