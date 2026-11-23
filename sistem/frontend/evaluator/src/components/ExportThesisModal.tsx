import React, { useEffect, useState } from 'react';
import type { BenchmarkResponse } from '../types/evaluator';
import { fetchComparisonMatrix } from '../services/api';
import { X, Copy, Check, Code, FileText } from 'lucide-react';

interface ExportThesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BenchmarkResponse;
}

export const ExportThesisModal: React.FC<ExportThesisModalProps> = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState<'latex_metrics' | 'latex_comparison' | 'markdown'>('latex_metrics');
  const [copied, setCopied] = useState(false);
  const [matrixRows, setMatrixRows] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetchComparisonMatrix().then((rows) => {
      if (Array.isArray(rows)) setMatrixRows(rows);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const m = data.metrics;
  const c = data.calibration;

  const fsrVal = typeof m?.fsr === 'number' ? m.fsr.toFixed(2) : '0.00';
  const cerVal = typeof m?.cer === 'number' ? m.cer.toFixed(2) : '0.00';
  const decimalVal = typeof m?.decimal_acc === 'number' ? m.decimal_acc.toFixed(2) : '0.00';
  const silentVal = typeof m?.silent_error === 'number' ? m.silent_error.toFixed(2) : '0.00';
  const covVal = typeof m?.coverage === 'number' ? m.coverage.toFixed(2) : '0.00';
  const selVal = typeof m?.selective_acc === 'number' ? m.selective_acc.toFixed(2) : '0.00';
  const aurcVal = typeof data?.risk_coverage?.aurc === 'number' ? data.risk_coverage.aurc.toFixed(4) : '0.0000';
  const eceVal = typeof c?.ece_after === 'number' ? c.ece_after.toFixed(4) : '0.0000';
  const tVal = typeof c?.optimal_temperature === 'number' ? c.optimal_temperature.toFixed(2) : '1.00';
  const p50Val = typeof m?.latency_p50_ms === 'number' ? m.latency_p50_ms.toFixed(2) : '0.00';
  const p95Val = typeof m?.latency_p95_ms === 'number' ? m.latency_p95_ms.toFixed(2) : '0.00';

  const fsrLower = typeof m?.bootstrap_ci?.fsr?.lower === 'number' ? m.bootstrap_ci.fsr.lower.toFixed(2) : fsrVal;
  const fsrUpper = typeof m?.bootstrap_ci?.fsr?.upper === 'number' ? m.bootstrap_ci.fsr.upper.toFixed(2) : fsrVal;
  const cerLower = typeof m?.bootstrap_ci?.cer?.lower === 'number' ? m.bootstrap_ci.cer.lower.toFixed(2) : cerVal;
  const cerUpper = typeof m?.bootstrap_ci?.cer?.upper === 'number' ? m.bootstrap_ci.cer.upper.toFixed(2) : cerVal;
  const silentLower = typeof m?.bootstrap_ci?.silent_error?.lower === 'number' ? m.bootstrap_ci.silent_error.lower.toFixed(2) : silentVal;
  const silentUpper = typeof m?.bootstrap_ci?.silent_error?.upper === 'number' ? m.bootstrap_ci.silent_error.upper.toFixed(2) : silentVal;

  const latexMetrics = `% --- Tabel 4.1: Evaluasi Kinerja Sistem OCR + Verifikasi Multi-Lapis ---
\\begin{table}[htbp]
\\centering
\\caption{Hasil Pengujian Sistem OCR Timbangan Digital ($n=${data.sample_count}$)}
\\label{tab:hasil_evaluasi_ocr}
\\begin{tabular}{l c c}
\\hline
\\textbf{Metrik Evaluasi} & \\textbf{Nilai} & \\textbf{95\\% Confidence Interval} \\\\
\\hline
Full Sequence Recognition (FSR) & ${fsrVal}\\% & [${fsrLower}\\% - ${fsrUpper}\\%] \\\\
Character Error Rate (CER) & ${cerVal}\\% & [${cerLower}\\% - ${cerUpper}\\%] \\\\
Akurasi Titik Desimal & ${decimalVal}\\% & - \\\\
Silent Error Rate (FAR) & ${silentVal}\\% & [${silentLower}\\% - ${silentUpper}\\%] \\\\
Coverage Otomatis (TERIMA) & ${covVal}\\% & - \\\\
Selective Accuracy & ${selVal}\\% & - \\\\
AURC (Risk-Coverage) & ${aurcVal} & - \\\\
Expected Calibration Error (ECE) & ${eceVal} & ($T^* = ${tVal}$) \\\\
Latensi Eksekusi ($p_{50}$ / $p_{95}$) & ${p50Val} / ${p95Val} ms & - \\\\
\\hline
\\end{tabular}
\\end{table}`;

  const latexRows = matrixRows
    .map(
      (r) =>
        `${String(r.variantName || '').replace(/%/g, '\\%')} & ${r.latency} & ${String(r.fsr || '').replace(/%/g, '\\%')} & ${String(r.cer || '').replace(/%/g, '\\%')} & ${String(r.coverage || '-').replace(/%/g, '\\%')} & ${String(r.silentError || '').replace(/%/g, '\\%')} \\\\`
    )
    .join('\n');

  const latexComparison = `% --- Tabel 4.2: Matriks Komparasi 6 Model OCR (n=755 Citra Terkunci) ---
\\begin{table}[htbp]
\\centering
\\caption{Perbandingan Kinerja 6 Arsitektur OCR: Sebelum vs Sesudah Verifikasi 4-Lapis ($n=755$)}
\\label{tab:komparasi_6_model}
\\begin{tabular}{l c c c c c}
\\hline
\\textbf{Konfigurasi Model} & \\textbf{Latensi CPU} & \\textbf{FSR [95\\% CI]} & \\textbf{CER} & \\textbf{Coverage} & \\textbf{Silent Error} \\\\
\\hline
${latexRows || '% Data belum dimuat dari /api/eval/comparison-matrix'}
\\hline
\\end{tabular}
\\end{table}`;

  const mdRows = matrixRows
    .map(
      (r) =>
        `| ${r.variantName} | ${r.latency} | ${r.fsr} | ${r.cer} | ${r.coverage || '-'} | ${r.selectiveAcc || '-'} | ${r.silentError} | ${r.aurc || '-'} |`
    )
    .join('\n');

  const markdownContent = `### Tabel Komparasi 6 Model OCR ($n = 755$ Citra Terkunci)

| Konfigurasi Model | Latensi CPU | FSR [95% CI] | CER | Coverage | Sel. Acc | Silent Error | AURC |
|---|---:|---:|---:|---:|---:|---:|---:|
${mdRows || '| - | - | - | - | - | - | - | - |'}
`;

  const getActiveContent = () => {
    switch (activeTab) {
      case 'latex_metrics':
        return latexMetrics;
      case 'latex_comparison':
        return latexComparison;
      case 'markdown':
        return markdownContent;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-lg bg-industrial-900 border border-industrial-700 shadow-2xl flex flex-col max-h-[85vh] theme-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-industrial-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <h3 className="text-sm font-mono font-bold uppercase text-industrial-100 theme-text-primary">
              Ekspor Tabel untuk Bab IV Skripsi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal ekspor"
            className="p-1 rounded text-industrial-400 hover:text-white hover:bg-industrial-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-3 flex flex-wrap items-center justify-between gap-2 border-b border-industrial-800">
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                { id: 'latex_metrics', label: 'LaTeX Metrik', icon: Code },
                { id: 'latex_comparison', label: 'LaTeX 6 Model', icon: Code },
                { id: 'markdown', label: 'Markdown 6 Model', icon: FileText },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 pb-2 text-xs font-mono border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#F47721] text-[#F47721] font-bold'
                      : 'border-transparent text-industrial-400 hover:text-industrial-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 mb-2 rounded bg-[#F47721] hover:bg-[#FF974D] text-white text-xs font-mono font-bold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-industrial-300 bg-industrial-950">
          <pre className="whitespace-pre-wrap selection:bg-[#F47721]/40 selection:text-white">
            {getActiveContent()}
          </pre>
        </div>
      </div>
    </div>
  );
};
