import React, { useState } from 'react';
import type { RiskCoverageCoord } from '../types/evaluator';
import { Activity, Info } from 'lucide-react';

interface RiskCoveragePlotProps {
  coords: RiskCoverageCoord[];
  aurc: number;
  initialThreshold?: number;
  onThresholdChange?: (tau: number) => void;
}

export const RiskCoveragePlot: React.FC<RiskCoveragePlotProps> = ({
  coords,
  aurc,
  initialThreshold = 0.80,
  onThresholdChange,
}) => {
  const [threshold, setThreshold] = useState<number>(initialThreshold);

  // SVG dimensions
  const width = 500;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Max risk for scale
  const maxRisk = Math.max(0.04, ...coords.map((c) => c.risk * 1.25));

  // Scale functions
  const scaleX = (cov: number) => padding.left + cov * plotW;
  const scaleY = (risk: number) => padding.top + plotH - (risk / maxRisk) * plotH;

  // Path generator
  const pathD = coords.reduce((acc, pt, idx) => {
    const x = scaleX(pt.coverage);
    const y = scaleY(pt.risk);
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');

  // Active point matching threshold
  const activePoint = coords.reduce((prev, curr) =>
    Math.abs(curr.threshold - threshold) < Math.abs(prev.threshold - threshold) ? curr : prev
  );

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setThreshold(val);
    if (onThresholdChange) onThresholdChange(val);
  };

  return (
    <div className="p-4 rounded-lg bg-industrial-900 border border-industrial-800 flex flex-col justify-between theme-card">
      <div className="flex items-center justify-between pb-2 border-b border-industrial-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
            Kurva Risk-Coverage (Selective Classification)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            AURC: {aurc.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="relative my-2 flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[540px] select-none">
          {/* Background grid */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
            const x = scaleX(v);
            return (
              <line
                key={`gx-${v}`}
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + plotH}
                stroke="#1f293d"
                strokeDasharray="2 3"
              />
            );
          })}
          {[0, maxRisk * 0.5, maxRisk].map((r, i) => {
            const y = scaleY(r);
            return (
              <g key={`gy-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotW}
                  y2={y}
                  stroke="#1f293d"
                  strokeDasharray="2 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-industrial-400 font-mono"
                >
                  {(r * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* X Axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((v) => (
            <text
              key={`tx-${v}`}
              x={scaleX(v)}
              y={height - padding.bottom + 16}
              textAnchor="middle"
              className="text-[9px] fill-industrial-400 font-mono"
            >
              {(v * 100).toFixed(0)}%
            </text>
          ))}

          {/* Axis Labels */}
          <text
            x={padding.left + plotW / 2}
            y={height - 6}
            textAnchor="middle"
            className="text-[10px] fill-industrial-400 font-mono"
          >
            Coverage (Fraksi Data Otomatis Diterima)
          </text>
          <text
            x={14}
            y={padding.top + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${padding.top + plotH / 2})`}
            className="text-[10px] fill-industrial-400 font-mono"
          >
            Risk (Empirical Error Rate)
          </text>

          {/* Area fill under curve */}
          <path
            d={`${pathD} L ${scaleX(coords[coords.length - 1]?.coverage || 1)} ${scaleY(0)} L ${scaleX(coords[0]?.coverage || 0)} ${scaleY(0)} Z`}
            fill="#06b6d4"
            fillOpacity="0.08"
          />

          {/* Curve line */}
          <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

          {/* Data Points */}
          {coords.map((pt, i) => (
            <circle
              key={i}
              cx={scaleX(pt.coverage)}
              cy={scaleY(pt.risk)}
              r="3.5"
              fill="#0b0f17"
              stroke="#06b6d4"
              strokeWidth="2"
            />
          ))}

          {/* Active Operating Point Crosshair */}
          {activePoint && (
            <g>
              <line
                x1={scaleX(activePoint.coverage)}
                y1={padding.top}
                x2={scaleX(activePoint.coverage)}
                y2={padding.top + plotH}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={scaleX(activePoint.coverage)}
                cy={scaleY(activePoint.risk)}
                r="6"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Operating Threshold Controls */}
      <div className="mt-2 pt-2 border-t border-industrial-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-industrial-400">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Ambang Batas Keyakinan Kalibrasi (&tau;):</span>
          <span className="font-bold text-amber-300 font-mono text-sm">{threshold.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0.50"
            max="0.99"
            step="0.01"
            value={threshold}
            onChange={handleSliderChange}
            className="w-36 h-1.5 bg-industrial-800 rounded appearance-none cursor-pointer accent-amber-400"
          />
          <span className="text-[11px] text-industrial-300">
            Cov: <strong className="text-white">{(activePoint.coverage * 100).toFixed(1)}%</strong> | Risk: <strong className="text-red-400">{(activePoint.risk * 100).toFixed(2)}%</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
