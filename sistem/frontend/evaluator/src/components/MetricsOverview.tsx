import React from 'react';
import type { MetricStats } from '../types/evaluator';
import { Target, Zap, AlertTriangle, Layers, Percent, Clock } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: MetricStats;
  sampleCount: number;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics, sampleCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. FSR */}
      <div className="p-3.5 rounded bg-industrial-900 border border-industrial-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-industrial-400">
          <span className="text-[11px] font-mono tracking-wider uppercase font-semibold">FSR (Akurasi Sequence)</span>
          <Target className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white">
            {metrics.fsr.toFixed(1)}%
          </div>
          {metrics.bootstrap_ci?.fsr && (
            <div className="text-[10px] font-mono text-industrial-400 mt-1">
              95% CI: [{metrics.bootstrap_ci.fsr.lower.toFixed(1)}% - {metrics.bootstrap_ci.fsr.upper.toFixed(1)}%]
            </div>
          )}
        </div>
      </div>

      {/* 2. CER */}
      <div className="p-3.5 rounded bg-industrial-900 border border-industrial-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-industrial-400">
          <span className="text-[11px] font-mono tracking-wider uppercase font-semibold">CER (Karakter)</span>
          <Percent className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white">
            {metrics.cer.toFixed(2)}%
          </div>
          {metrics.bootstrap_ci?.cer && (
            <div className="text-[10px] font-mono text-industrial-400 mt-1">
              95% CI: [{metrics.bootstrap_ci.cer.lower.toFixed(2)}% - {metrics.bootstrap_ci.cer.upper.toFixed(2)}%]
            </div>
          )}
        </div>
      </div>

      {/* 3. Decimal Accuracy */}
      <div className="p-3.5 rounded bg-industrial-900 border border-industrial-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-industrial-400">
          <span className="text-[11px] font-mono tracking-wider uppercase font-semibold">Akurasi Desimal</span>
          <Layers className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white">
            {metrics.decimal_acc.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-emerald-400/90 mt-1">
            OpenCV Bottom 35%
          </div>
        </div>
      </div>

      {/* 4. Silent Error Rate */}
      <div className="p-3.5 rounded bg-industrial-900 border border-industrial-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-industrial-400">
          <span className="text-[11px] font-mono tracking-wider uppercase font-semibold">Silent Error Rate</span>
          <AlertTriangle className={`w-3.5 h-3.5 ${metrics.silent_error === 0 ? 'text-emerald-400' : 'text-red-400'}`} />
        </div>
        <div className="mt-2">
          <div className={`text-2xl font-bold font-mono ${metrics.silent_error === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {metrics.silent_error.toFixed(2)}%
          </div>
          <div className="text-[10px] font-mono text-industrial-400 mt-1">
            Lolos tapi salah (Risiko)
          </div>
        </div>
      </div>

      {/* 5. Coverage */}
      <div className="p-3.5 rounded bg-industrial-900 border border-industrial-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-industrial-400">
          <span className="text-[11px] font-mono tracking-wider uppercase font-semibold">Coverage Otomatis</span>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white">
            {metrics.coverage.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-industrial-400 mt-1">
            Status TERIMA mandiri
          </div>
        </div>
      </div>

      {/* 6. Latency */}
      <div className="p-3.5 rounded bg-industrial-900 border border-industrial-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-industrial-400">
          <span className="text-[11px] font-mono tracking-wider uppercase font-semibold">Latensi Eksekusi</span>
          <Clock className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white">
            {metrics.latency_p50_ms.toFixed(1)} <span className="text-xs font-normal text-industrial-400">ms</span>
          </div>
          <div className="text-[10px] font-mono text-industrial-400 mt-1">
            p95: {metrics.latency_p95_ms.toFixed(1)} ms (n={sampleCount})
          </div>
        </div>
      </div>
    </div>
  );
};
