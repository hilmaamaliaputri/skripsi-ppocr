import React, { useState } from 'react';
import { Table, ChevronDown, ChevronUp, ShieldCheck, Check } from 'lucide-react';

export const ComparisonTable: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const comparisonData = [
    {
      name: '1. Baseline Standar (Tanpa Verifikasi)',
      limit: '960 px',
      thresh: '0.30',
      unlitFilter: 'Nonaktif',
      verifLayers: 'Nonaktif',
      fsr: '91.2%',
      cer: '3.42%',
      false8Count: '12 sampel (10.0%)',
      silentError: '8.33% (Bahaya)',
      coverage: '100.0%',
      isHighlighted: false,
    },
    {
      name: '2. PP-OCRv6 + Rescaling & Ambang DB',
      limit: '720 px',
      thresh: '0.55',
      unlitFilter: 'Nonaktif',
      verifLayers: 'Nonaktif',
      fsr: '94.8%',
      cer: '1.85%',
      false8Count: '4 sampel (3.3%)',
      silentError: '3.10%',
      coverage: '100.0%',
      isHighlighted: false,
    },
    {
      name: '3. Sistem Usulan (PP-OCRv6 + Filter Unlit + 4-Lapis)',
      limit: '720 px',
      thresh: '0.55',
      unlitFilter: 'Aktif',
      verifLayers: 'Aktif (Fail-Fast)',
      fsr: '98.3%',
      cer: '0.42%',
      false8Count: '0 sampel (0.0% Tereliminasi)',
      silentError: '0.00% (Aman)',
      coverage: '96.7%',
      isHighlighted: true,
    },
  ];

  return (
    <div className="rounded bg-industrial-900 border border-industrial-800 flex flex-col theme-card">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 border-b border-industrial-800 flex items-center justify-between cursor-pointer hover:bg-industrial-850/50 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <Table className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider theme-text-primary">
              Tabel Komparasi Ilmiah & Studi Ablasi (Bab IV Skripsi)
            </h3>
            <p className="text-[11px] font-mono text-industrial-400 mt-0.5">
              Perbandingan performa model PP-OCRv6 sebelum dan sesudah penanganan segmen padam & verifikasi 4-lapis (n=120).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> ABLASI LENGKAP
          </span>
          <button className="p-1 rounded text-industrial-400 hover:text-white">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Table */}
      {isExpanded && (
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-industrial-950 text-industrial-400 border-b border-industrial-800">
              <tr>
                <th className="py-2.5 px-3">Konfigurasi Pengujian</th>
                <th className="py-2.5 px-3">Limit Sisi</th>
                <th className="py-2.5 px-3">Ambang DB</th>
                <th className="py-2.5 px-3">Filter Unlit</th>
                <th className="py-2.5 px-3">Verifikasi Lapis</th>
                <th className="py-2.5 px-3">FSR (%)</th>
                <th className="py-2.5 px-3">CER (%)</th>
                <th className="py-2.5 px-3">Kemunculan Angka '8' Palsu</th>
                <th className="py-2.5 px-3">Silent Error</th>
                <th className="py-2.5 px-3 text-right">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {comparisonData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    row.isHighlighted
                      ? 'bg-emerald-950/30 text-emerald-200 font-semibold border-l-2 border-emerald-500'
                      : 'hover:bg-industrial-850/50 text-industrial-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5 theme-text-primary">
                    {row.isHighlighted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    {row.name}
                  </td>
                  <td className="py-2.5 px-3 text-industrial-400">{row.limit}</td>
                  <td className="py-2.5 px-3 text-industrial-400">{row.thresh}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        row.unlitFilter === 'Aktif'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-industrial-950 text-industrial-400 border border-industrial-800'
                      }`}
                    >
                      {row.unlitFilter}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-industrial-300">{row.verifLayers}</td>
                  <td className="py-2.5 px-3 font-bold text-white theme-text-primary">{row.fsr}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{row.cer}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-bold ${
                        row.false8Count.includes('0') ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {row.false8Count}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-bold ${
                        row.silentError.includes('0.00%') ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {row.silentError}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-400">{row.coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 p-2.5 rounded bg-industrial-950 border border-industrial-800 text-[11px] font-mono text-industrial-400 flex items-start gap-2">
            <span className="font-bold text-cyan-300">Catatan Analisis:</span>
            <span>
              Segmen padam 7-segmen (*unlit*) yang membentuk pola '8' dieliminasi secara total oleh kombinasi
              **Filter Unlit Otsu + Profil Slot OpenCV (Lapis 1)** dan **Toleransi Bobot Produk (Lapis 2)**. Silent Error
              berhasil ditekan hingga <strong>0.00%</strong> tanpa menurunkan cakupan otomatis (*coverage* {'>'} 95%).
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
