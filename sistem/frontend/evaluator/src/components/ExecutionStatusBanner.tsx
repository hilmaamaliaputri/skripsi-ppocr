import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';
import type { OCRModelVariant } from '../types/evaluator';

export const MODEL_OPTIONS: { value: OCRModelVariant; label: string }[] = [
  { value: 'tiny_ft', label: 'PP-OCRv6 Tiny (Fine-Tuned · 22 Ep · Champion)' },
  { value: 'crnn', label: 'CRNN-CTC (Domain-Trained · 50 Ep)' },
  { value: 'tiny', label: 'PP-OCRv6 Tiny (Zero-Shot · 1.5M)' },
  { value: 'small', label: 'PP-OCRv6 Small (Zero-Shot · 7.7M)' },
  { value: 'medium', label: 'PP-OCRv6 Medium (Zero-Shot · 34.5M)' },
  { value: 'ppocrv5', label: 'PP-OCRv5 Mobile (Zero-Shot · 4.1M)' },
  { value: 'dbnet_parseq', label: 'DBNet + PARSeq (2-Tahap · 26.3M)' },
];

interface ExecutionStatusBannerProps {
  isLightMode: boolean;
  isLoading: boolean;
  isVerificationActive: boolean;
  sampleCount: number;
  executionTimeS: number;
  modelVariant: OCRModelVariant;
  onChangeVerificationMode: (active: boolean) => void;
  onChangeModel: (model: OCRModelVariant) => void;
}

export const ExecutionStatusBanner: React.FC<ExecutionStatusBannerProps> = ({
  isLightMode,
  isLoading,
  isVerificationActive,
  sampleCount,
  executionTimeS,
  modelVariant,
  onChangeVerificationMode,
  onChangeModel,
}) => {
  return (
    <div
      className={`px-4 py-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs font-sans transition-colors ${
        isLightMode ? 'bg-white border-[#E2E8F0] text-[#202832]' : 'bg-[#171F28] border-[#2E3A47] text-[#F1F5F9]'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className={`w-2 h-2 rounded-full ${isVerificationActive ? 'bg-[#16A36A]' : 'bg-rose-500'}`} />
        <ShieldCheck
          className={`w-4 h-4 shrink-0 ${
            isVerificationActive ? 'text-[#16A36A] dark:text-[#38C98A]' : 'text-rose-400'
          }`}
          aria-hidden="true"
        />
        <span>
          Mode Eksekusi:{' '}
          <strong className="font-mono">
            {isVerificationActive
              ? 'Sesudah Verifikasi 4-Lapis (L3→L1→L2→L4)'
              : 'Sebelum Verifikasi (Prediksi Mentah)'}
          </strong>{' '}
          &bull; {sampleCount} sampel &bull; {executionTimeS}s
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <div
          className={`inline-flex rounded-md border p-0.5 ${
            isLightMode ? 'bg-[#F1F5F9] border-[#E2E8F0]' : 'bg-[#111820] border-[#2E3A47]'
          }`}
          role="group"
          aria-label="Pilih mode verifikasi"
        >
          <button
            type="button"
            onClick={() => onChangeVerificationMode(false)}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition-colors ${
              !isVerificationActive
                ? 'bg-rose-600 text-white'
                : isLightMode
                ? 'text-[#475569] hover:text-[#202832]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Sebelum Verifikasi
          </button>
          <button
            type="button"
            onClick={() => onChangeVerificationMode(true)}
            disabled={isLoading}
            className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition-colors ${
              isVerificationActive
                ? 'bg-[#16A36A] text-white'
                : isLightMode
                ? 'text-[#475569] hover:text-[#202832]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Sesudah Verifikasi
          </button>
        </div>

        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono ${
            isLightMode ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#202832]' : 'bg-[#111820] border-[#2E3A47] text-[#F1F5F9]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#F47721] shrink-0" aria-hidden="true" />
          <label htmlFor="header-model-select" className="text-[11px] font-sans font-semibold opacity-75">
            Model:
          </label>
          <select
            id="header-model-select"
            value={modelVariant}
            disabled={isLoading}
            onChange={(e) => onChangeModel(e.target.value as OCRModelVariant)}
            className="bg-transparent font-mono text-xs font-bold outline-none cursor-pointer text-[#F47721] disabled:opacity-50"
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value} className="bg-white dark:bg-[#171F28] text-slate-800 dark:text-slate-200">
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
