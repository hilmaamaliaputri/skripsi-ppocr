import React from 'react';
import { Table, ShieldCheck, Cpu, Check, AlertCircle, TrendingUp } from 'lucide-react';
import type { PPOCRv6Variant } from './ParameterToolbar';

interface ComparisonTableProps {
  currentVariant?: PPOCRv6Variant;
  verificationActive?: boolean;
  onOpenTrainingCurve?: () => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  currentVariant = 'small',
  verificationActive = true,
  onOpenTrainingCurve,
}) => {
  const modelComparisons = [
    {
      variantKey: 'crnn' as PPOCRv6Variant,
      variantName: 'CRNN-CTC (Baseline Klasik)',
      size: '0.12 MB / 25.4 MB',
      latency: '6.4 ms',
      verifMode: 'Nonaktif',
      unlitFilter: 'Nonaktif',
      fsr: '81.7%',
      cer: '4.20%',
      false8: '12 (10.0%)',
      silentError: '8.33%',
      coverage: '100.0%',
      recommendation: 'Baseline klasik, rentan digit hantu tanpa guard',
      isThesisChoice: false,
    },
    {
      variantKey: 'crnn' as PPOCRv6Variant,
      variantName: 'CRNN-CTC + 4-Lapis Guard',
      size: '0.12 MB / 25.4 MB',
      latency: '8.8 ms',
      verifMode: 'Aktif',
      unlitFilter: 'Aktif',
      fsr: '94.2%',
      cer: '0.95%',
      false8: '0 (0.0%)',
      silentError: '0.00%',
      coverage: '89.2%',
      recommendation: 'Verifikasi berhasil mencegah silent error',
      isThesisChoice: false,
    },
    {
      variantKey: 'tiny' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-tiny (Mentah)',
      size: '2.1 MB',
      latency: '4.2 ms',
      verifMode: 'Nonaktif',
      unlitFilter: 'Nonaktif',
      fsr: '78.3%',
      cer: '5.12%',
      false8: '15 (12.5%)',
      silentError: '11.60%',
      coverage: '100.0%',
      recommendation: 'Cepat namun rawan noise pencahayaan',
      isThesisChoice: false,
    },
    {
      variantKey: 'tiny' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-tiny + 4-Lapis Guard',
      size: '2.1 MB',
      latency: '5.8 ms',
      verifMode: 'Aktif',
      unlitFilter: 'Aktif',
      fsr: '92.4%',
      cer: '1.20%',
      false8: '0 (0.0%)',
      silentError: '0.00%',
      coverage: '88.3%',
      recommendation: 'Sangat ideal untuk Raspberry Pi 4 / Edge IPC',
      isThesisChoice: false,
    },
    {
      variantKey: 'small' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-small (Mentah)',
      size: '7.8 MB',
      latency: '11.8 ms',
      verifMode: 'Nonaktif',
      unlitFilter: 'Nonaktif',
      fsr: '85.8%',
      cer: '2.15%',
      false8: '8 (6.7%)',
      silentError: '5.83%',
      coverage: '100.0%',
      recommendation: 'Angka 8 semu masih sering lolos',
      isThesisChoice: false,
    },
    {
      variantKey: 'small' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-small + 4-Lapis (Usulan Skripsi)',
      size: '7.8 MB',
      latency: '13.9 ms',
      verifMode: 'Aktif',
      unlitFilter: 'Aktif',
      fsr: '98.3%',
      cer: '0.42%',
      false8: '0 (0.0%)',
      silentError: '0.00%',
      coverage: '96.7%',
      recommendation: 'Konfigurasi Utama: Akurasi & efisiensi optimal',
      isThesisChoice: true,
    },
    {
      variantKey: 'medium' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-medium (Mentah)',
      size: '18.4 MB',
      latency: '26.4 ms',
      verifMode: 'Nonaktif',
      unlitFilter: 'Nonaktif',
      fsr: '92.5%',
      cer: '1.10%',
      false8: '4 (3.3%)',
      silentError: '2.50%',
      coverage: '100.0%',
      recommendation: 'Akurasi mentah baik, latensi 2x lebih tinggi',
      isThesisChoice: false,
    },
    {
      variantKey: 'medium' as PPOCRv6Variant,
      variantName: 'PP-OCRv6-medium + 4-Lapis Guard',
      size: '18.4 MB',
      latency: '28.6 ms',
      verifMode: 'Aktif',
      unlitFilter: 'Aktif',
      fsr: '99.2%',
      cer: '0.18%',
      false8: '0 (0.0%)',
      silentError: '0.00%',
      coverage: '98.3%',
      recommendation: 'Server-grade / Workstation GPU',
      isThesisChoice: false,
    },
  ];

  return (
    <div className="rounded-xl bg-industrial-900 border border-industrial-800 flex flex-col theme-card overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-industrial-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F47721]/15 border border-[#F47721]/30 flex items-center justify-center text-[#F47721] shrink-0">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-sans font-bold uppercase text-industrial-100 tracking-wider theme-text-primary">
              Tabel Komparasi Model (PP-OCRv6 & CRNN-CTC)
            </h3>
            <p className="text-[11px] font-sans text-industrial-400">
              Evaluasi kinerja pada dataset uji terkunci (n=120 folder, 600 frame).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenTrainingCurve && (
            <button
              onClick={onOpenTrainingCurve}
              className="text-[11px] font-sans px-2.5 py-1 rounded-lg bg-[#F47721]/15 text-[#F47721] hover:bg-[#F47721]/25 border border-[#F47721]/30 flex items-center gap-1.5 font-semibold transition-colors"
              title="Lihat Kurva Konvergensi Pelatihan CRNN-CTC (Loss & Val FSR)"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Kurva Training CRNN-CTC
            </button>
          )}
          <span className="text-[11px] font-sans px-2.5 py-1 rounded-full bg-[#16A36A]/10 text-[#16A36A] dark:text-[#38C98A] border border-[#16A36A]/30 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Bab IV Skripsi
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead className="bg-industrial-950 text-industrial-400 border-b border-industrial-800 text-[11px]">
            <tr>
              <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">Model & Konfigurasi</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Ukuran</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Latensi</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Verifikasi</th>
              <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">FSR</th>
              <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">CER</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Angka 8 Palsu</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Silent Error</th>
              <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">Coverage</th>
              <th className="py-2.5 px-3.5 font-semibold">Rekomendasi Deployment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-800/60 font-mono text-xs">
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
                      ? 'bg-[#16A36A]/10 border-l-4 border-l-[#16A36A] dark:border-l-[#38C98A]'
                      : isActiveVariant
                      ? 'bg-[#F47721]/10 border-l-4 border-l-[#F47721]'
                      : 'hover:bg-industrial-850/50'
                  }`}
                >
                  <td className="py-2.5 px-3.5 font-semibold text-industrial-100 theme-text-primary font-sans whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{row.variantName}</span>
                      {row.isThesisChoice && (
                        <span className="text-[10px] bg-[#16A36A] dark:bg-[#38C98A] text-white px-1.5 py-0.2 rounded font-bold">
                          TERPILIH
                        </span>
                      )}
                      {isActiveVariant && !row.isThesisChoice && (
                        <span className="text-[10px] bg-[#F47721] text-white px-1.5 py-0.2 rounded font-bold">
                          AKTIF
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-industrial-300 whitespace-nowrap">{row.size}</td>
                  <td className="py-2.5 px-3 text-industrial-300 whitespace-nowrap">{row.latency}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
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
                  <td className="py-2.5 px-3 text-center font-bold text-industrial-100 theme-text-primary whitespace-nowrap">
                    {row.fsr}
                  </td>
                  <td className="py-2.5 px-3 text-center text-industrial-300 whitespace-nowrap">{row.cer}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
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
                  <td className="py-2.5 px-3 whitespace-nowrap">
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
                  <td className="py-2.5 px-3 text-center text-industrial-300 whitespace-nowrap">{row.coverage}</td>
                  <td className="py-2.5 px-3.5 text-industrial-400 text-xs font-sans">
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
