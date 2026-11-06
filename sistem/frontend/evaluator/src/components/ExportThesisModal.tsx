import React, { useState } from 'react';
import type { BenchmarkResponse } from '../types/evaluator';
import { X, Copy, Check, Code, FileText } from 'lucide-react';

interface ExportThesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BenchmarkResponse;
}

export const ExportThesisModal: React.FC<ExportThesisModalProps> = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState<'latex' | 'markdown'>('latex');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const m = data.metrics;
  const c = data.calibration;

  const latexCode = `% --- Tabel Evaluasi Kinerja PP-OCRv6 + Verifikasi Multi-Lapis ---
% Bab IV: Hasil dan Pembahasan Skripsi
\\begin{table}[htbp]
\\centering
\\caption{Hasil Pengujian Kinerja Sistem OCR Timbangan Digital 7-Segmen ($n=${data.sample_count}$)}
\\label{tab:hasil_evaluasi_ocr}
\\begin{tabular}{l c c}
\\hline
\\textbf{Metrik Evaluasi} & \\textbf{Nilai} & \\textbf{95\\% Confidence Interval} \\\\
\\hline
Full Sequence Recognition (FSR) & ${m.fsr.toFixed(1)}\\% & [${m.bootstrap_ci?.fsr.lower.toFixed(1)}\\% - ${m.bootstrap_ci?.fsr.upper.toFixed(1)}\\%] \\\\
Character Error Rate (CER) & ${m.cer.toFixed(2)}\\% & [${m.bootstrap_ci?.cer.lower.toFixed(2)}\\% - ${m.bootstrap_ci?.cer.upper.toFixed(2)}\\%] \\\\
Akurasi Titik Desimal & ${m.decimal_acc.toFixed(1)}\\% & - \\\\
Silent Error Rate & ${m.silent_error.toFixed(2)}\\% & [${m.bootstrap_ci?.silent_error.lower.toFixed(2)}\\% - ${m.bootstrap_ci?.silent_error.upper.toFixed(2)}\\%] \\\\
Coverage Otomatis (TERIMA) & ${m.coverage.toFixed(1)}\\% & - \\\\
Selective Accuracy & ${m.selective_acc.toFixed(1)}\\% & - \\\\
AURC (Risk-Coverage) & ${data.risk_coverage.aurc.toFixed(4)} & - \\\\
Expected Calibration Error (ECE) & ${c.ece_after.toFixed(4)} & ($T^* = ${c.optimal_temperature.toFixed(2)}$) \\\\
Latensi Eksekusi ($p50$) & ${m.latency_p50_ms.toFixed(1)} ms & - \\\\
Latensi Eksekusi ($p95$) & ${m.latency_p95_ms.toFixed(1)} ms & - \\\\
\\hline
\\end{tabular}
\\end{table}`;

  const markdownCode = `### Tabel Hasil Evaluasi Kinerja PP-OCRv6 (Dataset: ${data.manifest_name}, n=${data.sample_count})

| Metrik Evaluasi | Nilai | 95% Confidence Interval |
|---|:---:|:---:|
| **Full Sequence Recognition (FSR)** | ${m.fsr.toFixed(1)}% | [${m.bootstrap_ci?.fsr.lower.toFixed(1)}% - ${m.bootstrap_ci?.fsr.upper.toFixed(1)}%] |
| **Character Error Rate (CER)** | ${m.cer.toFixed(2)}% | [${m.bootstrap_ci?.cer.lower.toFixed(2)}% - ${m.bootstrap_ci?.cer.upper.toFixed(2)}%] |
| **Akurasi Titik Desimal** | ${m.decimal_acc.toFixed(1)}% | - |
| **Silent Error Rate** | ${m.silent_error.toFixed(2)}% | [${m.bootstrap_ci?.silent_error.lower.toFixed(2)}% - ${m.bootstrap_ci?.silent_error.upper.toFixed(2)}%] |
| **Coverage Otomatis** | ${m.coverage.toFixed(1)}% | - |
| **Selective Accuracy** | ${m.selective_acc.toFixed(1)}% | - |
| **AURC** | ${data.risk_coverage.aurc.toFixed(4)} | - |
| **ECE (Kalibrasi Platt)** | ${c.ece_after.toFixed(4)} | Optimal T* = ${c.optimal_temperature.toFixed(2)} |
| **Latensi p50 / p95** | ${m.latency_p50_ms.toFixed(1)} ms / ${m.latency_p95_ms.toFixed(1)} ms | - |
`;

  const currentContent = activeTab === 'latex' ? latexCode : markdownCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded bg-industrial-900 border border-industrial-700 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-industrial-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-mono font-bold uppercase text-white">
              Ekspor Tabel Evaluasi untuk Bab IV Skripsi
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-industrial-400 hover:text-white hover:bg-industrial-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-4 pt-3 flex items-center justify-between border-b border-industrial-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('latex')}
              className={`flex items-center gap-1.5 pb-2 text-xs font-mono border-b-2 transition-colors ${
                activeTab === 'latex'
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-industrial-400 hover:text-industrial-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Format LaTeX (.tex)
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`flex items-center gap-1.5 pb-2 text-xs font-mono border-b-2 transition-colors ${
                activeTab === 'markdown'
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-industrial-400 hover:text-industrial-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Format Markdown (.md)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 mb-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-mono font-bold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'TERSALIN!' : 'SALIN TEKS'}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-industrial-300 bg-industrial-950">
          <pre className="whitespace-pre-wrap selection:bg-cyan-800 selection:text-white">
            {currentContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
