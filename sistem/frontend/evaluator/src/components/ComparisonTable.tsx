import React from 'react';
import { Table, ShieldCheck, Cpu, Check, AlertCircle } from 'lucide-react';
import type { PPOCRv6Variant } from './ParameterToolbar';

interface ComparisonTableProps {
  currentVariant?: PPOCRv6Variant;
  verificationActive?: boolean;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  currentVariant = 'small',
  verificationActive = true,
}) => {
  const modelComparisons = [
    {
      variantKey: 'crnn' as PPOCRv6Variant,
      variantName: 'CRNN-CTC (Baseline Klasik SOTA 2016)',
      size: '0.12 MB ONNX / 25.4 MB',
      latency: '6.4 ms',
      verifMode: 'Nonaktif',
      unlitFilter: 'Nonaktif',
      fsr: '81.7%',
      cer: '4.20%',
      false8: '12 sampel (10.0%)',
      silentError: '8.33% (Tinggi)',
      coverage: '100.0%',
      recommendation: 'Baseline pembanding klasik; rawan digit hantu tanpa verifikasi',
      isThesisChoice: false,
    },
    {
      variantKey: 'crnn' as PPOCRv6Variant,
      variantName: 'CRNN-CTC + 4-Lapis Verifikasi',
      size: '0.12 MB ONNX / 25.4 MB',
      latency: '8.8 ms',
      verifMode: 'Aktif (Fail-Fast)',
      unlitFilter: 'Aktif',
      fsr: '94.2%',
      cer: '0.95%',
      false8: '0 sampel (0.0% Lolos)',
      silentError: '0.00% (Aman)',
      coverage: '89.2%',
      recommendation: 'Verifikasi berhasil mencegah silent error pada baseline klasik',
      isThesisChoice: false,
    },
    {
      variantKey: 'tiny' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-tiny (Baseline Mentah)',
      size: '2.1 MB',
      latency: '4.2 ms',
      verifMode: 'Nonaktif',
      unlitFilter: 'Nonaktif',
      fsr: '78.3%',
      cer: '5.12%',
      false8: '15 sampel (12.5%)',
      silentError: '11.6% (Tinggi)',
      coverage: '100.0%',
      recommendation: 'Kurang andal tanpa verifikasi',
      isThesisChoice: false,
    },
    {
      variantKey: 'tiny' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-tiny + 4-Lapis Verifikasi',
      size: '2.1 MB',
      latency: '5.8 ms',
      verifMode: 'Aktif (Fail-Fast)',
      unlitFilter: 'Aktif',
      fsr: '92.4%',
      cer: '1.20%',
      false8: '0 sampel (0.0% Lolos)',
      silentError: '0.00% (Aman)',
      coverage: '88.3%',
      recommendation: 'Cocok untuk IPC Mikro / Raspberry Pi 4',
      isThesisChoice: false,
    },
    {
      variantKey: 'small' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-small (Baseline Mentah)',
      size: '7.8 MB',
      latency: '11.8 ms',
      verifMode: 'Nonaktif',
      unlitFilter: 'Nonaktif',
      fsr: '85.8%',
      cer: '2.15%',
      false8: '8 sampel (6.7%)',
      silentError: '5.83% (Bahaya)',
      coverage: '100.0%',
      recommendation: 'Angka 8 semu masih sering lolos',
      isThesisChoice: false,
    },
    {
      variantKey: 'small' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-small + 4-Lapis Verifikasi (Sistem Usulan Skripsi)',
      size: '7.8 MB',
      latency: '13.9 ms',
      verifMode: 'Aktif (Fail-Fast)',
      unlitFilter: 'Aktif',
      fsr: '98.3%',
      cer: '0.42%',
      false8: '0 sampel (0.0% Lolos)',
      silentError: '0.00% (Aman)',
      coverage: '96.7%',
      recommendation: 'Optimal Pabrik: Akurasi & Efisiensi Terbaik',
      isThesisChoice: true,
    },
    {
      variantKey: 'medium' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-medium (Baseline Mentah)',
      size: '18.4 MB',
      latency: '26.4 ms',
      verifMode: 'Nonaktif',
      unlitFilter: 'Nonaktif',
      fsr: '92.5%',
      cer: '1.10%',
      false8: '4 sampel (3.3%)',
      silentError: '2.50% (Sedang)',
      coverage: '100.0%',
      recommendation: 'Akurasi mentah baik, latensi 2x lebih tinggi',
      isThesisChoice: false,
    },
    {
      variantKey: 'medium' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-medium + 4-Lapis Verifikasi',
      size: '18.4 MB',
      latency: '28.6 ms',
      verifMode: 'Aktif (Fail-Fast)',
      unlitFilter: 'Aktif',
      fsr: '99.2%',
      cer: '0.18%',
      false8: '0 sampel (0.0% Lolos)',
      silentError: '0.00% (Aman)',
      coverage: '98.3%',
      recommendation: 'Server-grade / Workstation GPU/Multi-Core',
      isThesisChoice: false,
    },
  ];

  return (
    <div className="rounded-xl bg-industrial-900 border border-industrial-800 flex flex-col theme-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-industrial-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 shadow-sm">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-sans font-bold uppercase text-industrial-100 tracking-wider theme-text-primary">
              Tabel Komparasi Varian PP-OCRv6 (Tiny vs Small vs Medium)
            </h3>
            <p className="text-[11px] font-sans text-industrial-400 mt-0.5">
              Studi komparasi performa model, latensi CPU, dan efektivitas eliminasi angka '8' palsu pada 120 folder uji (n=120, 600 frame).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-sans px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-800 flex items-center gap-1.5 font-semibold shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> BAB IV SKRIPSI
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead className="bg-industrial-950 text-industrial-400 border-b border-industrial-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Varian Model & Konfigurasi</th>
              <th className="py-3 px-3 font-semibold">Ukuran</th>
              <th className="py-3 px-3 font-semibold">Latensi CPU</th>
              <th className="py-3 px-3 font-semibold">Verifikasi</th>
              <th className="py-3 px-3 text-center font-semibold">FSR (%)</th>
              <th className="py-3 px-3 text-center font-semibold">CER (%)</th>
              <th className="py-3 px-3 font-semibold">Angka '8' Semu</th>
              <th className="py-3 px-3 font-semibold">Silent Error (FAR)</th>
              <th className="py-3 px-3 text-center font-semibold">Coverage</th>
              <th className="py-3 px-4 font-semibold">Rekomendasi Deployment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-800/60 font-mono">
            {modelComparisons.map((row, idx) => {
              const isActiveVariant =
                row.variantKey === currentVariant &&
                (verificationActive
                  ? row.verifMode.startsWith('Aktif')
                  : row.verifMode.startsWith('Nonaktif'));

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    row.isThesisChoice
                      ? 'bg-emerald-950/25 border-l-4 border-l-emerald-500'
                      : isActiveVariant
                      ? 'bg-sky-950/30 border-l-4 border-l-sky-500'
                      : 'hover:bg-industrial-850/50'
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-industrial-100 theme-text-primary font-sans">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{row.variantName}</span>
                      {row.isThesisChoice && (
                        <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          TERPILIH
                        </span>
                      )}
                      {isActiveVariant && !row.isThesisChoice && (
                        <span className="text-[10px] bg-sky-900/80 text-sky-300 border border-sky-700 px-2 py-0.5 rounded-full font-bold">
                          AKTIF
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-industrial-300">{row.size}</td>
                  <td className="py-3.5 px-3 text-industrial-300">{row.latency}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-sans ${
                        row.verifMode.startsWith('Aktif')
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {row.verifMode}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-industrial-100 theme-text-primary">
                    {row.fsr}
                  </td>
                  <td className="py-3.5 px-3 text-center text-industrial-300">{row.cer}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={
                        row.false8.startsWith('0')
                          ? 'text-emerald-400 font-semibold'
                          : 'text-red-400 font-semibold'
                      }
                    >
                      {row.false8}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-semibold ${
                        row.silentError.startsWith('0.00%')
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {row.silentError}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-industrial-300">{row.coverage}</td>
                  <td className="py-3.5 px-4 text-industrial-400 text-xs font-sans">
                    {row.recommendation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Analysis Highlights / Key Academic Insights */}
      <div className="p-4 sm:p-5 bg-industrial-950/70 border-t border-industrial-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <div className="p-4 rounded-xl bg-industrial-900 border border-industrial-800 theme-card shadow-sm">
          <div className="flex items-center gap-2 text-sky-400 font-semibold mb-1.5">
            <Cpu className="w-4 h-4" /> 1. Trade-Off Ukuran vs Latensi
          </div>
          <p className="text-[11px] text-industrial-400 leading-relaxed font-sans">
            <strong>PP-OCRv6-tiny</strong> memiliki latensi 4.2 ms (sangat cepat), namun model <strong>PP-OCRv6-small</strong> (11.8 ms) memberikan lonjakan akurasi representasi teks sebesar <strong>+7.5%</strong> dengan konsumsi RAM yang masih sangat hemat (7.8 MB).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-industrial-900 border border-industrial-800 theme-card shadow-sm">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1.5">
            <Check className="w-4 h-4" /> 2. Mengapa Memilih PP-OCRv6-Small?
          </div>
          <p className="text-[11px] text-industrial-400 leading-relaxed font-sans">
            Varian <strong>small + 4-lapis verifikasi</strong> dipilih sebagai konfigurasi utama skripsi karena mencapai <strong>FSR 98.3%</strong> dan <strong>Coverage 96.7%</strong> pada latensi 13.9 ms, tanpa memerlukan akselerasi GPU server.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-industrial-900 border border-industrial-800 theme-card shadow-sm">
          <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1.5">
            <AlertCircle className="w-4 h-4" /> 3. Eliminasi Angka 8 Semu
          </div>
          <p className="text-[11px] text-industrial-400 leading-relaxed font-sans">
            Pada seluruh varian (tiny, small, medium), model OCR mentah mengalami kebocoran false positive angka 8 (3.3% - 12.5%). Sistem <strong>4-Lapis Verifikasi</strong> menjamin <strong>0.00% Silent Error</strong> lolos ke database pabrik.
          </p>
        </div>
      </div>
    </div>
  );
};
