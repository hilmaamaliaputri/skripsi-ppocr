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
    <header className="border-b border-industrial-800 bg-industrial-900/90 backdrop-blur px-6 py-4 theme-header">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-industrial-800 border border-industrial-700 text-cyan-400 font-mono text-xs font-bold">
              OCR
            </span>
            <h1 className="text-lg font-bold tracking-tight text-white uppercase font-mono theme-text-primary">
              Evaluator Skripsi: PP-OCRv6 Multi-Lapis
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> TEST DATA TERKUNCI (FROZEN)
            </span>
          </div>
          <p className="text-xs text-industrial-400 mt-1 font-mono">
            Harness Evaluasi Metrik Riset: FSR, CER, Akurasi Desimal, Silent Error, & Kurva Risk-Coverage
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Switcher */}
          <button
            onClick={onToggleLightMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-industrial-850 hover:bg-industrial-800 border border-industrial-700 text-xs font-mono text-industrial-200 transition-colors"
            title={isLightMode ? 'Beralih ke Dark Mode' : 'Beralih ke Light Mode'}
          >
            {isLightMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-500" />
                <span>DARK</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>LIGHT</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 bg-industrial-950 border border-industrial-800 px-3 py-1.5 rounded text-xs font-mono text-industrial-400">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dataset: <span className="text-industrial-200 font-semibold theme-text-primary">{manifestName}</span></span>
          </div>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-industrial-850 hover:bg-industrial-800 border border-industrial-700 text-xs font-mono text-industrial-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Tabel LaTeX
          </button>

          <button
            onClick={onRunBenchmark}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-mono font-bold text-white transition-colors border border-cyan-400/30"
          >
            <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'MEMPROSES...' : 'RUN BENCHMARK'}
          </button>
        </div>
      </div>
    </header>
  );
};
