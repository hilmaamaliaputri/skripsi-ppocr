import React from 'react';
import { ShieldCheck, Play, FileText, Database, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isLoading: boolean;
  onRunBenchmark: () => void;
  onOpenExport: () => void;
  manifestName: string;
  isLightMode: boolean;
  onToggleLightMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLoading,
  onRunBenchmark,
  onOpenExport,
  manifestName,
  isLightMode,
  onToggleLightMode,
}) => {
  return (
    <header className="border-b border-industrial-800 bg-industrial-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5 theme-header transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 max-w-7xl mx-auto">
        {/* Title & Brand */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-500 dark:text-sky-400 font-mono text-xs font-bold shadow-sm">
              OCR
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase font-mono theme-text-primary">
              Evaluator Skripsi: PP-OCRv6 Multi-Lapis
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-medium shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> TEST SET TERKUNCI (FROZEN)
            </span>
          </div>
          <p className="text-xs text-industrial-400 mt-1 font-sans">
            Harness Evaluasi Metrik Riset: FSR, CER, Akurasi Desimal, Silent Error, & Kurva Risk-Coverage
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Light / Dark Mode Switcher */}
          <button
            onClick={onToggleLightMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-industrial-850 hover:bg-industrial-800 border border-industrial-700 text-xs font-sans text-industrial-200 transition-colors shadow-sm"
            title={isLightMode ? 'Beralih ke Dark Mode' : 'Beralih ke Light Mode'}
          >
            {isLightMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-medium text-slate-700">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">Light Mode</span>
              </>
            )}
          </button>

          {/* Dataset Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-industrial-950 border border-industrial-800 px-3 py-1.5 rounded-lg text-xs font-sans text-industrial-400 shadow-sm">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Dataset: <strong className="text-industrial-200 font-medium theme-text-primary">{manifestName}</strong></span>
          </div>

          {/* LaTeX Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-industrial-850 hover:bg-industrial-800 border border-industrial-700 text-xs font-sans font-medium text-industrial-200 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Tabel LaTeX</span>
          </button>

          {/* Run Benchmark Button */}
          <button
            onClick={onRunBenchmark}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs font-sans font-semibold text-white transition-all shadow-sm border border-sky-400/20 active:scale-[0.98]"
          >
            <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Memproses...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
