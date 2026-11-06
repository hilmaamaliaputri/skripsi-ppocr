import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { RiskCoveragePlot } from './components/RiskCoveragePlot';
import { ReliabilityDiagram } from './components/ReliabilityDiagram';
import { SampleInspector } from './components/SampleInspector';
import { ExportThesisModal } from './components/ExportThesisModal';
import { fetchQuickBenchmark, MOCK_BENCHMARK_DATA } from './services/api';
import type { BenchmarkResponse } from './types/evaluator';
import { ShieldCheck, Cpu } from 'lucide-react';

export function App() {
  const [data, setData] = useState<BenchmarkResponse>(MOCK_BENCHMARK_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const loadBenchmark = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchQuickBenchmark();
      setData(res);
    } catch (err) {
      console.error('Failed to run benchmark:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBenchmark();
  }, [loadBenchmark]);

  return (
    <div className="min-h-screen bg-industrial-950 text-industrial-200 flex flex-col font-sans">
      {/* Header */}
      <Header
        isLoading={isLoading}
        onRunBenchmark={loadBenchmark}
        onOpenExport={() => setIsExportOpen(true)}
        manifestName={data.manifest_name}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Compliance & Hardware Banner */}
        <div className="p-3 rounded bg-industrial-900 border border-industrial-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-industrial-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Protokol Integritas Skripsi: Dataset Uji Terkunci ({data.sample_count} sampel). Ambang verifikasi disetel hanya dari dataset kalibrasi.
            </span>
          </div>

          <div className="flex items-center gap-3 text-industrial-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Model: <strong className="text-white">PP-OCRv6 ONNX (CPU Native)</strong>
            </span>
          </div>
        </div>

        {/* 1. Metrics Overview KPIs */}
        <MetricsOverview metrics={data.metrics} sampleCount={data.sample_count} />

        {/* 2. Visualizations: Risk-Coverage & Reliability Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskCoveragePlot
            coords={data.risk_coverage.coords}
            aurc={data.risk_coverage.aurc}
            initialThreshold={data.confidence_threshold}
          />

          <ReliabilityDiagram calibration={data.calibration} />
        </div>

        {/* 3. Sample Inspector & Multi-Layer Audit */}
        <SampleInspector samples={data.samples} />
      </main>

      {/* Footer */}
      <footer className="border-t border-industrial-800 bg-industrial-900/60 px-6 py-4 text-xs font-mono text-industrial-500 text-center">
        Laboratorium Visi Komputer & Pembacaan Timbangan Digital 7-Segmen &bull; Skripsi PP-OCRv6 &bull; Antigravity Anti-Slop
      </footer>

      {/* Thesis LaTeX & Markdown Export Modal */}
      <ExportThesisModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={data}
      />
    </div>
  );
}

export default App;
