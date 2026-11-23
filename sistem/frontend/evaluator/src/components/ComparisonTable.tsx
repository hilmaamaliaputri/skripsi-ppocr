import React, { useEffect, useState, useMemo } from 'react';
import { Award, CheckCircle2, Layers, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchComparisonMatrix } from '../services/api';
import type { OCRModelVariant } from '../types/evaluator';

interface ComparisonRow {
  variantKey: string;
  variantName: string;
  tierLabel?: string;
  architecture?: string;
  size: string;
  paramCount?: string;
  latency: string;
  verifMode: string;
  unlitFilter?: string;
  fsr: string;
  cer: string;
  false8: string | number;
  silentError: string;
  coverage?: string;
  selectiveAcc?: string;
  aurc?: string;
  recommendation: string;
  isThesisChoice?: boolean;
}

interface ComparisonTableProps {
  currentVariant?: OCRModelVariant;
  verificationActive?: boolean;
  onOpenTrainingCurve?: () => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  currentVariant = 'crnn',
  verificationActive = true,
  onOpenTrainingCurve,
}) => {
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modeFilter, setModeFilter] = useState<'all' | 'raw' | 'verified'>('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchComparisonMatrix()
      .then((res) => {
        if (active && Array.isArray(res)) {
          setRows(res);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    if (modeFilter === 'raw') return rows.filter((r) => r.verifMode.toLowerCase().includes('nonaktif'));
    if (modeFilter === 'verified') return rows.filter((r) => !r.verifMode.toLowerCase().includes('nonaktif'));
    return rows;
  }, [rows, modeFilter]);

  const summary = useMemo(() => {
    const champ = rows.find((r) => r.isThesisChoice);
    const crnnRaw = rows.find((r) => r.variantKey === 'crnn' && r.verifMode.toLowerCase().includes('nonaktif'));
    const crnnVer = rows.find((r) => r.variantKey === 'crnn' && !r.verifMode.toLowerCase().includes('nonaktif'));
    const smallVer = rows.find((r) => r.variantKey === 'small' && !r.verifMode.toLowerCase().includes('nonaktif'));
    return { champ, crnnRaw, crnnVer, smallVer };
  }, [rows]);

  return (
    <div className="rounded-lg bg-industrial-900 border border-industrial-800 p-5 theme-card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Layers className="w-4 h-4 text-[#F47721]" aria-hidden="true" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-industrial-100 theme-text-primary">
              Matriks Komparasi 6 Model OCR (n = 755 Citra Terkunci)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16A36A]/15 text-[#16A36A] dark:text-[#38C98A] border border-[#16A36A]/35 font-semibold">
              Data Backend Langsung
            </span>
          </div>
          <p className="text-xs font-sans text-industrial-400 mt-1">
            Perbandingan objektif kondisi <strong>Sebelum Verifikasi (Mentah)</strong> vs <strong>Sesudah Verifikasi 4-Lapis (L3→L1→L2→L4)</strong> tanpa pengubahan ambang pada test set.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-industrial-700 p-0.5 bg-industrial-950" role="group" aria-label="Filter mode verifikasi">
            {(
              [
                { id: 'all', label: 'Semua (12)' },
                { id: 'raw', label: 'Sebelum Verifikasi' },
                { id: 'verified', label: 'Sesudah 4-Lapis' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setModeFilter(opt.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-sans font-semibold transition-colors whitespace-nowrap ${
                  modeFilter === opt.id
                    ? 'bg-[#F47721] text-white'
                    : 'text-industrial-300 hover:text-industrial-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {onOpenTrainingCurve && (
            <button
              type="button"
              onClick={onOpenTrainingCurve}
              className="px-2.5 py-1.5 rounded-md text-[11px] font-sans font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-[#38C98A] hover:bg-emerald-200 dark:hover:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-500/30 transition-colors whitespace-nowrap"
            >
              Kurva CRNN (50 Ep)
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-xs font-mono text-industrial-400">
          <RefreshCw className="w-4 h-4 animate-spin text-[#F47721]" aria-hidden="true" />
          Memuat matriks resmi 6 model...
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="p-6 rounded-lg border border-industrial-800 text-center text-xs font-sans text-industrial-400">
          Matriks komparasi belum tersedia (pastikan backend FastAPI aktif pada port 8000).
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-industrial-800">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr className="border-b border-industrial-800 bg-industrial-950/60 text-[11px] font-mono uppercase tracking-wider text-industrial-400">
                <th className="py-2.5 px-3">Model & Konfigurasi</th>
                <th className="py-2.5 px-3">Mode Verifikasi</th>
                <th className="py-2.5 px-3 text-right">Latensi CPU</th>
                <th className="py-2.5 px-3 text-right">FSR [95% CI]</th>
                <th className="py-2.5 px-3 text-right">CER</th>
                <th className="py-2.5 px-3 text-right">Coverage</th>
                <th className="py-2.5 px-3 text-right">Sel. Acc</th>
                <th className="py-2.5 px-3 text-right">Silent Error</th>
                <th className="py-2.5 px-3 text-right">AURC</th>
                <th className="py-2.5 px-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/70 text-xs font-mono">
              {filteredRows.map((row, idx) => {
                const isVerifRow = !row.verifMode.toLowerCase().includes('nonaktif');
                const isCurrent = row.variantKey === currentVariant && isVerifRow === verificationActive;
                return (
                  <tr
                    key={`${row.variantKey}-${idx}`}
                    className={`transition-colors ${
                      row.isThesisChoice
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/15'
                        : isCurrent
                        ? 'bg-orange-50 dark:bg-[#F47721]/10 hover:bg-orange-100/70 dark:hover:bg-[#F47721]/15'
                        : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-industrial-100 theme-text-primary">
                          {row.variantName}
                        </span>
                        {row.isThesisChoice && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-mono font-bold">
                            <Award className="w-3 h-3" aria-hidden="true" /> CHAMPION EDGE
                          </span>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F47721] text-white text-[10px] font-mono font-bold">
                            AKTIF
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-industrial-400 mt-0.5">
                        {row.architecture || '-'} &bull; {row.paramCount || '-'} param &bull; {row.size}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      {isVerifRow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-emerald-100 dark:bg-[#16A36A]/15 text-emerald-800 dark:text-[#38C98A] border border-emerald-300 dark:border-[#16A36A]/35 whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> 4-Lapis Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/35 whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Mentah
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums text-industrial-200 theme-text-primary">
                      {row.latency}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-industrial-100 theme-text-primary">
                      {row.fsr}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-industrial-300">
                      {row.cer}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-industrial-200 theme-text-primary">
                      {row.coverage || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-[#16A36A] dark:text-[#38C98A]">
                      {row.selectiveAcc || '-'}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-bold ${
                        parseFloat(row.silentError) <= 1.5
                          ? 'text-[#16A36A] dark:text-[#38C98A]'
                          : parseFloat(row.silentError) >= 20
                          ? 'text-[#EF4444]'
                          : 'text-[#F59E0B]'
                      }`}
                    >
                      {row.silentError}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-industrial-300">
                      {row.aurc || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-industrial-300 min-w-[200px]">
                      {row.recommendation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dynamic Highlight Cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-emerald-400">
              <Award className="w-3.5 h-3.5" aria-hidden="true" /> Champion Edge Terukur
            </div>
            <p className="text-xs font-sans text-industrial-200 theme-text-primary">
              <strong>{summary.champ?.variantName || 'CRNN-CTC'}</strong> mencapai FSR <strong>{summary.champ?.fsr}</strong>, AURC <strong>{summary.champ?.aurc}</strong>, latensi <strong>{summary.champ?.latency}</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-[#F47721]/30 bg-[#F47721]/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#F47721]">
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" /> Dampak Penjaga 4-Lapis
            </div>
            <p className="text-xs font-sans text-industrial-200 theme-text-primary">
              Pada CRNN-CTC, Silent Error turun dari <strong>{summary.crnnRaw?.silentError || '-'}</strong> (Mentah) menjadi <strong>{summary.crnnVer?.silentError || '-'}</strong>, dengan Selective Acc <strong>{summary.crnnVer?.selectiveAcc || '-'}</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Zero-Shot vs Fine-Tuned
            </div>
            <p className="text-xs font-sans text-industrial-200 theme-text-primary">
              PP-OCRv6 Small (Zero-Shot) menekan Silent Error ke <strong>{summary.smallVer?.silentError || '-'}</strong> dengan Selective Acc <strong>{summary.smallVer?.selectiveAcc || '-'}</strong> pada coverage ketat <strong>{summary.smallVer?.coverage || '-'}</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
