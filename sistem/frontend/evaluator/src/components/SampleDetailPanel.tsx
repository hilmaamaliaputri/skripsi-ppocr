import React from 'react';
import { ZoomIn, Image as ImageIcon } from 'lucide-react';
import type { FrameEvaluationItem, SampleEvaluation } from '../types/evaluator';
import { VerificationDiagnosticList } from './VerificationDiagnosticList';

interface SampleDetailPanelProps {
  selectedSample: SampleEvaluation | null;
  onSelectFrame: (frame: FrameEvaluationItem) => void;
  resolveImageUrl: (f: FrameEvaluationItem, sampleId?: string) => string;
  getStatusBadge: (decision: SampleEvaluation['decision']) => React.ReactNode;
  isLightMode?: boolean;
}

export const SampleDetailPanel: React.FC<SampleDetailPanelProps> = ({
  selectedSample,
  onSelectFrame,
  resolveImageUrl,
  getStatusBadge,
  isLightMode = false,
}) => {
  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between shadow-xs h-[730px] overflow-y-auto transition-colors ${
        isLightMode
          ? 'bg-white border-[#E2E8F0]'
          : 'bg-[#171F28] border-[#2E3A47]'
      }`}
    >
      <div>
        <div
          className={`pb-3 border-b flex items-center justify-between ${
            isLightMode ? 'border-[#E2E8F0]' : 'border-[#2E3A47]'
          }`}
        >
          <span
            className={`text-xs font-sans font-bold uppercase tracking-wider ${
              isLightMode ? 'text-[#0F172A]' : 'text-white'
            }`}
          >
            Inspeksi Lapis Verifikasi
          </span>
          {selectedSample && getStatusBadge(selectedSample.decision)}
        </div>

        {selectedSample ? (
          <div className="mt-4 space-y-4 text-xs font-sans">
            {/* Metadata Card */}
            <div
              className={`p-3 rounded-xl border space-y-2 font-mono ${
                isLightMode
                  ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
                  : 'bg-[#111820] border-[#2E3A47] text-[#F1F5F9]'
              }`}
            >
              <div className="flex justify-between">
                <span className={isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}>
                  ID Sampel:
                </span>
                <span className={`font-bold ${isLightMode ? 'text-[#0F172A]' : 'text-white'}`}>
                  {selectedSample.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}>
                  Perangkat / Produk:
                </span>
                <span className={`font-semibold ${isLightMode ? 'text-[#0284C7]' : 'text-sky-300'}`}>
                  {selectedSample.device_id} / {selectedSample.product_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}>
                  Ground Truth:
                </span>
                <span className="font-bold text-[#16A36A]">{selectedSample.gt_value}</span>
              </div>
              <div className="flex justify-between">
                <span className={isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}>
                  Prediksi Mentah:
                </span>
                <span className={isLightMode ? 'text-[#0F172A]' : 'text-white'}>
                  {selectedSample.pred_raw}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}>
                  Prediksi Normal:
                </span>
                <span className="font-bold text-[#F47721]">
                  {selectedSample.pred_normalized}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}>
                  Latensi Eksekusi:
                </span>
                <span className={`font-semibold ${isLightMode ? 'text-[#7C3AED]' : 'text-purple-400'}`}>
                  {selectedSample.latency_ms.toFixed(1)} ms
                </span>
              </div>
            </div>

            {/* Visual Frame Strip (5 Frame Burst Preview) */}
            {selectedSample.frames && selectedSample.frames.length > 0 && (
              <div
                className={`space-y-2 pt-2 border-t ${
                  isLightMode ? 'border-[#E2E8F0]' : 'border-[#2E3A47]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'
                    }`}
                  >
                    Burst {selectedSample.frames.length} Frame Citra:
                  </span>
                  <span className="text-[10px] text-[#F47721] font-sans">
                    Klik frame untuk perbesar
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {selectedSample.frames.map((f) => {
                    const imgUrl = resolveImageUrl(f, selectedSample.id);
                    return (
                      <div
                        key={f.frame_idx}
                        onClick={() => onSelectFrame({ ...f, image_url: imgUrl })}
                        className={`rounded-lg p-1.5 border cursor-pointer text-center flex flex-col justify-between transition-all hover:scale-[1.03] group relative shadow-xs ${
                          isLightMode
                            ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#F47721]'
                            : 'bg-[#111820] border-[#2E3A47] hover:border-[#F47721]'
                        }`}
                        title="Klik untuk melihat foto resolusi penuh"
                      >
                        <div
                          className={`w-full aspect-[4/3] rounded-md overflow-hidden flex items-center justify-center border mb-1 relative ${
                            isLightMode
                              ? 'bg-[#F1F5F9] border-[#E2E8F0]'
                              : 'bg-zinc-900 border-[#2E3A47]'
                          }`}
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={`Frame ${f.frame_idx}`}
                              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const fallback = `/data/synthetic/${selectedSample.id}/frame_0${f.frame_idx}.jpg`;
                                if (target.src !== fallback) {
                                  target.src = fallback;
                                }
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-zinc-400">
                              <ImageIcon className="w-4 h-4 mb-0.5" />
                              <span className="text-[8px] font-mono">F{f.frame_idx}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-sans font-semibold ${
                            isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'
                          }`}
                        >
                          Frame #{f.frame_idx}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold truncate ${
                            isLightMode ? 'text-[#0F172A]' : 'text-white'
                          }`}
                        >
                          {f.normalized_text}
                        </span>
                        <span
                          className={`text-[8px] font-sans font-semibold mt-0.5 px-1 py-0.2 rounded border ${
                            f.decision === 'TERIMA'
                              ? isLightMode
                                ? 'bg-[#ECFDF5] text-[#16A36A] border-[#A7F3D0]'
                                : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : isLightMode
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                              : 'bg-red-950 text-red-400 border-red-800'
                          }`}
                        >
                          {f.decision}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multi-Layer Diagnostic List */}
            <VerificationDiagnosticList
              layers={selectedSample.layers}
              isLightMode={isLightMode}
            />
          </div>
        ) : (
          <div
            className={`py-12 text-center text-xs font-sans ${
              isLightMode ? 'text-[#64748B]' : 'text-industrial-500'
            }`}
          >
            Pilih sampel dari tabel untuk inspeksi lapis.
          </div>
        )}
      </div>
    </div>
  );
};
