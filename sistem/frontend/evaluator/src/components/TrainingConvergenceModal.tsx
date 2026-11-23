import React, { useEffect, useState } from 'react';
import { X, TrendingUp, Cpu, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { fetchTrainingHistory } from '../services/api';
import type { TrainingHistoryResponse } from '../types/evaluator';

interface TrainingConvergenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode?: boolean;
}

const PRETRAINED_LABELS: { key: string; name: string; params: string }[] = [
  { key: 'tiny', name: 'PP-OCRv6 Tiny', params: '1.5M' },
  { key: 'small', name: 'PP-OCRv6 Small', params: '7.7M' },
  { key: 'medium', name: 'PP-OCRv6 Medium', params: '34.5M' },
  { key: 'ppocrv5', name: 'PP-OCRv5 Mobile', params: '4.1M' },
  { key: 'dbnet_parseq', name: 'DBNet + PARSeq', params: '26.3M' },
];

export const TrainingConvergenceModal: React.FC<TrainingConvergenceModalProps> = ({
  isOpen,
  onClose,
  isLightMode = false,
}) => {
  const [data, setData] = useState<TrainingHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    fetchTrainingHistory()
      .then((res) => {
        if (active && res) setData(res);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const history = data?.crnn?.history || [];
  const bestEpoch = data?.crnn?.best_epoch ?? 0;
  const bestFsr = data?.crnn?.best_val_fsr ?? 0;
  const bestCer = data?.crnn?.best_val_cer ?? 0;
  const epochsRan = data?.crnn?.epochs_ran ?? history.length;
  const trainSamples = data?.crnn?.train_samples ?? 0;
  const valSamples = data?.crnn?.val_samples ?? 0;

  const chartW = 680;
  const chartH = 220;
  const padL = 44;
  const padR = 20;
  const padT = 18;
  const padB = 28;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxLoss = Math.max(3.5, ...history.map((h) => Math.max(h.train_loss, h.val_loss)));
  const xOf = (idx: number) =>
    history.length <= 1 ? padL : padL + (idx / (history.length - 1)) * plotW;
  const yPct = (pct: number) => padT + (1 - Math.max(0, Math.min(100, pct)) / 100) * plotH;
  const yLoss = (loss: number) => padT + (1 - Math.max(0, Math.min(maxLoss, loss)) / maxLoss) * plotH;

  const fsrPoints = history.map((h, i) => `${xOf(i).toFixed(1)},${yPct(h.val_fsr).toFixed(1)}`).join(' ');
  const trainLossPoints = history.map((h, i) => `${xOf(i).toFixed(1)},${yLoss(h.train_loss).toFixed(1)}`).join(' ');
  const valLossPoints = history.map((h, i) => `${xOf(i).toFixed(1)},${yLoss(h.val_loss).toFixed(1)}`).join(' ');

  const inspected = hoverIdx !== null && history[hoverIdx] ? history[hoverIdx] : history[history.length - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crnn-modal-title"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl rounded-lg border shadow-2xl flex flex-col max-h-[90vh] ${
          isLightMode ? 'bg-white border-[#E2E8F0] text-[#202832]' : 'bg-[#171F28] border-[#2E3A47] text-[#F1F5F9]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isLightMode ? 'border-[#E2E8F0]' : 'border-[#2E3A47]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-[#16A36A]" aria-hidden="true" />
            <div>
              <h3 id="crnn-modal-title" className="text-sm font-mono font-bold uppercase tracking-wider">
                Kurva Konvergensi CRNN-CTC & Rekap Epoch Semua Model
              </h3>
              <p className={`text-xs font-sans ${isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                Dilatih pada dataset bersih 01_latih ({trainSamples + valSamples} citra bebas duplikat & bebas kebocoran uji)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal kurva training"
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F47721] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47721]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs font-mono text-[#94A3B8]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#F47721]" aria-hidden="true" />
              Memuat catatan histori epoch dari crnn_training_history.json...
            </div>
          ) : (
            <>
              {/* Key KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#111820] border-[#2E3A47]'}`}>
                  <div className="text-[11px] font-sans text-[#94A3B8]">Total Epoch Berjalan</div>
                  <div className="text-lg font-mono font-bold tabular-nums mt-0.5">{epochsRan} Epoch</div>
                </div>
                <div className={`p-3 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#111820] border-[#2E3A47]'}`}>
                  <div className="text-[11px] font-sans text-[#94A3B8]">Titik Bobot Terbaik</div>
                  <div className="text-lg font-mono font-bold text-[#F47721] tabular-nums mt-0.5">Epoch {bestEpoch}</div>
                </div>
                <div className={`p-3 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#111820] border-[#2E3A47]'}`}>
                  <div className="text-[11px] font-sans text-[#94A3B8]">Val FSR Terbaik</div>
                  <div className="text-lg font-mono font-bold text-[#16A36A] dark:text-[#38C98A] tabular-nums mt-0.5">
                    {bestFsr.toFixed(2)}%
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#111820] border-[#2E3A47]'}`}>
                  <div className="text-[11px] font-sans text-[#94A3B8]">Val CER Terbaik</div>
                  <div className="text-lg font-mono font-bold text-blue-400 tabular-nums mt-0.5">
                    {bestCer.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Real 50-Epoch Convergence Chart */}
              {history.length > 0 && (
                <div className={`p-4 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-[#111820] border-[#2E3A47]'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-mono">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-[#38C98A]">
                        <span className="w-3 h-0.5 bg-[#38C98A] inline-block" /> Val FSR (%)
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#F47721]">
                        <span className="w-3 h-0.5 bg-[#F47721] inline-block" /> Train Loss
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-blue-400">
                        <span className="w-3 h-0.5 bg-blue-400 inline-block" /> Val Loss
                      </span>
                    </div>
                    {inspected && (
                      <div className="text-[11px] text-[#94A3B8] tabular-nums">
                        Epoch {inspected.epoch}: FSR <strong>{inspected.val_fsr.toFixed(2)}%</strong> &bull; CER{' '}
                        <strong>{inspected.val_cer.toFixed(2)}%</strong> &bull; Val Loss{' '}
                        <strong>{inspected.val_loss.toFixed(3)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <svg
                      viewBox={`0 0 ${chartW} ${chartH}`}
                      className="w-full h-56 min-w-[520px]"
                      onMouseLeave={() => setHoverIdx(null)}
                    >
                      {[0, 25, 50, 75, 100].map((pct) => {
                        const y = yPct(pct);
                        return (
                          <g key={pct}>
                            <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#2E3A47" strokeDasharray="3 3" />
                            <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-[#94A3B8] text-[10px] font-mono">
                              {pct}%
                            </text>
                          </g>
                        );
                      })}
                      <polyline fill="none" stroke="#F47721" strokeWidth="1.8" strokeOpacity="0.85" points={trainLossPoints} />
                      <polyline fill="none" stroke="#60A5FA" strokeWidth="1.8" strokeOpacity="0.85" points={valLossPoints} />
                      <polyline fill="none" stroke="#38C98A" strokeWidth="2.4" points={fsrPoints} />

                      {history.map((h, i) => (
                        <circle
                          key={h.epoch}
                          cx={xOf(i)}
                          cy={yPct(h.val_fsr)}
                          r={h.epoch === bestEpoch ? 4.5 : 2.5}
                          className={h.epoch === bestEpoch ? 'fill-[#F47721]' : 'fill-[#38C98A]/80 cursor-pointer'}
                          onMouseEnter={() => setHoverIdx(i)}
                        />
                      ))}

                      {[1, Math.ceil(history.length / 2), history.length].map((ep) => {
                        const idx = Math.max(0, Math.min(history.length - 1, ep - 1));
                        return (
                          <text
                            key={ep}
                            x={xOf(idx)}
                            y={chartH - 6}
                            textAnchor="middle"
                            className="fill-[#94A3B8] text-[10px] font-mono"
                          >
                            Ep {history[idx]?.epoch}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              )}

              {/* All 6 models epoch transparency table */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-[#F47721]" aria-hidden="true" />
                  <span>Status Pelatihan Seluruh 6 Model Pembanding</span>
                </div>
                <div className={`overflow-x-auto rounded-lg border ${isLightMode ? 'border-[#E2E8F0]' : 'border-[#2E3A47]'}`}>
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className={isLightMode ? 'bg-[#F8FAFC] text-[#475569]' : 'bg-[#111820] text-[#94A3B8]'}>
                        <th className="py-2 px-3">Model</th>
                        <th className="py-2 px-3">Param</th>
                        <th className="py-2 px-3">Epoch Lokal</th>
                        <th className="py-2 px-3">Status Skema</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLightMode ? 'divide-[#E2E8F0]' : 'divide-[#2E3A47]'}`}>
                      <tr className="bg-[#16A36A]/10">
                        <td className="py-2 px-3 font-semibold">CRNN-CTC (Dilatih Ulang)</td>
                        <td className="py-2 px-3">850K</td>
                        <td className="py-2 px-3 font-bold text-[#16A36A] dark:text-[#38C98A]">
                          {epochsRan} Epoch (Best Ep {bestEpoch})
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <span className="inline-flex items-center gap-1 text-[#16A36A] dark:text-[#38C98A] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Trained dari 0 pada {trainSamples} train / {valSamples} val
                          </span>
                        </td>
                      </tr>
                      {PRETRAINED_LABELS.map((m) => (
                        <tr key={m.key}>
                          <td className="py-2 px-3">{m.name}</td>
                          <td className="py-2 px-3">{m.params}</td>
                          <td className="py-2 px-3 text-[#94A3B8]">0 Epoch</td>
                          <td className="py-2 px-3 font-sans text-[#94A3B8]">
                            {data?.pretrained_models?.[m.key]?.mode || 'Pretrained ONNX Zero-Shot'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-sans text-[#94A3B8]">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Lima model berbasis PaddleOCR &amp; PARSeq menggunakan bobot <em>pretrained</em> resmi (0 epoch pelatihan lokal) untuk menguji ketahanan <em>zero-shot</em> pada layar 7-segmen, sedangkan CRNN-CTC dilatih penuh dari nol menggunakan augmentasi skala industri + <em>crop</em> SachaIZADI bebas kebocoran set uji.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
