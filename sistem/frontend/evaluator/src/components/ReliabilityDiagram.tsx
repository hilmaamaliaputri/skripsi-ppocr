import React, { useState } from 'react';
import type { CalibrationResult, CalibrationBin } from '../types/evaluator';
import { BarChart3 } from 'lucide-react';

interface ReliabilityDiagramProps {
  calibration: CalibrationResult;
}

export const ReliabilityDiagram: React.FC<ReliabilityDiagramProps> = ({ calibration }) => {
  const [viewMode, setViewMode] = useState<'after' | 'before'>('after');

  const bins = viewMode === 'after' ? calibration.bins_after : calibration.bins_before;
  const currentEce = viewMode === 'after' ? calibration.ece_after : calibration.ece_before;

  // SVG dimensions
  const width = 500;
  const height = 260;
  const padding = { top: 20, right: 25, bottom: 40, left: 45 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const binWidth = plotW / bins.length;

  return (
    <div className="p-5 rounded-xl bg-industrial-900 border border-industrial-800 flex flex-col justify-between theme-card shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-industrial-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-sans font-bold tracking-wider text-white uppercase theme-text-primary">
              Reliability Diagram (Kalibrasi Platt)
            </h2>
            <p className="text-[11px] font-sans text-industrial-400">Kesesuaian antara tingkat keyakinan model dan akurasi empiris.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-industrial-950 p-1 rounded-lg border border-industrial-800">
          <button
            onClick={() => setViewMode('after')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-sans transition-all ${
              viewMode === 'after'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-industrial-400 hover:text-industrial-200'
            }`}
          >
            Terkalibrasi (T* = {calibration.optimal_temperature.toFixed(2)})
          </button>
          <button
            onClick={() => setViewMode('before')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-sans transition-all ${
              viewMode === 'before'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-industrial-400 hover:text-industrial-200'
            }`}
          >
            Mentah (T = 1.0)
          </button>
        </div>
      </div>

      <div className="relative my-3 flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[540px] select-none">
          {/* Diagonal ideal calibration line y = x */}
          <line
            x1={padding.left}
            y1={padding.top + plotH}
            x2={padding.left + plotW}
            y2={padding.top}
            stroke="#94a3b8"
            strokeOpacity="0.4"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Bins bars */}
          {bins.map((bin: CalibrationBin, i: number) => {
            const x = padding.left + i * binWidth + 6;
            const barW = binWidth - 12;
            const confH = bin.avg_confidence * plotH;
            const accH = bin.accuracy * plotH;

            const isOverconfident = bin.avg_confidence > bin.accuracy;

            return (
              <g key={i}>
                {/* Confidence bar (translucent background outline) */}
                <rect
                  x={x}
                  y={padding.top + plotH - confH}
                  width={barW}
                  height={confH}
                  fill={isOverconfident ? '#f43f5e' : '#0ea5e9'}
                  fillOpacity="0.18"
                  stroke={isOverconfident ? '#f43f5e' : '#0ea5e9'}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  rx="3"
                />

                {/* Empirical accuracy bar (solid) */}
                <rect
                  x={x}
                  y={padding.top + plotH - accH}
                  width={barW}
                  height={accH}
                  fill={viewMode === 'after' ? '#10b981' : '#f59e0b'}
                  fillOpacity="0.85"
                  rx="3"
                />

                {/* X labels */}
                <text
                  x={x + barW / 2}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {(bin.bin_upper * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Y Axis Grid & Labels */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
            const y = padding.top + plotH - v * plotH;
            return (
              <g key={`gy-${v}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotW}
                  y2={y}
                  stroke="#64748b"
                  strokeOpacity="0.15"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {(v * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* X Axis line */}
          <line
            x1={padding.left}
            y1={padding.top + plotH}
            x2={padding.left + plotW}
            y2={padding.top + plotH}
            stroke="#64748b"
            strokeOpacity="0.4"
          />

          {/* Axis Titles */}
          <text
            x={padding.left + plotW / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#94a3b8"
            fontFamily="sans-serif"
            fontWeight="500"
          >
            Keyakinan Model (Confidence Bin)
          </text>
          <text
            x={15}
            y={padding.top + plotH / 2}
            textAnchor="middle"
            fontSize="11"
            fill="#94a3b8"
            fontFamily="sans-serif"
            fontWeight="500"
            transform={`rotate(-90 15 ${padding.top + plotH / 2})`}
          >
            Akurasi Empiris
          </text>
        </svg>
      </div>

      {/* Legend & Summary Info */}
      <div className="bg-industrial-950 p-3 rounded-xl border border-industrial-800 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-3 h-3 rounded ${
                viewMode === 'after' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-industrial-300">Akurasi Empiris</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-dashed border-sky-400 bg-sky-400/20" />
            <span className="text-industrial-300">Rata-rata Keyakinan</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-industrial-400 font-sans">ECE:</span>
          <span
            className={`font-bold ${
              currentEce < 0.05 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {currentEce.toFixed(4)}
          </span>
          <span className="text-[10px] text-industrial-500">
            ({currentEce < 0.05 ? 'Terkalibrasi Sangat Baik' : 'Overconfident'})
          </span>
        </div>
      </div>
    </div>
  );
};
