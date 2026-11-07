import React, { useState } from 'react';
import type { RiskCoverageCoord } from '../types/evaluator';
import { Activity } from 'lucide-react';

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

  // Area under curve path
  const areaD = coords.length > 0
    ? `${pathD} L ${scaleX(coords[coords.length - 1].coverage)} ${padding.top + plotH} L ${scaleX(coords[0].coverage)} ${padding.top + plotH} Z`
    : '';

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
    <div className="p-5 rounded-xl bg-industrial-900 border border-industrial-800 flex flex-col justify-between theme-card shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-industrial-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-sans font-bold tracking-wider text-white uppercase theme-text-primary">
              Kurva Risk-Coverage (Selective Classification)
            </h2>
            <p className="text-[11px] font-sans text-industrial-400">Trade-off antara rasio cakupan otomatis vs risiko silent error.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-sky-950 border border-sky-800 text-sky-300 font-semibold shadow-sm">
            AURC: {aurc.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="relative my-3 flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[540px] select-none">
          <defs>
            <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

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
                stroke="#64748b"
                strokeOpacity="0.2"
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
                  stroke="#64748b"
                  strokeOpacity="0.2"
                  strokeDasharray="2 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {(r * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          {areaD && <path d={areaD} fill="url(#riskAreaGrad)" />}

          {/* Risk-Coverage curve line */}
          <path
            d={pathD}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Operating Point indicator */}
          {activePoint && (
            <g>
              <line
                x1={scaleX(activePoint.coverage)}
                y1={padding.top}
                x2={scaleX(activePoint.coverage)}
                y2={padding.top + plotH}
                stroke="#38bdf8"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <line
                x1={padding.left}
                y1={scaleY(activePoint.risk)}
                x2={padding.left + plotW}
                y2={scaleY(activePoint.risk)}
                stroke="#38bdf8"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <circle
                cx={scaleX(activePoint.coverage)}
                cy={scaleY(activePoint.risk)}
                r="5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X Axis line & labels */}
          <line
            x1={padding.left}
            y1={padding.top + plotH}
            x2={padding.left + plotW}
            y2={padding.top + plotH}
            stroke="#64748b"
            strokeOpacity="0.4"
          />
          {[0, 0.25, 0.5, 0.75, 1.0].map((v) => (
            <text
              key={`lx-${v}`}
              x={scaleX(v)}
              y={height - padding.bottom + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
              fontFamily="monospace"
            >
              {(v * 100).toFixed(0)}%
            </text>
          ))}

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
            Coverage (Cakupan Otomatis)
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
            Empirical Risk (FAR)
          </text>
        </svg>
      </div>

      {/* Threshold Slider & Interactive Operating Point */}
      <div className="bg-industrial-950 p-3.5 rounded-xl border border-industrial-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="text-industrial-400 font-medium">
            Ambang Keyakinan Operasional (&tau;*):
          </span>
          <span className="font-mono font-bold text-sky-400">
            {threshold.toFixed(2)} ({(threshold * 100).toFixed(0)}%)
          </span>
        </div>

        <input
          type="range"
          min="0.50"
          max="0.99"
          step="0.01"
          value={threshold}
          onChange={handleSliderChange}
          className="w-full accent-sky-500 cursor-pointer h-1.5 bg-industrial-800 rounded-lg appearance-none"
        />

        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
          <div className="bg-industrial-900 p-2 rounded-lg border border-industrial-800/60 flex justify-between">
            <span className="text-industrial-400 font-sans">Cakupan (Cov):</span>
            <span className="text-white font-bold">{((activePoint?.coverage || 0) * 100).toFixed(1)}%</span>
          </div>
          <div className="bg-industrial-900 p-2 rounded-lg border border-industrial-800/60 flex justify-between">
            <span className="text-industrial-400 font-sans">Risiko (Risk):</span>
            <span className="text-emerald-400 font-bold">{((activePoint?.risk || 0) * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
