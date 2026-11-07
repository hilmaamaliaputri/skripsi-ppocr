import React, { useState } from 'react';
import type { SampleEvaluation, FrameEvaluationItem } from '../types/evaluator';
import { Filter, Eye, Check, X, AlertCircle, ZoomIn, Image as ImageIcon } from 'lucide-react';

interface SampleInspectorProps {
  samples: SampleEvaluation[];
}

export const SampleInspector: React.FC<SampleInspectorProps> = ({ samples }) => {
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [selectedSample, setSelectedSample] = useState<SampleEvaluation | null>(samples[0] || null);
  const [lightboxFrame, setLightboxFrame] = useState<FrameEvaluationItem | null>(null);

  const filtered = samples.filter((s) => {
    if (filterDecision === 'ALL') return true;
    if (filterDecision === 'ERRORS') return !s.is_correct;
    if (filterDecision === 'SILENT') return s.is_silent_error;
    return s.decision === filterDecision;
  });

  const getStatusBadge = (decision: SampleEvaluation['decision']) => {
    switch (decision) {
      case 'TERIMA':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">TERIMA</span>;
      case 'TOLAK':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-red-950 text-red-400 border border-red-800">TOLAK</span>;
      case 'KONFIRMASI':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-amber-950 text-amber-400 border border-amber-800">KONFIRMASI</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-slate-900 text-slate-400 border border-slate-700">BATAL</span>;
    }
  };

  // Helper to reliably construct image URL from frame or sample ID
  const resolveImageUrl = (f: FrameEvaluationItem, sampleId?: string) => {
    let url = f.image_url || '';
    if (url.includes('/data/data/')) {
      url = url.replace('/data/data/', '/data/');
    }
    if (!url && sampleId) {
      url = `http://127.0.0.1:8000/data/synthetic/${sampleId}/frame_0${f.frame_idx}.jpg`;
    } else if (url && !url.startsWith('http')) {
      url = `http://127.0.0.1:8000${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
      {/* 1. Left Table List - Full height, flex-1 scrollable without hanging gap */}
      <div className="lg:col-span-2 rounded-xl bg-industrial-900 border border-industrial-800 flex flex-col theme-card shadow-sm overflow-hidden h-[730px]">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-industrial-800 flex flex-wrap items-center justify-between gap-3 bg-industrial-900 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-sans font-bold text-white uppercase tracking-wider theme-text-primary">Data Sampel Uji</span>
            <span className="text-[11px] font-sans text-industrial-400">({filtered.length} dari {samples.length} folder)</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'TERIMA', 'TOLAK', 'KONFIRMASI', 'ERRORS'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterDecision(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-sans transition-all ${
                  filterDecision === mode
                    ? 'bg-sky-600 text-white font-semibold shadow-sm'
                    : 'text-industrial-400 hover:text-industrial-200 hover:bg-industrial-850'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Table - Stretches perfectly to fill container height */}
        <div className="overflow-x-auto overflow-y-auto flex-1 h-0">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead className="bg-industrial-950 text-industrial-400 sticky top-0 border-b border-industrial-800 z-10 shadow-sm">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">ID Sampel</th>
                <th className="py-2.5 px-3 font-semibold">Ground Truth</th>
                <th className="py-2.5 px-3 font-semibold">Prediksi OCR</th>
                <th className="py-2.5 px-3 font-semibold">Raw Conf</th>
                <th className="py-2.5 px-3 font-semibold">Calib Conf</th>
                <th className="py-2.5 px-3 font-semibold">Keputusan</th>
                <th className="py-2.5 px-3.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60 font-mono">
              {filtered.map((s) => {
                const isSelected = selectedSample?.id === s.id;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSample(s)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-950/40 text-sky-200' : 'hover:bg-industrial-850/50 text-industrial-300'
                    }`}
                  >
                    <td className="py-2.5 px-3.5 font-semibold text-industrial-200">{s.id}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">{s.gt_value}</td>
                    <td className={`py-2.5 px-3 font-semibold ${s.is_correct ? 'text-white' : 'text-rose-400'}`}>
                      {s.pred_normalized}
                    </td>
                    <td className="py-2.5 px-3 text-industrial-400">{(s.raw_confidence * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 font-bold text-sky-400">{(s.calibrated_confidence * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3">{getStatusBadge(s.decision)}</td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-industrial-800 text-industrial-400 hover:text-white transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Closes the container cleanly */}
        <div className="px-4 py-2.5 border-t border-industrial-800 bg-industrial-950/80 text-[11px] font-sans text-industrial-400 flex items-center justify-between shrink-0">
          <span>Menampilkan <strong>{filtered.length}</strong> folder sampel uji</span>
          <span className="text-sky-400">Klik baris sampel untuk inspeksi burst citra</span>
        </div>
      </div>

      {/* 2. Detail Inspector Panel - Matches left column height (730px) */}
      <div className="rounded-xl bg-industrial-900 border border-industrial-800 p-4 sm:p-5 flex flex-col justify-between theme-card shadow-sm h-[730px] overflow-y-auto">
        <div>
          <div className="pb-3 border-b border-industrial-800 flex items-center justify-between">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-white theme-text-primary">Inspeksi Lapis Verifikasi</span>
            {selectedSample && getStatusBadge(selectedSample.decision)}
          </div>

          {selectedSample ? (
            <div className="mt-4 space-y-4 text-xs font-sans">
              <div className="bg-industrial-950 p-3 rounded-xl border border-industrial-800 space-y-2 font-mono">
                <div className="flex justify-between text-industrial-400">
                  <span className="font-sans">ID Sampel:</span>
                  <span className="text-white font-bold">{selectedSample.id}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span className="font-sans">Perangkat / Produk:</span>
                  <span className="text-sky-300">{selectedSample.device_id} / {selectedSample.product_id}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span className="font-sans">Ground Truth:</span>
                  <span className="text-emerald-400 font-bold">{selectedSample.gt_value}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span className="font-sans">Prediksi Mentah:</span>
                  <span className="text-white">{selectedSample.pred_raw}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span className="font-sans">Prediksi Normal:</span>
                  <span className="text-sky-400 font-bold">{selectedSample.pred_normalized}</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span className="font-sans">Latensi Eksekusi:</span>
                  <span className="text-purple-400">{selectedSample.latency_ms.toFixed(1)} ms</span>
                </div>
              </div>

              {/* Visual Frame Strip (5 Frame Burst Preview) */}
              {selectedSample.frames && selectedSample.frames.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-industrial-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-industrial-400 uppercase tracking-wider">
                      Burst {selectedSample.frames.length} Frame Citra:
                    </span>
                    <span className="text-[10px] text-sky-400 font-sans">Klik frame untuk perbesar</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {selectedSample.frames.map((f) => {
                      const imgUrl = resolveImageUrl(f, selectedSample.id);
                      return (
                        <div
                          key={f.frame_idx}
                          onClick={() => setLightboxFrame({ ...f, image_url: imgUrl })}
                          className="rounded-lg bg-industrial-950 p-1.5 border border-industrial-800 hover:border-sky-500 cursor-pointer text-center flex flex-col justify-between transition-all hover:scale-[1.03] group relative shadow-sm"
                          title="Klik untuk melihat foto resolusi penuh"
                        >
                          <div className="w-full aspect-[4/3] bg-zinc-900 rounded-md overflow-hidden flex items-center justify-center border border-industrial-800 mb-1 relative">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={`Frame ${f.frame_idx}`}
                                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                onError={(e) => {
                                  // Fallback direct path
                                  const target = e.currentTarget;
                                  const fallback = `http://127.0.0.1:8000/data/synthetic/${selectedSample.id}/frame_0${f.frame_idx}.jpg`;
                                  if (target.src !== fallback) {
                                    target.src = fallback;
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-zinc-500">
                                <ImageIcon className="w-4 h-4 mb-0.5" />
                                <span className="text-[8px] font-mono">F{f.frame_idx}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="w-4 h-4 text-sky-300" />
                            </div>
                          </div>
                          <span className="text-[9px] font-sans text-industrial-400 font-semibold">Frame #{f.frame_idx}</span>
                          <span className="text-[10px] font-mono font-bold text-white truncate">{f.normalized_text}</span>
                          <span
                            className={`text-[8px] font-sans font-semibold mt-0.5 px-1 py-0.2 rounded ${
                              f.decision === 'TERIMA'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
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

              {/* Multi-Layer Diagnostic */}
              <div className="space-y-2 pt-2 border-t border-industrial-800">
                <span className="text-[11px] font-bold text-industrial-400 uppercase tracking-wider">
                  Hasil Diagnostik 4 Lapis Verifikasi:
                </span>

                {/* Stabilitas Multi-Frame */}
                <div className="p-2.5 rounded-lg bg-industrial-950/70 border border-industrial-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedSample.layers.temporal.passed ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-[11px] text-industrial-300 font-medium">Stabilitas Multi-Frame</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${selectedSample.layers.temporal.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedSample.layers.temporal.passed ? 'LOLOS' : 'GAGAL'}
                  </span>
                </div>

                {/* Struktur Display & Digit */}
                <div className="p-2.5 rounded-lg bg-industrial-950/70 border border-industrial-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedSample.layers.structural.passed ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-[11px] text-industrial-300 font-medium">Struktur Display & Digit</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${selectedSample.layers.structural.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedSample.layers.structural.passed ? 'LOLOS' : 'GAGAL'}
                    </span>
                  </div>
                  {selectedSample.layers.structural.reason && (
                    <span className="text-[10px] text-rose-400/90 pl-6 leading-tight">
                      {selectedSample.layers.structural.reason}
                    </span>
                  )}
                </div>

                {/* Batas & Toleransi Produk */}
                <div className="p-2.5 rounded-lg bg-industrial-950/70 border border-industrial-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedSample.layers.physical.passed ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-[11px] text-industrial-300 font-medium">Batas & Toleransi Produk</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${selectedSample.layers.physical.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedSample.layers.physical.passed ? 'LOLOS' : 'GAGAL'}
                    </span>
                  </div>
                  {selectedSample.layers.physical.reason && (
                    <span className="text-[10px] text-rose-400/90 pl-6 leading-tight">
                      {selectedSample.layers.physical.reason}
                    </span>
                  )}
                </div>

                {/* Kalibrasi Probabilitas */}
                <div className="p-2.5 rounded-lg bg-industrial-950/70 border border-industrial-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedSample.layers.calibration.passed ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-[11px] text-industrial-300 font-medium">Kalibrasi Probabilitas</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${selectedSample.layers.calibration.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {selectedSample.layers.calibration.passed ? 'LOLOS' : 'PERLU KONFIRMASI'}
                    </span>
                  </div>
                  {selectedSample.layers.calibration.reason && (
                    <span className="text-[10px] text-amber-400/90 pl-6 leading-tight">
                      {selectedSample.layers.calibration.reason}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs font-sans text-industrial-500">
              Pilih sampel dari tabel untuk inspeksi lapis.
            </div>
          )}
        </div>
      </div>

      {/* High-Resolution Frame Modal / Lightbox */}
      {lightboxFrame && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 selection:bg-sky-900"
          onClick={() => setLightboxFrame(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl bg-industrial-900 border border-industrial-700 shadow-2xl flex flex-col overflow-hidden theme-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-industrial-800 flex items-center justify-between bg-industrial-950">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                <h3 className="text-xs font-mono font-bold uppercase text-white theme-text-primary">
                  Inspeksi Resolusi Penuh: Frame #{lightboxFrame.frame_idx} &bull; {selectedSample?.id}
                </h3>
              </div>
              <button
                onClick={() => setLightboxFrame(null)}
                className="p-1 rounded-lg text-industrial-400 hover:text-white hover:bg-industrial-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Stage */}
            <div className="p-6 bg-black flex items-center justify-center min-h-[360px] max-h-[60vh] overflow-hidden">
              {lightboxFrame.image_url ? (
                <img
                  src={resolveImageUrl(lightboxFrame, selectedSample?.id)}
                  alt={`High Res Frame ${lightboxFrame.frame_idx}`}
                  className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-2xl border border-zinc-800"
                />
              ) : (
                <div className="text-zinc-500 font-mono text-sm">Citra frame tidak ditemukan</div>
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 border-t border-industrial-800 bg-industrial-950 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-4">
                <span>Teks Mentah: <strong className="text-white">{lightboxFrame.raw_text}</strong></span>
                <span>Normalisasi: <strong className="text-sky-400">{lightboxFrame.normalized_text}</strong></span>
                <span>Keyakinan: <strong className="text-emerald-400">{(lightboxFrame.confidence * 100).toFixed(1)}%</strong></span>
              </div>
              <div>{getStatusBadge(lightboxFrame.decision)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
