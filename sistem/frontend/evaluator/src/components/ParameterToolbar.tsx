import React from 'react';
import { Sliders, CheckCircle2, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';
import type { OCRModelVariant } from '../types/evaluator';

export type PPOCRv6Variant = OCRModelVariant;

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
  const isRawMode = parameters.verification_mode === 'nonaktif';

  return (
    <div className="p-3.5 sm:p-4 rounded-lg bg-industrial-900 border border-industrial-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 theme-card">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-[#F47721]/15 border border-[#F47721]/40 flex items-center justify-center text-[#F47721] shrink-0">
          <Sliders className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-industrial-100 theme-text-primary">
            Mode Eksekusi Evaluasi
          </span>
          {isRawMode ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-rose-950 text-rose-200 border border-rose-700 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Sebelum Verifikasi (Mentah)
            </span>
          ) : isOptimal ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-[#16A36A]/15 text-[#16A36A] dark:text-[#38C98A] border border-[#16A36A]/40 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Sesudah Verifikasi (4-Lapis)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-[#F47721]/15 text-[#F47721] border border-[#F47721]/40 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Verifikasi 4-Lapis Aktif
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label htmlFor="toolbar-model-select" className="text-[11px] font-sans text-industrial-300 font-semibold whitespace-nowrap flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#F47721]" aria-hidden="true" /> Model:
          </label>
          <select
            id="toolbar-model-select"
            value={parameters.model_variant}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                model_variant: e.target.value as PPOCRv6Variant,
              })
            }
            className="bg-industrial-950 border border-industrial-700 rounded-md px-2.5 py-1.5 text-xs font-sans text-industrial-100 focus:outline-none focus:ring-2 focus:ring-[#F47721] cursor-pointer"
          >
            <option value="crnn">CRNN-CTC (Dilatih Ulang 50ep)</option>
            <option value="tiny">PP-OCRv6 Tiny (1.50M • Edge)</option>
            <option value="small">PP-OCRv6 Small (7.70M • Edge)</option>
            <option value="medium">PP-OCRv6 Medium (34.5M • Server)</option>
            <option value="ppocrv5">PP-OCRv5 Mobile (4.11M)</option>
            <option value="dbnet_parseq">DBNet + PARSeq (26.3M • 2-Stage)</option>
          </select>
        </div>

        <div className="inline-flex rounded-md border border-industrial-700 bg-industrial-950 p-0.5" role="group" aria-label="Pilih mode sebelum atau sesudah verifikasi">
          <button
            type="button"
            onClick={() =>
              onChangeParameters({
                ...parameters,
                verification_mode: 'nonaktif',
                unlit_filter_mode: 'nonaktif',
              })
            }
            className={`px-2.5 py-1 rounded text-xs font-sans transition-colors focus:outline-none focus:ring-2 focus:ring-[#F47721] ${
              isRawMode
                ? 'bg-rose-700 text-white font-semibold'
                : 'text-industrial-300 hover:text-white'
            }`}
          >
            Sebelum Verifikasi
          </button>
          <button
            type="button"
            onClick={() =>
              onChangeParameters({
                ...parameters,
                verification_mode: 'aktif',
                unlit_filter_mode: 'aktif',
              })
            }
            className={`px-2.5 py-1 rounded text-xs font-sans transition-colors focus:outline-none focus:ring-2 focus:ring-[#16A36A] ${
              !isRawMode
                ? 'bg-[#16A36A] text-white font-semibold'
                : 'text-industrial-300 hover:text-white'
            }`}
          >
            Sesudah Verifikasi (4-Lapis)
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onApplyOptimalPreset}
            className="px-2.5 py-1.5 rounded-md text-xs font-sans bg-industrial-800 hover:bg-industrial-700 text-industrial-100 border border-industrial-700 focus:outline-none focus:ring-2 focus:ring-[#F47721]"
          >
            Champion CRNN
          </button>
          <button
            type="button"
            onClick={onApplyBaselinePreset}
            className="px-2.5 py-1.5 rounded-md text-xs font-sans bg-industrial-800 hover:bg-industrial-700 text-industrial-200 border border-industrial-700 focus:outline-none focus:ring-2 focus:ring-[#F47721]"
          >
            PP-OCRv6 Small
          </button>
        </div>
      </div>
    </div>
  );
};
