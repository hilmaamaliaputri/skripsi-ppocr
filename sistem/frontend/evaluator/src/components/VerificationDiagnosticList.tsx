import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import type { SampleEvaluation } from '../types/evaluator';

interface VerificationDiagnosticListProps {
  layers: SampleEvaluation['layers'];
  isLightMode?: boolean;
}

export const VerificationDiagnosticList: React.FC<VerificationDiagnosticListProps> = ({
  layers,
  isLightMode = false,
}) => {
  return (
    <div
      className={`space-y-2 pt-2 border-t ${
        isLightMode ? 'border-[#E2E8F0]' : 'border-[#2E3A47]'
      }`}
    >
      <span
        className={`text-[11px] font-bold uppercase tracking-wider ${
          isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'
        }`}
      >
        Hasil Diagnostik 4 Lapis Verifikasi:
      </span>

      {/* L3: Stabilitas Multi-Frame */}
      <div
        className={`p-2.5 rounded-lg border flex items-center justify-between ${
          layers.temporal.passed
            ? isLightMode
              ? 'bg-[#F0FDF4] border-[#BBF7D0]'
              : 'bg-[#111820] border-[#2E3A47]'
            : isLightMode
            ? 'bg-[#FEF2F2] border-[#FECACA]'
            : 'bg-[#111820] border-[#2E3A47]'
        }`}
      >
        <div className="flex items-center gap-2">
          {layers.temporal.passed ? (
            <Check className="w-4 h-4 text-[#16A36A]" />
          ) : (
            <X className="w-4 h-4 text-[#DC2626]" />
          )}
          <span
            className={`text-[11px] font-medium ${
              isLightMode ? 'text-[#0F172A]' : 'text-[#F1F5F9]'
            }`}
          >
            Stabilitas Multi-Frame
          </span>
        </div>
        <span
          className={`text-[10px] font-bold ${
            layers.temporal.passed ? 'text-[#16A36A]' : 'text-[#DC2626]'
          }`}
        >
          {layers.temporal.passed ? 'LOLOS' : 'GAGAL'}
        </span>
      </div>

      {/* L1: Struktur Display & Digit */}
      <div
        className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
          layers.structural.passed
            ? isLightMode
              ? 'bg-[#F0FDF4] border-[#BBF7D0]'
              : 'bg-[#111820] border-[#2E3A47]'
            : isLightMode
            ? 'bg-[#FEF2F2] border-[#FECACA]'
            : 'bg-[#111820] border-[#2E3A47]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {layers.structural.passed ? (
              <Check className="w-4 h-4 text-[#16A36A]" />
            ) : (
              <X className="w-4 h-4 text-[#DC2626]" />
            )}
            <span
              className={`text-[11px] font-medium ${
                isLightMode ? 'text-[#0F172A]' : 'text-[#F1F5F9]'
              }`}
            >
              Struktur Display & Digit
            </span>
          </div>
          <span
            className={`text-[10px] font-bold ${
              layers.structural.passed ? 'text-[#16A36A]' : 'text-[#DC2626]'
            }`}
          >
            {layers.structural.passed ? 'LOLOS' : 'GAGAL'}
          </span>
        </div>
        {layers.structural.reason && (
          <span
            className={`text-[10px] pl-6 leading-tight ${
              isLightMode ? 'text-[#DC2626]' : 'text-rose-400/90'
            }`}
          >
            {layers.structural.reason}
          </span>
        )}
      </div>

      {/* L2: Batas & Toleransi Produk */}
      <div
        className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
          layers.physical.passed
            ? isLightMode
              ? 'bg-[#F0FDF4] border-[#BBF7D0]'
              : 'bg-[#111820] border-[#2E3A47]'
            : isLightMode
            ? 'bg-[#FEF2F2] border-[#FECACA]'
            : 'bg-[#111820] border-[#2E3A47]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {layers.physical.passed ? (
              <Check className="w-4 h-4 text-[#16A36A]" />
            ) : (
              <X className="w-4 h-4 text-[#DC2626]" />
            )}
            <span
              className={`text-[11px] font-medium ${
                isLightMode ? 'text-[#0F172A]' : 'text-[#F1F5F9]'
              }`}
            >
              Batas & Toleransi Produk
            </span>
          </div>
          <span
            className={`text-[10px] font-bold ${
              layers.physical.passed ? 'text-[#16A36A]' : 'text-[#DC2626]'
            }`}
          >
            {layers.physical.passed ? 'LOLOS' : 'GAGAL'}
          </span>
        </div>
        {layers.physical.reason && (
          <span
            className={`text-[10px] pl-6 leading-tight ${
              isLightMode ? 'text-[#DC2626]' : 'text-rose-400/90'
            }`}
          >
            {layers.physical.reason}
          </span>
        )}
      </div>

      {/* L4: Kalibrasi Probabilitas */}
      <div
        className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
          layers.calibration.passed
            ? isLightMode
              ? 'bg-[#F0FDF4] border-[#BBF7D0]'
              : 'bg-[#111820] border-[#2E3A47]'
            : isLightMode
            ? 'bg-[#FFFBEB] border-[#FDE68A]'
            : 'bg-[#111820] border-[#2E3A47]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {layers.calibration.passed ? (
              <Check className="w-4 h-4 text-[#16A36A]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#D97706]" />
            )}
            <span
              className={`text-[11px] font-medium ${
                isLightMode ? 'text-[#0F172A]' : 'text-[#F1F5F9]'
              }`}
            >
              Kalibrasi Probabilitas
            </span>
          </div>
          <span
            className={`text-[10px] font-bold ${
              layers.calibration.passed ? 'text-[#16A36A]' : 'text-[#D97706]'
            }`}
          >
            {layers.calibration.passed ? 'LOLOS' : 'PERLU KONFIRMASI'}
          </span>
        </div>
        {layers.calibration.reason && (
          <span
            className={`text-[10px] pl-6 leading-tight ${
              isLightMode ? 'text-[#B45309]' : 'text-amber-400/90'
            }`}
          >
            {layers.calibration.reason}
          </span>
        )}
      </div>
    </div>
  );
};
