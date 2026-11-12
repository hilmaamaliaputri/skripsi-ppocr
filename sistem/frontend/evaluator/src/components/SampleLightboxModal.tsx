import React from 'react';
import { X } from 'lucide-react';
import type { FrameEvaluationItem, SampleEvaluation } from '../types/evaluator';

interface SampleLightboxModalProps {
  frame: FrameEvaluationItem | null;
  sampleId?: string;
  onClose: () => void;
  resolveImageUrl: (f: FrameEvaluationItem, sampleId?: string) => string;
  getStatusBadge: (decision: SampleEvaluation['decision']) => React.ReactNode;
  isLightMode?: boolean;
}

export const SampleLightboxModal: React.FC<SampleLightboxModalProps> = ({
  frame,
  sampleId,
  onClose,
  resolveImageUrl,
  getStatusBadge,
  isLightMode,
}) => {
  if (!frame) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 selection:bg-orange-900"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isLightMode
            ? 'bg-white border-[#E2E8F0] text-[#0F172A]'
            : 'bg-[#171F28] border-[#2E3A47] text-[#F1F5F9]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isLightMode
              ? 'bg-[#F8FAFC] border-[#E2E8F0]'
              : 'bg-[#111820] border-[#2E3A47]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F47721] animate-pulse" />
            <h3
              className={`text-xs font-mono font-bold uppercase ${
                isLightMode ? 'text-[#0F172A]' : 'text-white'
              }`}
            >
              Inspeksi Frame #{frame.frame_idx} &bull; {sampleId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLightMode
                ? 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                : 'text-industrial-400 hover:text-white hover:bg-industrial-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Stage */}
        <div className="p-6 bg-[#0B0F14] flex items-center justify-center min-h-[360px] max-h-[60vh] overflow-hidden">
          {frame.image_url ? (
            <img
              src={resolveImageUrl(frame, sampleId)}
              alt={`High Res Frame ${frame.frame_idx}`}
              className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-2xl border border-zinc-800"
            />
          ) : (
            <div className="text-zinc-500 font-mono text-sm">Citra frame tidak ditemukan</div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div
          className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
            isLightMode
              ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
              : 'bg-[#111820] border-[#2E3A47] text-[#94A3B8]'
          }`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Teks Mentah:{' '}
              <strong className={isLightMode ? 'text-[#0F172A]' : 'text-white'}>
                {frame.raw_text}
              </strong>
            </span>
            <span>
              Normalisasi:{' '}
              <strong className="text-[#F47721]">{frame.normalized_text}</strong>
            </span>
            <span>
              Keyakinan:{' '}
              <strong className={isLightMode ? 'text-[#16A36A]' : 'text-emerald-400'}>
                {(frame.confidence * 100).toFixed(1)}%
              </strong>
            </span>
          </div>
          <div>{getStatusBadge(frame.decision)}</div>
        </div>
      </div>
    </div>
  );
};
