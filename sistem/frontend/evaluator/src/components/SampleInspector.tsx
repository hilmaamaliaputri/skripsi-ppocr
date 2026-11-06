import React, { useState } from 'react';
import type { SampleEvaluation } from '../types/evaluator';
import { Filter, Eye, Check, X, AlertCircle } from 'lucide-react';

interface SampleInspectorProps {
  samples: SampleEvaluation[];
}

export const SampleInspector: React.FC<SampleInspectorProps> = ({ samples }) => {
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [selectedSample, setSelectedSample] = useState<SampleEvaluation | null>(samples[0] || null);

  const filtered = samples.filter((s) => {
    if (filterDecision === 'ALL') return true;
    if (filterDecision === 'ERRORS') return !s.is_correct;
    if (filterDecision === 'SILENT') return s.is_silent_error;
    return s.decision === filterDecision;
  });

  const getStatusBadge = (decision: SampleEvaluation['decision']) => {
    switch (decision) {
      case 'TERIMA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">TERIMA</span>;
      case 'TOLAK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">TOLAK</span>;
      case 'KONFIRMASI':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">KONFIRMASI</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700">BATAL</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Table list */}
      <div className="lg:col-span-2 rounded bg-industrial-900 border border-industrial-800 flex flex-col">
        {/* Table Toolbar */}
        <div className="p-3 border-b border-industrial-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-industrial-400" />
            <span className="text-xs font-mono font-bold text-white uppercase">Data Sampel Evaluasi</span>
            <span className="text-[11px] font-mono text-industrial-400">({filtered.length} dari {samples.length})</span>
          </div>

          <div className="flex items-center gap-1">
            {(['ALL', 'TERIMA', 'TOLAK', 'KONFIRMASI', 'ERRORS'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterDecision(mode)}
                className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                  filterDecision === mode
                    ? 'bg-industrial-800 text-white border border-industrial-700 font-bold'
                    : 'text-industrial-400 hover:text-industrial-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-industrial-950 text-industrial-400 sticky top-0 border-b border-industrial-800">
              <tr>
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Ground Truth</th>
                <th className="py-2 px-3">Prediksi OCR</th>
                <th className="py-2 px-3">Raw Conf</th>
                <th className="py-2 px-3">Calib Conf</th>
                <th className="py-2 px-3">Keputusan</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {filtered.map((s) => {
                const isSelected = selectedSample?.id === s.id;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSample(s)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/40 text-cyan-200' : 'hover:bg-industrial-850/50 text-industrial-300'
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-industrial-200">{s.id}</td>
                    <td className="py-2 px-3 text-emerald-400">{s.gt_value}</td>
                    <td className={`py-2 px-3 font-semibold ${s.is_correct ? 'text-white' : 'text-red-400'}`}>
                      {s.pred_normalized}
                    </td>
                    <td className="py-2 px-3 text-industrial-400">{(s.raw_confidence * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3 font-bold text-cyan-400">{(s.calibrated_confidence * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3">{getStatusBadge(s.decision)}</td>
                    <td className="py-2 px-3 text-right">
                      <button className="p-1 rounded hover:bg-industrial-800 text-industrial-400 hover:text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Inspector Panel */}
      <div className="rounded bg-industrial-900 border border-industrial-800 p-4 flex flex-col justify-between">
        <div>
          <div className="pb-2 border-b border-industrial-800 flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-white">Inspektur Sampel Lapis</span>
            {selectedSample && getStatusBadge(selectedSample.decision)}
          </div>

          {selectedSample ? (
            <div className="mt-3 space-y-3 font-mono text-xs">
              <div className="bg-industrial-950 p-2.5 rounded border border-industrial-800 space-y-1.5">
                <div className="flex justify-between text-industrial-400">
                  <span>ID Sampel:</span>
                  <span className="text-white font-bold">{selectedSample.id}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span>Perangkat / Produk:</span>
                  <span className="text-cyan-300">{selectedSample.device_id} / {selectedSample.product_id}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span>Ground Truth:</span>
                  <span className="text-emerald-400 font-bold">{selectedSample.gt_value}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span>Prediksi Mentah:</span>
                  <span className="text-white">{selectedSample.pred_raw}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span>Prediksi Normal:</span>
                  <span className="text-cyan-400 font-bold">{selectedSample.pred_normalized}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span>Latensi Eksekusi:</span>
                  <span className="text-purple-400">{selectedSample.latency_ms.toFixed(1)} ms</span>
                </div>
              </div>

              {/* Visual Frame Strip (Setiap Frame Diperlihatkan) */}
              {selectedSample.frames && selectedSample.frames.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-industrial-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-industrial-400 uppercase tracking-wider">
                      Analisis Citra Bingkai (Burst {selectedSample.frames.length} Frame):
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">Keputusan Tiap Frame</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {selectedSample.frames.map((f) => (
                      <div
                        key={f.frame_idx}
                        className="rounded bg-industrial-950 p-1.5 border border-industrial-800 text-center flex flex-col justify-between"
                      >
                        <div className="w-full aspect-[4/3] bg-black/60 rounded overflow-hidden flex items-center justify-center border border-industrial-800/80 mb-1">
                          {f.image_url ? (
                            <img
                              src={f.image_url}
                              alt={`Frame ${f.frame_idx}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-[9px] text-industrial-500 font-mono">F{f.frame_idx}</span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-industrial-400 font-bold">Frame #{f.frame_idx}</span>
                        <span className="text-[10px] font-mono font-bold text-white truncate">{f.normalized_text}</span>
                        <span
                          className={`text-[8px] font-mono font-bold mt-0.5 px-1 rounded ${
                            f.decision === 'TERIMA'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {f.decision}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Layer Diagnostic */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-industrial-400 uppercase tracking-wider">
                  Hasil Verifikasi Empat Lapis:
                </span>

                {/* Stabilitas Multi-Frame */}
                <div className="p-2 rounded bg-industrial-950/70 border border-industrial-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedSample.layers.temporal.passed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className="text-[11px] text-industrial-300">Stabilitas Multi-Frame</span>
                  </div>
                  <span className={`text-[10px] font-bold ${selectedSample.layers.temporal.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedSample.layers.temporal.passed ? 'LOLOS' : 'GAGAL'}
                  </span>
                </div>

                {/* Struktur Display & Digit */}
                <div className="p-2 rounded bg-industrial-950/70 border border-industrial-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedSample.layers.structural.passed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span className="text-[11px] text-industrial-300">Struktur Display & Digit</span>
                    </div>
                    <span className={`text-[10px] font-bold ${selectedSample.layers.structural.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedSample.layers.structural.passed ? 'LOLOS' : 'GAGAL'}
                    </span>
                  </div>
                  {selectedSample.layers.structural.reason && (
                    <span className="text-[10px] text-red-400/90 pl-5">
                      {selectedSample.layers.structural.reason}
                    </span>
                  )}
                </div>

                {/* Batas & Toleransi Produk */}
                <div className="p-2 rounded bg-industrial-950/70 border border-industrial-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedSample.layers.physical.passed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span className="text-[11px] text-industrial-300">Batas & Toleransi Produk</span>
                    </div>
                    <span className={`text-[10px] font-bold ${selectedSample.layers.physical.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedSample.layers.physical.passed ? 'LOLOS' : 'GAGAL'}
                    </span>
                  </div>
                  {selectedSample.layers.physical.reason && (
                    <span className="text-[10px] text-red-400/90 pl-5">
                      {selectedSample.layers.physical.reason}
                    </span>
                  )}
                </div>

                {/* Kalibrasi Probabilitas */}
                <div className="p-2 rounded bg-industrial-950/70 border border-industrial-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedSample.layers.calibration.passed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="text-[11px] text-industrial-300">Kalibrasi Probabilitas</span>
                    </div>
                    <span className={`text-[10px] font-bold ${selectedSample.layers.calibration.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {selectedSample.layers.calibration.passed ? 'LOLOS' : 'PERLU KONFIRMASI'}
                    </span>
                  </div>
                  {selectedSample.layers.calibration.reason && (
                    <span className="text-[10px] text-amber-400/90 pl-5">
                      {selectedSample.layers.calibration.reason}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs font-mono text-industrial-500">
              Pilih sampel dari tabel untuk inspeksi lapis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
