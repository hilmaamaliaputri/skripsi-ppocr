import React from 'react';
import { Filter } from 'lucide-react';
import type { SampleEvaluation } from '../types/evaluator';

interface SampleTableProps {
  samples: SampleEvaluation[];
  filtered: SampleEvaluation[];
  selectedSample: SampleEvaluation | null;
  onSelectSample: (sample: SampleEvaluation) => void;
  filterDecision: string;
  onChangeFilter: (filter: string) => void;
  getStatusBadge: (decision: SampleEvaluation['decision']) => React.ReactNode;
  isLightMode?: boolean;
}

export const SampleTable: React.FC<SampleTableProps> = ({
  samples,
  filtered,
  selectedSample,
  onSelectSample,
  filterDecision,
  onChangeFilter,
  getStatusBadge,
  isLightMode = false,
}) => {
  return (
    <div
      className={`rounded-xl border flex flex-col shadow-xs overflow-hidden h-[730px] transition-colors ${
        isLightMode
          ? 'bg-white border-[#E2E8F0]'
          : 'bg-[#171F28] border-[#2E3A47]'
      }`}
    >
      {/* Table Toolbar */}
      <div
        className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
          isLightMode
            ? 'bg-white border-[#E2E8F0]'
            : 'bg-[#171F28] border-[#2E3A47]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#F47721]" />
          <span
            className={`text-xs font-sans font-bold uppercase tracking-wider ${
              isLightMode ? 'text-[#0F172A]' : 'text-white'
            }`}
          >
            Data Sampel Uji
          </span>
          <span
            className={`text-[11px] font-sans ${
              isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'
            }`}
          >
            ({filtered.length} dari {samples.length} folder)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'TERIMA', 'TOLAK', 'KONFIRMASI', 'ERRORS'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onChangeFilter(mode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-sans transition-all ${
                filterDecision === mode
                  ? 'bg-[#F47721] hover:bg-[#FF974D] text-white font-semibold shadow-xs'
                  : isLightMode
                  ? 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
              }`}
            >
              {mode === 'ERRORS' ? 'ERROR' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto overflow-y-auto flex-1 h-0">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead
            className={`sticky top-0 border-b z-10 text-[11px] ${
              isLightMode
                ? 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
                : 'bg-[#111820] text-[#94A3B8] border-[#2E3A47]'
            }`}
          >
            <tr>
              <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">ID Sampel</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Ground Truth</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Prediksi OCR</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Raw Conf</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Calib Conf</th>
              <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">Keputusan</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y font-mono text-xs ${
              isLightMode ? 'divide-[#F1F5F9]' : 'divide-[#2E3A47]/60'
            }`}
          >
            {filtered.map((s) => {
              const isSelected = selectedSample?.id === s.id;
              return (
                <tr
                  key={s.id}
                  onClick={() => onSelectSample(s)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? isLightMode
                        ? 'bg-[#FFF7ED] text-[#0F172A] border-l-4 border-l-[#F47721]'
                        : 'bg-[#F47721]/15 text-[#F1F5F9] border-l-4 border-l-[#F47721]'
                      : isLightMode
                      ? 'hover:bg-[#F8FAFC] text-[#334155]'
                      : 'hover:bg-white/5 text-[#CBD5E1]'
                  }`}
                >
                  <td className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                    <span className={isLightMode ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}>
                      {s.id}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold whitespace-nowrap text-[#16A36A]">
                    {s.gt_value}
                  </td>
                  <td
                    className={`py-2.5 px-3 font-semibold whitespace-nowrap ${
                      s.is_correct
                        ? isLightMode
                          ? 'text-[#0F172A]'
                          : 'text-white'
                        : 'text-[#DC2626]'
                    }`}
                  >
                    {s.pred_normalized}
                  </td>
                  <td
                    className={`py-2.5 px-3 whitespace-nowrap ${
                      isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'
                    }`}
                  >
                    {(s.raw_confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#F47721] whitespace-nowrap">
                    {(s.calibrated_confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">{getStatusBadge(s.decision)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div
        className={`px-4 py-2.5 border-t text-[11px] font-sans flex items-center justify-between shrink-0 ${
          isLightMode
            ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
            : 'bg-[#111820] border-[#2E3A47] text-[#94A3B8]'
        }`}
      >
        <span>
          Menampilkan{' '}
          <strong className={isLightMode ? 'text-[#0F172A]' : 'text-[#F1F5F9]'}>
            {filtered.length}
          </strong>{' '}
          folder sampel uji
        </span>
        <span className="text-[#F47721] font-semibold">
          Klik baris sampel untuk inspeksi burst citra
        </span>
      </div>
    </div>
  );
};
