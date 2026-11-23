import React, { useEffect, useState } from 'react';
import { CheckCircle2, Database, Layers, Cpu, ShieldCheck } from 'lucide-react';
import { fetchExperimentOverview } from '../services/api';
import type { ExperimentOverviewResponse } from '../types/evaluator';

interface ExperimentTrackerPanelProps {
  isLightMode: boolean;
}

const ABLATION_LABELS: Record<string, string> = {
  baseline_raw: '0. Tanpa Verifikasi (Mentah)',
  stage1_temporal: '1. + Uji Temporal (L3 Burst 3–5 Frame)',
  stage2_temporal_structural: '2. + Uji Struktural (L3 + L1 Slot/Desimal)',
  stage3_temporal_structural_physical: '3. + Uji Fisik (L3 + L1 + L2 Batas Berat)',
  stage4_full_4layer: '4. + Kalibrasi Suhu & Ambang (L3 + L1 + L2 + L4)',
};

export const ExperimentTrackerPanel: React.FC<ExperimentTrackerPanelProps> = ({ isLightMode }) => {
  const [overview, setOverview] = useState<ExperimentOverviewResponse | null>(null);
  const [ablationModel, setAblationModel] = useState<'tiny_ft' | 'crnn' | 'tiny' | 'small'>('tiny_ft');
  const [scope, setScope] = useState<'burst_120' | 'unified_755'>('burst_120');

  useEffect(() => {
    fetchExperimentOverview().then((res) => setOverview(res));
  }, []);

  const surfaceCls = isLightMode
    ? 'bg-white border-[#CBD5E1] text-[#0F172A]'
    : 'bg-[#171F28] border-[#2E3A47] text-[#F1F5F9]';
  const mutedCls = isLightMode ? 'text-[#475569]' : 'text-[#CBD5E1]';
  const headBg = isLightMode ? 'bg-[#F1F5F9] text-[#334155]' : 'bg-[#111820] text-[#CBD5E1]';

  const ablationRows = (overview?.tahap_b || []).filter(
    (r) => r.model === ablationModel && r.scope === scope
  );

  return (
    <div className="space-y-6">
      {/* Banner Verifikasi Tuntas 24/24 & 44/44 */}
      <div className={`p-4 rounded-lg border ${surfaceCls} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-[#16A36A]/15 border border-[#16A36A]/40 flex items-center justify-center text-[#16A36A] shrink-0">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-sans font-bold uppercase tracking-wide">
              Status Eksekusi Eksperimen: 24/24 Langkah &amp; 44/44 Run Formal Selesai
            </h2>
            <p className={`text-xs mt-0.5 ${mutedCls}`}>
              Dataset terpusat bebas bocor uji: 01_latih (2.268 citra) &bull; 02_kalibrasi (600 frame) &bull; 03_uji_755 (755 citra) &bull; 04_uji_burst_120 (120 burst).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-mono shrink-0">
          <span className="px-2.5 py-1 rounded border border-[#16A36A]/40 bg-[#16A36A]/10 text-[#16A36A] dark:text-[#38C98A] font-semibold">
            D_train ∩ D_test = 0
          </span>
          <span className="px-2.5 py-1 rounded border border-[#F47721]/40 bg-[#F47721]/10 text-[#F47721] font-semibold">
            Champion FSR: {overview?.champion?.champion_overall || 'crnn'}
          </span>
        </div>
      </div>

      {/* Ringkasan Dataset Satu Atap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { code: 'dataset/01_latih', count: '2.268 citra', note: '400 timbangan + 200 bezel gudang + 1.200 CRNN + 468 Sacha (419 ROI)' },
          { code: 'dataset/02_kalibrasi', count: '600 frame', note: '120 burst berlabel asli K0000–K0119 untuk suhu T* dan ambang tau' },
          { code: 'dataset/03_uji_755', count: '755 citra', note: '600 frame sintetis 7 tema/6 kondisi + 155 foto riil SachaIZADI test' },
          { code: 'dataset/04_uji_burst_120', count: '120 burst', note: 'Masing-masing 5 frame berurutan untuk uji L3 Temporal multi-frame' },
        ].map((ds) => (
          <div key={ds.code} className={`p-3.5 rounded-lg border ${surfaceCls} flex flex-col justify-between gap-2`}>
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-xs font-mono font-bold text-[#F47721] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> {ds.code}
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-industrial-950 border border-industrial-800 whitespace-nowrap">
                {ds.count}
              </span>
            </div>
            <p className={`text-[11px] leading-snug ${mutedCls}`}>{ds.note}</p>
          </div>
        ))}
      </div>

      {/* Tahap B: Progresi Uji Ablasi Fail-Fast 5 Tingkat */}
      <div className={`rounded-lg border ${surfaceCls} overflow-hidden`}>
        <div className="p-4 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F47721]" aria-hidden="true" />
            <div>
              <h3 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wide">
                Pelacakan Uji Ablasi Fail-Fast 5 Tingkat (Tahap B)
              </h3>
              <p className={`text-[11px] ${mutedCls}`}>
                Menunjukkan kontribusi bertahap dari kondisi mentah hingga Full 4-Lapis Verifikasi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Pilih model ablasi"
              value={ablationModel}
              onChange={(e) => setAblationModel(e.target.value as 'tiny_ft' | 'crnn' | 'tiny' | 'small')}
              className={`rounded-md border px-2.5 py-1 text-xs font-mono ${surfaceCls}`}
            >
              <option value="tiny_ft">PP-OCRv6 Tiny (Fine-Tuned 22ep)</option>
              <option value="crnn">CRNN-CTC (Retrained 50ep)</option>
              <option value="tiny">PP-OCRv6 Tiny (Zero-Shot)</option>
              <option value="small">PP-OCRv6 Small (Zero-Shot)</option>
            </select>
            <select
              aria-label="Pilih himpunan uji ablasi"
              value={scope}
              onChange={(e) => setScope(e.target.value as 'burst_120' | 'unified_755')}
              className={`rounded-md border px-2.5 py-1 text-xs font-mono ${surfaceCls}`}
            >
              <option value="burst_120">120 Burst Multi-Frame</option>
              <option value="unified_755">755 Citra Uji Tunggal</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className={`${headBg} text-[11px] font-sans`}>
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Tahap Verifikasi</th>
                <th className="py-2.5 px-3 text-right font-semibold">Sampel (n)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Coverage (%)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Silent Error (%)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Selective Acc (%)</th>
                <th className="py-2.5 px-3.5 text-right font-semibold">AURC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/40">
              {ablationRows.map((row) => (
                <tr key={`${row.model}-${row.ablation_stage}-${row.scope}`}>
                  <td className="py-2.5 px-3.5 font-sans font-semibold">
                    {ABLATION_LABELS[row.ablation_stage] || row.ablation_stage}
                  </td>
                  <td className="py-2.5 px-3 text-right">{row.n}</td>
                  <td className="py-2.5 px-3 text-right">{row.coverage_pct}%</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#F47721]">
                    {row.silent_error_pct}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#16A36A] dark:text-[#38C98A]">
                    {row.selective_acc_pct}%
                  </td>
                  <td className="py-2.5 px-3.5 text-right">{row.aurc}</td>
                </tr>
              ))}
              {ablationRows.length === 0 && (
                <tr>
                  <td colSpan={6} className={`py-4 text-center font-sans ${mutedCls}`}>
                    Memuat data ablasi dari /api/eval/experiment-overview...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kalibrasi Suhu & Profil Edge */}
      <div className={`rounded-lg border ${surfaceCls} overflow-hidden`}>
        <div className="p-4 border-b border-inherit flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#F47721]" aria-hidden="true" />
          <h3 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wide">
            Rekap Kalibrasi (02_kalibrasi, n=600) &amp; Efisiensi Edge CPU
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className={`${headBg} text-[11px] font-sans`}>
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Model</th>
                <th className="py-2.5 px-3 text-right font-semibold">Parameter</th>
                <th className="py-2.5 px-3 text-right font-semibold">T*</th>
                <th className="py-2.5 px-3 text-right font-semibold">Tau Terkunci</th>
                <th className="py-2.5 px-3 text-right font-semibold">ECE Awal &rarr; Akhir</th>
                <th className="py-2.5 px-3 text-right font-semibold">Load (ms)</th>
                <th className="py-2.5 px-3.5 text-right font-semibold">RSS RAM (MB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/40">
              {(overview?.edge_profile || []).map((em) => {
                const cm = overview?.calibration?.[em.model] || {};
                return (
                  <tr key={em.model}>
                    <td className="py-2.5 px-3.5 font-sans font-semibold uppercase">{em.model}</td>
                    <td className="py-2.5 px-3 text-right">{Number(em.param_count || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">{cm.optimal_temperature ?? '-'}</td>
                    <td className="py-2.5 px-3 text-right">{cm.locked_threshold ?? '-'}</td>
                    <td className="py-2.5 px-3 text-right">
                      {cm.ece_before ?? '-'} &rarr; <span className="text-[#16A36A] dark:text-[#38C98A] font-bold">{cm.ece_after ?? '-'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">{em.cold_load_ms}</td>
                    <td className="py-2.5 px-3.5 text-right">{em.rss_after_mb} MB</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={`px-4 py-2.5 border-t border-inherit text-[11px] font-sans flex items-center gap-2 ${mutedCls}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A36A] shrink-0" aria-hidden="true" />
          Seluruh inferensi &amp; verifikasi berjalan 100% luring di CPU tanpa biaya API eksternal.
        </div>
      </div>
    </div>
  );
};
