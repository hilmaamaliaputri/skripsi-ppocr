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
    <div className="p-3.5 sm:p-4 rounded-xl bg-industrial-900 border border-industrial-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 theme-card shadow-xs">
      {/* Title & Status */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#F47721]/15 border border-[#F47721]/30 flex items-center justify-center text-[#F47721] shrink-0">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-industrial-100 theme-text-primary">
              Parameter Evaluasi
            </span>
            {isOptimal ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#16A36A]/10 text-[#16A36A] dark:text-[#38C98A] border border-[#16A36A]/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Rekomendasi Skripsi
              </span>
            ) : parameters.verification_mode === 'nonaktif' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Baseline Mentah
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#F47721]/15 text-[#F47721] border border-[#F47721]/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verifikasi Aktif
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Controls & Presets */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* 1. PP-OCRv6 Variant (Tiny, Small, Medium, CRNN) */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-sans text-industrial-400 font-semibold whitespace-nowrap flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#F47721]" /> Model:
          </label>
          <select
            value={parameters.model_variant}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                model_variant: e.target.value as PPOCRv6Variant,
              })
            }
            className="bg-industrial-950 border border-industrial-800 rounded-lg px-2.5 py-1 text-xs font-sans text-industrial-100 focus:outline-none focus:border-[#F47721] cursor-pointer transition-all"
          >
            <option value="small">PP-OCRv6-small (7.8 MB • Skripsi)</option>
            <option value="crnn">CRNN-CTC (0.12 MB ONNX • Baseline)</option>
            <option value="tiny">PP-OCRv6-tiny (2.1 MB • Edge)</option>
            <option value="medium">PP-OCRv6-medium (18.4 MB • Server)</option>
          </select>
        </div>

        {/* 2. Unlit Segment Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-sans text-industrial-400 font-semibold whitespace-nowrap">
            Filter Segmen:
          </label>
          <select
            value={parameters.unlit_filter_mode}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                unlit_filter_mode: e.target.value as 'aktif' | 'nonaktif',
              })
            }
            className="bg-industrial-950 border border-industrial-800 rounded-lg px-2.5 py-1 text-xs font-sans text-industrial-100 focus:outline-none focus:border-[#F47721] cursor-pointer transition-all"
          >
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>

        {/* 3. 4-Layer Verification Pipeline */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-sans text-industrial-400 font-semibold whitespace-nowrap">
            Verifikasi:
          </label>
          <select
            value={parameters.verification_mode}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                verification_mode: e.target.value as 'aktif' | 'nonaktif',
              })
            }
            className="bg-industrial-950 border border-industrial-800 rounded-lg px-2.5 py-1 text-xs font-sans text-industrial-100 focus:outline-none focus:border-[#F47721] cursor-pointer transition-all"
          >
            <option value="aktif">Aktif (4-Lapis)</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 pl-1">
          <button
            onClick={onApplyOptimalPreset}
            className={`px-2.5 py-1 rounded-lg text-xs font-sans transition-all ${
              isOptimal
                ? 'bg-[#F47721] hover:bg-[#FF974D] text-white font-semibold shadow-xs'
                : 'bg-industrial-800 hover:bg-industrial-700 text-industrial-200 border border-industrial-700'
            }`}
            title="Terapkan konfigurasi usulan skripsi: PP-OCRv6-small + Verifikasi 4-lapis"
          >
            Preset Skripsi
          </button>
          <button
            onClick={onApplyBaselinePreset}
            className={`px-2.5 py-1 rounded-lg text-xs font-sans transition-all ${
              parameters.verification_mode === 'nonaktif'
                ? 'bg-rose-900/60 text-rose-200 border border-rose-700 font-semibold'
                : 'bg-industrial-800 hover:bg-industrial-700 text-industrial-300 border border-industrial-700'
            }`}
            title="Terapkan baseline mentah tanpa verifikasi"
          >
            Baseline
          </button>
        </div>
      </div>
    </div>
  );
};
