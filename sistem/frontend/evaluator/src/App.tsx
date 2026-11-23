import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ExecutionStatusBanner, MODEL_OPTIONS } from './components/ExecutionStatusBanner';
import { ParameterToolbar, type ModelParameters } from './components/ParameterToolbar';
import { ComparisonTable } from './components/ComparisonTable';
import { MetricsOverview } from './components/MetricsOverview';
import { RiskCoveragePlot } from './components/RiskCoveragePlot';
import { ReliabilityDiagram } from './components/ReliabilityDiagram';
import { SampleInspector } from './components/SampleInspector';
import { ExperimentTrackerPanel } from './components/ExperimentTrackerPanel';
import { ExportThesisModal } from './components/ExportThesisModal';
import { TrainingConvergenceModal } from './components/TrainingConvergenceModal';
import { fetchQuickBenchmark, MOCK_BENCHMARK_DATA } from './services/api';
import type { BenchmarkResponse, OCRModelVariant } from './types/evaluator';

type ActiveTab = 'overview' | 'comparison' | 'inspector' | 'tracker';

export function App() {
  const [data, setData] = useState<BenchmarkResponse>(MOCK_BENCHMARK_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isTrainingOpen, setIsTrainingOpen] = useState<boolean>(false);
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [parameters, setParameters] = useState<ModelParameters>({
    model_variant: 'tiny_ft',
    unlit_filter_mode: 'aktif',
    verification_mode: 'aktif',
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('eval-theme');
    const isLight = savedTheme === 'light';
    document.documentElement.classList.toggle('light-mode', isLight);
    document.documentElement.classList.toggle('dark', !isLight);
    setIsLightMode(isLight);
  }, []);

  const toggleLightMode = () => {
    const nextLight = !isLightMode;
    setIsLightMode(nextLight);
    document.documentElement.classList.toggle('light-mode', nextLight);
    document.documentElement.classList.toggle('dark', !nextLight);
    localStorage.setItem('eval-theme', nextLight ? 'light' : 'dark');
  };

  const loadBenchmark = useCallback(
    async (
      modelVariant: OCRModelVariant = parameters.model_variant,
      forceRerun: boolean = false,
      verificationActive: boolean = parameters.verification_mode === 'aktif'
    ) => {
      setIsLoading(true);
      try {
        const res = await fetchQuickBenchmark(modelVariant, forceRerun, verificationActive);
        setData(res);
      } catch (err) {
        console.error('Benchmark error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [parameters.model_variant, parameters.verification_mode]
  );

  useEffect(() => {
    loadBenchmark('tiny_ft', false, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModelChange = (newModel: OCRModelVariant) => {
    setParameters((prev) => ({ ...prev, model_variant: newModel }));
    loadBenchmark(newModel, false, parameters.verification_mode === 'aktif');
  };

  const handleVerificationModeChange = (verifActive: boolean) => {
    const mode = verifActive ? 'aktif' : 'nonaktif';
    setParameters((prev) => ({ ...prev, verification_mode: mode, unlit_filter_mode: mode }));
    loadBenchmark(parameters.model_variant, true, verifActive);
  };

  const applyOptimalPreset = () => {
    setParameters({ model_variant: 'tiny_ft', unlit_filter_mode: 'aktif', verification_mode: 'aktif' });
    loadBenchmark('tiny_ft', false, true);
  };

  const applyBaselinePreset = () => {
    setParameters((prev) => ({ ...prev, unlit_filter_mode: 'nonaktif', verification_mode: 'nonaktif' }));
    loadBenchmark(parameters.model_variant, true, false);
  };

  const isVerificationActive = parameters.verification_mode === 'aktif';
  const isOptimal = parameters.model_variant === 'tiny_ft' && isVerificationActive;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 flex flex-col md:flex-row font-sans selection:bg-[#F47721]/30 ${
        isLightMode ? 'bg-[#F8FAFC] text-[#202832]' : 'bg-[#111820] text-[#F1F5F9]'
      }`}
    >
      <Sidebar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        sampleCount={data.sample_count}
        manifestName={data.manifest_name}
        isLightMode={isLightMode}
        onToggleLightMode={toggleLightMode}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTrainingCurve={() => setIsTrainingOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          isLoading={isLoading}
          onRunBenchmark={() => loadBenchmark(parameters.model_variant, true, isVerificationActive)}
          manifestName={data.manifest_name}
          isLightMode={isLightMode}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {activeTab !== 'tracker' && activeTab !== 'comparison' && (
            <ExecutionStatusBanner
              isLightMode={isLightMode}
              isLoading={isLoading}
              isVerificationActive={isVerificationActive}
              sampleCount={data.sample_count}
              executionTimeS={data.execution_time_s}
              modelVariant={parameters.model_variant}
              onChangeVerificationMode={handleVerificationModeChange}
              onChangeModel={handleModelChange}
            />
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <MetricsOverview metrics={data.metrics} sampleCount={data.sample_count} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskCoveragePlot
                  coords={data.risk_coverage.coords}
                  aurc={data.risk_coverage.aurc}
                  initialThreshold={data.confidence_threshold}
                />
                <ReliabilityDiagram calibration={data.calibration} />
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <ParameterToolbar
                parameters={parameters}
                onChangeParameters={(newParams) => {
                  const verifChanged = newParams.verification_mode !== parameters.verification_mode;
                  if (newParams.model_variant !== parameters.model_variant) {
                    setParameters(newParams);
                    loadBenchmark(newParams.model_variant, false, newParams.verification_mode === 'aktif');
                  } else if (verifChanged) {
                    handleVerificationModeChange(newParams.verification_mode === 'aktif');
                  } else {
                    setParameters(newParams);
                  }
                }}
                onApplyOptimalPreset={applyOptimalPreset}
                onApplyBaselinePreset={applyBaselinePreset}
                isOptimal={isOptimal}
              />
              <ComparisonTable
                currentVariant={parameters.model_variant}
                verificationActive={isVerificationActive}
                onOpenTrainingCurve={() => setIsTrainingOpen(true)}
              />
            </div>
          )}

          {activeTab === 'inspector' && <SampleInspector samples={data.samples} isLightMode={isLightMode} />}
          {activeTab === 'tracker' && <ExperimentTrackerPanel isLightMode={isLightMode} />}
        </main>

        <footer
          className={`border-t px-6 py-4 text-xs font-sans text-center mt-8 transition-colors ${
            isLightMode ? 'border-[#E2E8F0] text-[#64748B] bg-white' : 'border-[#2E3A47]/60 text-[#94A3B8] bg-[#171F28]/40'
          }`}
        >
          Sistem Verifikasi Pembacaan Timbangan Digital 7-Segmen Berbasis OCR &bull; Mode:{' '}
          {isVerificationActive ? 'Sesudah Verifikasi 4-Lapis' : 'Sebelum Verifikasi (Mentah)'} &bull;{' '}
          {MODEL_OPTIONS.find((m) => m.value === parameters.model_variant)?.label}
        </footer>
      </div>

      <TrainingConvergenceModal isOpen={isTrainingOpen} onClose={() => setIsTrainingOpen(false)} isLightMode={isLightMode} />
      <ExportThesisModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} data={data} />
    </div>
  );
}

export default App;
