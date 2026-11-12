import React from 'react';
import { Play, ShieldCheck, Cpu, Cloud } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'comparison' | 'inspector';
  isLoading: boolean;
  onRunBenchmark: () => void;
  manifestName: string;
  isLightMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isLoading,
  onRunBenchmark,
  manifestName,
  isLightMode,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Dashboard Metrik & Analisis Kurva';
      case 'comparison':
        return 'Studi Komparasi Model (PP-OCRv6 & CRNN-CTC)';
      case 'inspector':
        return 'Inspektur Sampel & Drill-Down Verifikasi';
    }
  };

  return (
    <header
      className={`border-b px-4 sm:px-6 py-2.5 transition-colors duration-200 sticky top-0 z-20 ${
        isLightMode
          ? 'bg-white border-[#E2E8F0] shadow-xs'
          : 'bg-[#171F28]/95 border-[#2E3A47] backdrop-blur-md'
      }`}
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        {/* Active View Title & Technology Badges */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              className={`text-sm sm:text-base font-bold tracking-tight uppercase font-mono truncate ${
                isLightMode ? 'text-[#202832]' : 'text-[#F1F5F9]'
              }`}
            >
              {getTabTitle()}
            </h2>

            {/* Frozen Test Set Badge */}
            <span
              className={`hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full items-center gap-1 font-semibold shrink-0 border ${
                isLightMode
                  ? 'bg-[#ECFDF5] text-[#16A36A] border-[#A7F3D0]'
                  : 'bg-[#16A36A]/10 text-[#38C98A] border-[#38C98A]/30'
              }`}
            >
              <ShieldCheck className="w-3 h-3" /> FROZEN TEST SET
            </span>

            {/* Edge Processing Badge (Selective Orange) */}
            <span className="hidden lg:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full items-center gap-1 font-semibold shrink-0 bg-[#F47721]/10 text-[#F47721] border border-[#F47721]/30">
              <Cpu className="w-3 h-3 text-[#F47721]" /> EDGE OCR
            </span>

            {/* Cloud Process Badge (Cloud Blue) */}
            <span className="hidden xl:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full items-center gap-1 font-semibold shrink-0 bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30">
              <Cloud className="w-3 h-3 text-[#3B82F6]" /> HYBRID TELEMETRY
            </span>
          </div>

          <p
            className={`text-[11px] font-sans truncate hidden sm:block mt-0.5 ${
              isLightMode ? 'text-[#64748B]' : 'text-[#94A3B8]'
            }`}
          >
            Evaluasi Benchmark: 120 folder uji ({manifestName}) &bull; PP-OCRv6 Tiny, Small, Medium & CRNN-CTC
          </p>
        </div>

        {/* Action Controls - Benchmark in Signal Orange */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onRunBenchmark}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#F47721] hover:bg-[#FF974D] disabled:opacity-50 text-xs font-sans font-semibold text-white transition-all shadow-sm active:scale-[0.98] min-w-[115px]"
          >
            <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Memproses...' : 'Benchmark'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
