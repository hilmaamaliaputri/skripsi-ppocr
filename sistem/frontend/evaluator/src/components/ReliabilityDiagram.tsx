import React, { useState } from 'react';
import type { CalibrationResult } from '../types/evaluator';
import { BarChart3, CheckCircle2 } from 'lucide-react';

interface ReliabilityDiagramProps {
  calibration: CalibrationResult;
}

export const ReliabilityDiagram: React.FC<ReliabilityDiagramProps> = ({ calibration }) => {
  const [viewMode, setViewMode] = useState<'after' | 'before'>('after');

  const bins = viewMode === 'after' ? calibration.bins_after : calibration.bins_before;
  const currentECE = viewMode === 'after' ? calibration.ece_after : calibration.ece_before;
  const eceReduction = (((calibration.ece_before - calibration.ece_after) / calibration.ece_before) * 100).toFixed(1);

  // SVG dimensions
  const width = 500;
  const height = 260;
  const padding = { top: 20, right: 25, bottom: 40, left: 45 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const binWidth = plotW / bins.length;

  return (
    <div className="p-4 rounded bg-industrial-900 border border-industrial-800 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 border-b border-industrial-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
            Reliability Diagram (Kalibrasi Suhu)
          </h2>
        </div>

        <div className="flex items-center gap-1.5 bg-industrial-950 p-1 rounded border border-industrial-800">
          <button
            onClick={() => setViewMode('after')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              viewMode === 'after'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                : 'text-industrial-400 hover:text-industrial-200'
            }`}
          >
            Terkalibrasi (T* = {calibration.optimal_temperature.toFixed(2)})
          </button>
          <button
            onClick={() => setViewMode('before')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              viewMode === 'before'
                ? 'bg-red-950 text-red-300 border border-red-800 font-bold'
                : 'text-industrial-400 hover:text-industrial-200'
            }`}
          >
            Mentah (T = 1.0)
          </button>
        </div>
      </div>

      <div className="relative my-2 flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[540px] select-none">
          {/* Diagonal ideal calibration line y = x */}
          <line
            x1={padding.left}
            y1={padding.top + plotH}
            x2={padding.left + plotW}
            y2={padding.top}
            stroke="#475569"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Bins bars */}
          {bins.map((bin, i) => {
            const x = padding.left + i * binWidth + 6;
            const barW = binWidth - 12;
            const confH = bin.avg_confidence * plotH;
            const accH = bin.accuracy * plotH;

            const isOverconfident = bin.avg_confidence > bin.accuracy;

            return (
              <g key={i}>
                {/* Confidence bar (gray background outline) */}
                <rect
                  x={x}
                  y={padding.top + plotH - confH}
                  width={barW}
                  height={confH}
                  fill={isOverconfident ? '#ef4444' : '#06b6d4'}
                  fillOpacity="0.25"
                  stroke={isOverconfident ? '#ef4444' : '#06b6d4'}
                  strokeDasharray="2 2"
                />

                {/* Empirical accuracy bar (solid) */}
                <rect
                  x={x}
                  y={padding.top + plotH - accH}
                  width={barW}
                  height={accH}
                  fill={viewMode === 'after' ? '#10b981' : '#f59e0b'}
                  fillOpacity="0.85"
                  rx="1"
                />

                {/* X labels */}
                <text
                  x={x + barW / 2}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  className="text-[9px] fill-industrial-400 font-mono"
                >
                  {bin.bin_lower.toFixed(1)}-{bin.bin_upper.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Y Axis ticks */}
          {[0, 0.5, 1.0].map((v) => {
            const y = padding.top + plotH - v * plotH;
            return (
              <g key={`y-${v}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotW}
                  y2={y}
                  stroke="#1f293d"
                  strokeDasharray="2 3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-industrial-400 font-mono"
                >
                  {(v * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Labels */}
          <text
            x={padding.left + plotW / 2}
            y={height - 6}
            textAnchor="middle"
            className="text-[10px] fill-industrial-400 font-mono"
          >
            Rentang Keyakinan Output (&tau;)
          </text>
          <text
            x={12}
            y={padding.top + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${padding.top + plotH / 2})`}
            className="text-[10px] fill-industrial-400 font-mono"
          >
            Akurasi Empiris
          </text>
        </svg>
      </div>

      <div className="mt-2 pt-2 border-t border-industrial-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-industrial-400">Expected Calibration Error:</span>
          <span className={`font-bold ${viewMode === 'after' ? 'text-emerald-400' : 'text-red-400'}`}>
            ECE: {(currentECE * 100).toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ECE Turun: <strong>-{eceReduction}%</strong> dengan T* = {calibration.optimal_temperature.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
