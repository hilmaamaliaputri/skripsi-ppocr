import React from 'react';
import {
  BarChart3,
  Layers,
  Search,
  ShieldCheck,
  FileText,
  Sun,
  Moon,
  Database,
  Cpu,
  Cloud,
  ExternalLink,
  TrendingUp,
  ClipboardCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'overview' | 'comparison' | 'inspector' | 'tracker';
  onChangeTab: (tab: 'overview' | 'comparison' | 'inspector' | 'tracker') => void;
  sampleCount: number;
  manifestName: string;
  isLightMode: boolean;
  onToggleLightMode: () => void;
  onOpenExport: () => void;
  onOpenTrainingCurve: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  sampleCount,
  manifestName,
  isLightMode,
  onToggleLightMode,
  onOpenExport,
  onOpenTrainingCurve,
}) => {
  const navItems = [
    { id: 'overview' as const, label: 'Metrik & Kurva', icon: BarChart3, badge: null },
    { id: 'comparison' as const, label: 'Komparasi Model', icon: Layers, badge: '6 Model' },
    { id: 'inspector' as const, label: 'Inspektur Sampel', icon: Search, badge: `${sampleCount}` },
    { id: 'tracker' as const, label: 'Pelacakan Eksperimen', icon: ClipboardCheck, badge: '24/24' },
  ];

  const mutedText = isLightMode ? 'text-[#475569]' : 'text-[#94A3B8]';
  const strongText = isLightMode ? 'text-[#0F172A]' : 'text-[#F8FAFC]';
  const borderCol = isLightMode ? 'border-[#CBD5E1]' : 'border-[#2B3948]';

  return (
    <aside
      className={`w-full md:w-64 lg:w-[276px] shrink-0 border-b md:border-b-0 md:border-r transition-colors duration-200 flex flex-col justify-between md:h-screen md:sticky md:top-0 md:overflow-y-auto z-30 ${
        isLightMode ? `bg-white ${borderCol} ${strongText}` : `bg-[#151E28] ${borderCol} ${strongText}`
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono text-xs font-bold shrink-0 bg-[#F47721]/20 border border-[#F47721]/50 text-[#F47721] shadow-xs">
            OCR
          </span>
          <div className="min-w-0">
            <h1 className={`text-xs sm:text-sm font-bold tracking-tight uppercase font-mono truncate ${strongText}`}>
              Evaluator Skripsi
            </h1>
            <p className={`text-[10px] font-sans truncate ${mutedText}`}>6 Model &bull; 4-Lapis Verifikasi</p>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible" aria-label="Menu utama evaluator">
          <div className={`hidden md:block text-[10px] uppercase font-mono tracking-wider font-semibold px-2 pb-1 ${mutedText}`}>
            Navigasi Analisis
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-sans transition-all text-left shrink-0 md:shrink md:w-full ${
                  isActive
                    ? 'bg-[#F47721] hover:bg-[#FF974D] text-white font-semibold shadow-xs'
                    : isLightMode
                    ? 'text-[#475569] hover:text-[#202832] hover:bg-[#F1F5F9] font-medium'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#F47721]'}`} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold shrink-0 ${
                      isActive
                        ? 'bg-black/25 text-white'
                        : isLightMode
                        ? 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                        : 'bg-[#2E3A47] text-[#94A3B8]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className={`hidden md:flex flex-col gap-2 pt-2 border-t ${borderCol}`}>
          <div className={`text-[10px] uppercase font-mono tracking-wider font-semibold px-2 ${mutedText}`}>
            Arsitektur Sistem
          </div>
          <div
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-sans ${
              isLightMode ? 'bg-[#FFF7ED] border border-[#FFEDD5]' : 'bg-[#F47721]/10 border border-[#F47721]/25'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[#F47721] font-semibold">
              <Cpu className="w-3.5 h-3.5" aria-hidden="true" /> Edge Processing
            </span>
            <span className={`font-mono text-[10px] ${isLightMode ? 'text-[#C2410C]' : 'text-[#FF974D]'}`}>ONNX CPU</span>
          </div>
          <div
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-sans ${
              isLightMode ? 'bg-[#EFF6FF] border border-[#DBEAFE]' : 'bg-[#3B82F6]/10 border border-[#3B82F6]/25'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[#3B82F6] font-semibold">
              <Cloud className="w-3.5 h-3.5" aria-hidden="true" /> Cloud Telemetry
            </span>
            <span className={`font-mono text-[10px] ${isLightMode ? 'text-[#1D4ED8]' : 'text-[#60A5FA]'}`}>Sync Ready</span>
          </div>

          <div className="pt-2 flex flex-col gap-1.5">
            <a
              href="/operator"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-colors border ${
                isLightMode
                  ? 'bg-[#FFF7ED] text-[#C2410C] hover:bg-[#FFEDD5] border-[#FFEDD5]'
                  : 'bg-[#F47721]/15 text-[#FF974D] hover:bg-[#F47721]/25 border-[#F47721]/30'
              }`}
              title="Buka Stasiun Timbangan Web Operator (/operator)"
            >
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[#F47721]" aria-hidden="true" /> Web Operator
              </span>
              <span className="font-mono text-[10px] px-1 rounded bg-[#F47721] text-white">UI</span>
            </a>

            <button
              type="button"
              onClick={onOpenTrainingCurve}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-colors border text-left ${
                isLightMode
                  ? 'bg-white hover:bg-[#F8FAFC] text-[#202832] border-[#E2E8F0]'
                  : 'bg-[#222D38] hover:bg-[#2E3A47] text-[#F1F5F9] border-[#2E3A47]'
              }`}
              title="Lihat Kurva Training CRNN-CTC (50 Epoch)"
            >
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#16A36A]" aria-hidden="true" /> Kurva CRNN
              </span>
              <span className="font-mono text-[10px] text-[#16A36A]">50 Ep</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`p-4 border-t flex flex-col gap-3 ${borderCol}`}>
        <div
          className={`p-2.5 rounded-lg border text-xs font-sans flex flex-col gap-1 ${
            isLightMode ? `bg-[#F8FAFC] ${borderCol} ${strongText}` : `bg-black/20 ${borderCol} ${strongText}`
          }`}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold">
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isLightMode ? 'text-[#16A36A]' : 'text-[#38C98A]'}`} aria-hidden="true" />
            <span className={isLightMode ? 'text-[#16A36A]' : 'text-[#38C98A]'}>TEST SET TERKUNCI</span>
          </div>
          <div className={`flex items-start gap-1.5 text-[11px] ${mutedText}`}>
            <Database className="w-3 h-3 text-[#F47721] shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-snug break-words">
              Dataset: <strong className={strongText}>{manifestName}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenExport}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all border ${
              isLightMode ? `bg-white hover:bg-[#F8FAFC] ${borderCol} ${strongText} shadow-xs` : `bg-[#2E3A47]/70 hover:bg-[#2E3A47] ${borderCol} ${strongText}`
            }`}
            title="Ekspor tabel LaTeX Bab IV"
          >
            <FileText className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
            <span>LaTeX</span>
          </button>

          <button
            type="button"
            onClick={onToggleLightMode}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans transition-all border ${
              isLightMode ? `bg-white hover:bg-[#F8FAFC] ${borderCol} ${strongText} shadow-xs` : `bg-[#2E3A47]/70 hover:bg-[#2E3A47] ${borderCol} ${strongText}`
            }`}
            title={isLightMode ? 'Beralih ke Dark Mode' : 'Beralih ke Light Mode'}
          >
            {isLightMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[#3B82F6]" aria-hidden="true" />
                <span className="font-semibold text-[#202832]">Gelap</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-[#F47721]" aria-hidden="true" />
                <span className="font-medium text-[#F1F5F9]">Terang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
