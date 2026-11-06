import React from 'react';
import { Sliders, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export interface ModelParameters {
  det_limit_side_len: number;
  det_db_thresh: number;
  unlit_filter_mode: 'aktif' | 'nonaktif';
}

interface ParameterToolbarProps {
  parameters: ModelParameters;
  onChangeParameters: (params: ModelParameters) => void;
  onApplyOptimalPreset: () => void;
  onApplyBaselinePreset: () => void;
  isOptimal: boolean;
}

export const ParameterToolbar: React.FC<ParameterToolbarProps> = ({
  parameters,
  onChangeParameters,
  onApplyOptimalPreset,
  onApplyBaselinePreset,
  isOptimal,
}) => {
  return (
    <div className="p-4 rounded bg-industrial-900 border border-industrial-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 theme-card">
      {/* Title & Info */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-white tracking-wider theme-text-primary">
              Tuning 3 Parameter PP-OCRv6 (Penanganan Segmen Padam)
            </span>
            {isOptimal ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> PRESET OPTIMAL
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> BASELINE MENTAH (FALSE '8' MUNCUL)
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-industrial-400 mt-0.5">
            Uji ablasi dampak limit deteksi, ambang DBNet, dan filter segmen unlit terhadap pembacaan display.
          </p>
        </div>
      </div>

      {/* 3 Parameter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Detection Limit Side Len */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-industrial-400 uppercase font-semibold">
            1. Limit Sisi (det_limit):
          </label>
          <select
            value={parameters.det_limit_side_len}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                det_limit_side_len: parseInt(e.target.value, 10),
              })
            }
            className="bg-industrial-950 border border-industrial-800 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value={720}>720 px (Optimal Timbangan)</option>
            <option value={480}>480 px (Kompresi Rendah)</option>
            <option value={960}>960 px (Standar PaddleOCR)</option>
          </select>
        </div>

        {/* 2. DBNet Binarization Threshold */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-industrial-400 uppercase font-semibold">
            2. Ambang DBNet (det_thresh):
          </label>
          <select
            value={parameters.det_db_thresh}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                det_db_thresh: parseFloat(e.target.value),
              })
            }
            className="bg-industrial-950 border border-industrial-800 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value={0.55}>0.55 (Ketat - Anti Segmen Padam)</option>
            <option value={0.30}>0.30 (Default Standar - Sensitif)</option>
            <option value={0.70}>0.70 (Agresif - Kontras Tinggi)</option>
          </select>
        </div>

        {/* 3. Unlit Segment Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-industrial-400 uppercase font-semibold">
            3. Filter Segmen Padam:
          </label>
          <select
            value={parameters.unlit_filter_mode}
            onChange={(e) =>
              onChangeParameters({
                ...parameters,
                unlit_filter_mode: e.target.value as 'aktif' | 'nonaktif',
              })
            }
            className={`border rounded px-2.5 py-1 text-xs font-mono font-bold focus:outline-none cursor-pointer ${
              parameters.unlit_filter_mode === 'aktif'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-industrial-950 text-red-300 border-red-800'
            }`}
          >
            <option value="aktif">Aktif (Otsu Offset + Profiler)</option>
            <option value="nonaktif">Nonaktif (Mentah - Muncul '8')</option>
          </select>
        </div>

        {/* Preset Action Buttons */}
        <div className="flex items-center gap-2 pt-4">
          <button
            onClick={onApplyOptimalPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs font-bold border border-cyan-500/40 transition-colors shadow-sm"
            title="Aktifkan parameter optimal bebas angka 8 palsu"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            Preset Optimal
          </button>
          <button
            onClick={onApplyBaselinePreset}
            className="px-2.5 py-1.5 rounded bg-industrial-800 hover:bg-industrial-700 text-industrial-300 font-mono text-xs border border-industrial-700 transition-colors"
            title="Kembali ke konfigurasi standar default untuk melihat angka 8 palsu"
          >
            Reset Standar
          </button>
        </div>
      </div>
    </div>
  );
};
