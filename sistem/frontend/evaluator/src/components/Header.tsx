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
    <header className={`border-b px-4 sm:px-6 py-3.5 transition-colors duration-200 sticky top-0 z-30 ${
      isLightMode
        ? 'bg-white/95 border-slate-200 shadow-sm backdrop-blur-md'
        : 'bg-black/95 border-zinc-800 backdrop-blur-md'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 max-w-7xl mx-auto">
        {/* Title & Brand */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono text-xs font-bold shadow-xs ${
              isLightMode
                ? 'bg-sky-50 border border-sky-200 text-sky-700'
                : 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
            }`}>
              OCR
            </span>
            <h1 className={`text-base sm:text-lg font-bold tracking-tight uppercase font-mono ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              Evaluator Skripsi: PP-OCRv6 Multi-Lapis
            </h1>
            <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium shadow-xs ${
              isLightMode
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> TEST SET TERKUNCI (FROZEN)
            </span>
          </div>
          <p className={`text-xs mt-1 font-sans ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            Harness Evaluasi Metrik Riset: FSR, CER, Akurasi Desimal, Silent Error, & Kurva Risk-Coverage
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Light / Dark Mode Switcher */}
          <button
            onClick={onToggleLightMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all shadow-xs ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-medium'
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200'
            }`}
            title={isLightMode ? 'Beralih ke Dark Mode' : 'Beralih ke Light Mode'}
          >
            {isLightMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-semibold text-slate-800">Mode Gelap</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium text-zinc-200">Mode Terang</span>
              </>
            )}
          </button>

          {/* Dataset Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans shadow-xs ${
            isLightMode
              ? 'bg-slate-100 border border-slate-200 text-slate-600'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
          }`}>
            <Database className="w-3.5 h-3.5 text-sky-500" />
            <span>Dataset: <strong className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-zinc-200'}`}>{manifestName}</strong></span>
          </div>

          {/* LaTeX Export Button */}
          <button
            onClick={onOpenExport}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all shadow-xs ${
              isLightMode
                ? 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900'
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Tabel LaTeX</span>
          </button>

          {/* Run Benchmark Button */}
          <button
            onClick={onRunBenchmark}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs font-sans font-semibold text-white transition-all shadow-sm active:scale-[0.98]"
          >
            <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Memproses...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
