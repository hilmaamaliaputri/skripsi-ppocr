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
  { key: 'tiny', name: 'PP-OCRv6 Tiny (Zero-Shot)', params: '1.5M' },
  { key: 'small', name: 'PP-OCRv6 Small (Zero-Shot)', params: '7.7M' },
  { key: 'medium', name: 'PP-OCRv6 Medium (Zero-Shot)', params: '34.5M' },
  { key: 'ppocrv5', name: 'PP-OCRv5 Mobile (Zero-Shot)', params: '4.1M' },
  { key: 'dbnet_parseq', name: 'DBNet + PARSeq (Zero-Shot)', params: '26.3M' },
];

export const TrainingConvergenceModal: React.FC<TrainingConvergenceModalProps> = ({
  isOpen,
  onClose,
  isLightMode = false,
}) => {
  const [data, setData] = useState<TrainingHistoryResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<'tiny_ft' | 'crnn'>('tiny_ft');
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

  const activeData = selectedModel === 'tiny_ft' && data?.tiny_ft?.history?.length ? data.tiny_ft : data?.crnn;
  const history = activeData?.history || [];
  const bestEpoch = activeData?.best_epoch ?? 0;
  const bestFsr = activeData?.best_val_fsr ?? 0;
  const bestCer = activeData?.best_val_cer ?? 0;
  const epochsRan = activeData?.epochs_ran ?? history.length;
  const trainSamples = activeData?.train_samples ?? 0;
  const valSamples = activeData?.val_samples ?? 0;

  const chartW = 680;
  const chartH = 220;
  const padL = 44;
  const padR = 20;
  const padT = 18;
  const padB = 28;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxLoss = Math.max(3.5, ...history.map((h) => Math.max(h.train_loss, h.val_loss)));
  const xOf = (idx: number) => (history.length <= 1 ? padL : padL + (idx / (history.length - 1)) * plotW);
  const yPct = (pct: number) => padT + (1 - Math.max(0, Math.min(100, pct)) / 100) * plotH;
  const yLoss = (loss: number) => padT + (1 - Math.max(0, Math.min(maxLoss, loss)) / maxLoss) * plotH;

  const fsrPoints = history.map((h, i) => `${xOf(i).toFixed(1)},${yPct(h.val_fsr).toFixed(1)}`).join(' ');
  const trainLossPoints = history.map((h, i) => `${xOf(i).toFixed(1)},${yLoss(h.train_loss).toFixed(1)}`).join(' ');
  const valLossPoints = history.map((h, i) => `${xOf(i).toFixed(1)},${yLoss(h.val_loss).toFixed(1)}`).join(' ');
  const inspected = hoverIdx !== null && history[hoverIdx] ? history[hoverIdx] : history[history.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={`w-full max-w-4xl rounded-lg border shadow-2xl flex flex-col max-h-[90vh] ${
          isLightMode ? 'bg-white border-[#CBD5E1] text-[#0F172A]' : 'bg-[#1B2531] border-[#2B3948] text-[#F8FAFC]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${isLightMode ? 'border-[#CBD5E1]' : 'border-[#2B3948]'}`}>
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-[#16A36A] dark:text-[#38C98A]" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider">
                Kurva Konvergensi Model Dilatih &amp; Rekap Epoch
              </h3>
              <p className={`text-xs font-sans ${isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>
                Dataset bersih 01_latih ({trainSamples + valSamples} citra bebas duplikat &amp; bebas kebocoran uji)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`inline-flex rounded-md border p-0.5 ${isLightMode ? 'bg-[#F1F5F9] border-[#CBD5E1]' : 'bg-[#131B24] border-[#2B3948]'}`}>
              <button
                type="button"
                onClick={() => { setSelectedModel('tiny_ft'); setHoverIdx(null); }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold ${
                  selectedModel === 'tiny_ft' ? 'bg-[#F47721] text-white' : isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'
                }`}
              >
                PP-OCRv6 Tiny FT (22 Ep)
              </button>
              <button
                type="button"
                onClick={() => { setSelectedModel('crnn'); setHoverIdx(null); }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold ${
                  selectedModel === 'crnn' ? 'bg-[#F47721] text-white' : isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'
                }`}
              >
                CRNN-CTC (50 Ep)
              </button>
            </div>
            <button type="button" onClick={onClose} aria-label="Tutup modal kurva training" className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F47721]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs font-mono text-[#94A3B8]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#F47721]" aria-hidden="true" />
              Memuat catatan histori epoch...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-[#131B24] border-[#2B3948]'}`}>
                  <div className={`text-[11px] font-sans ${isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>Epoch Berjalan</div>
                  <div className="text-lg font-mono font-bold tabular-nums mt-0.5">{epochsRan} Epoch</div>
                </div>
                <div className={`p-3 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-[#131B24] border-[#2B3948]'}`}>
                  <div className={`text-[11px] font-sans ${isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>Bobot Terbaik</div>
                  <div className="text-lg font-mono font-bold text-[#C2410C] dark:text-[#F47721] tabular-nums mt-0.5">Epoch {bestEpoch}</div>
                </div>
                <div className={`p-3 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-[#131B24] border-[#2B3948]'}`}>
                  <div className={`text-[11px] font-sans ${isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>Val FSR Terbaik</div>
                  <div className="text-lg font-mono font-bold text-[#15803D] dark:text-[#38C98A] tabular-nums mt-0.5">{bestFsr.toFixed(2)}%</div>
                </div>
                <div className={`p-3 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-[#131B24] border-[#2B3948]'}`}>
                  <div className={`text-[11px] font-sans ${isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>Val CER Terbaik</div>
                  <div className="text-lg font-mono font-bold text-[#1D4ED8] dark:text-[#60A5FA] tabular-nums mt-0.5">{bestCer.toFixed(2)}%</div>
                </div>
              </div>

              {history.length > 0 && (
                <div className={`p-4 rounded-lg border ${isLightMode ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-[#131B24] border-[#2B3948]'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-mono">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-[#15803D] dark:text-[#38C98A]">
                        <span className="w-3 h-0.5 bg-[#16A36A] dark:bg-[#38C98A] inline-block" /> Val FSR (%)
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#C2410C] dark:text-[#F47721]">
                        <span className="w-3 h-0.5 bg-[#F47721] inline-block" /> Train Loss
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#1D4ED8] dark:text-[#60A5FA]">
                        <span className="w-3 h-0.5 bg-[#3B82F6] inline-block" /> Val Loss
                      </span>
                    </div>
                    {inspected && (
                      <div className={`text-[11px] tabular-nums ${isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>
                        Ep {inspected.epoch}: FSR <strong>{inspected.val_fsr.toFixed(2)}%</strong> &bull; CER{' '}
                        <strong>{inspected.val_cer.toFixed(2)}%</strong> &bull; ValLoss <strong>{inspected.val_loss.toFixed(3)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-56 min-w-[520px]" onMouseLeave={() => setHoverIdx(null)}>
                      {[0, 25, 50, 75, 100].map((pct) => {
                        const y = yPct(pct);
                        return (
                          <g key={pct}>
                            <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke={isLightMode ? '#CBD5E1' : '#2E3A47'} strokeDasharray="3 3" />
                            <text x={padL - 8} y={y + 4} textAnchor="end" className="svg-axis-label text-[10px] font-mono">
                              {pct}%
                            </text>
                          </g>
                        );
                      })}
                      <polyline fill="none" stroke="#F47721" strokeWidth="1.8" strokeOpacity="0.85" points={trainLossPoints} />
                      <polyline fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeOpacity="0.85" points={valLossPoints} />
                      <polyline fill="none" stroke="#16A36A" strokeWidth="2.4" points={fsrPoints} />
                      {history.map((h, i) => (
                        <circle
                          key={h.epoch}
                          cx={xOf(i)}
                          cy={yPct(h.val_fsr)}
                          r={h.epoch === bestEpoch ? 4.5 : 2.5}
                          className={h.epoch === bestEpoch ? 'fill-[#F47721]' : 'fill-[#16A36A] dark:fill-[#38C98A] cursor-pointer'}
                          onMouseEnter={() => setHoverIdx(i)}
                        />
                      ))}
                    </svg>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-[#C2410C] dark:text-[#F47721]" aria-hidden="true" />
                  <span>Status Pelatihan Seluruh Model</span>
                </div>
                <div className={`overflow-x-auto rounded-lg border ${isLightMode ? 'border-[#CBD5E1]' : 'border-[#2B3948]'}`}>
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className={isLightMode ? 'bg-[#F1F5F9] text-[#334155]' : 'bg-[#131B24] text-[#CBD5E1]'}>
                        <th className="py-2 px-3">Model</th>
                        <th className="py-2 px-3">Param</th>
                        <th className="py-2 px-3">Epoch Lokal</th>
                        <th className="py-2 px-3">Status Skema</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLightMode ? 'divide-[#E2E8F0]' : 'divide-[#2B3948]'}`}>
                      <tr className="bg-emerald-50 dark:bg-[#16A36A]/10">
                        <td className="py-2 px-3 font-semibold">PP-OCRv6 Tiny (Fine-Tuned)</td>
                        <td className="py-2 px-3">1.50M</td>
                        <td className="py-2 px-3 font-bold text-[#15803D] dark:text-[#38C98A]">
                          {data?.tiny_ft?.epochs_ran ?? 32} Ep (Best Ep {data?.tiny_ft?.best_epoch ?? 22})
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <span className="inline-flex items-center gap-1 text-[#15803D] dark:text-[#38C98A] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> End-to-End Fine-Tuned dari bobot resmi pada {trainSamples} train / {valSamples} val
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-orange-50/70 dark:bg-[#F47721]/10">
                        <td className="py-2 px-3 font-semibold">CRNN-CTC (Dilatih Ulang)</td>
                        <td className="py-2 px-3">850K</td>
                        <td className="py-2 px-3 font-bold text-[#C2410C] dark:text-[#F47721]">
                          {data?.crnn?.epochs_ran ?? 50} Ep (Best Ep {data?.crnn?.best_epoch ?? 48})
                        </td>
                        <td className="py-2 px-3 font-sans">Dilatih penuh dari nol (baseline khusus domain 7-segmen)</td>
                      </tr>
                      {PRETRAINED_LABELS.map((m) => (
                        <tr key={m.key}>
                          <td className="py-2 px-3">{m.name}</td>
                          <td className="py-2 px-3">{m.params}</td>
                          <td className="py-2 px-3 text-industrial-400">0 Epoch</td>
                          <td className="py-2 px-3 font-sans text-industrial-400">{data?.pretrained_models?.[m.key]?.mode || 'Pretrained ONNX Zero-Shot'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-xs font-sans text-[#1E293B] dark:text-[#CBD5E1]">
                <Info className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Perbandingan kini 100% adil: selain menguji 5 model secara <em>zero-shot</em> (0 epoch), kandidat PP-OCRv6 terbaik (<strong>PP-OCRv6 Tiny</strong>) telah di-<em>fine-tune</em> penuh pada dataset latih 7-segmen yang sama dengan <strong>CRNN-CTC</strong>.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
