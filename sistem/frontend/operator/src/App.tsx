import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CameraViewfinder } from './components/CameraViewfinder';
import { DecisionDisplay } from './components/DecisionDisplay';
import { VerificationRail } from './components/VerificationRail';
import { TransactionHistory } from './components/TransactionHistory';
import {
  fetchDevices,
  fetchProducts,
  fetchTransactions,
  triggerBurstProcessing,
  DEFAULT_DEVICES,
  DEFAULT_PRODUCTS,
} from './services/api';
import type {
  DeviceConfig,
  ProductConfig,
  BurstProcessResponse,
  TransactionItem,
  DecisionType,
} from './types/operator';

export function App() {
  const [devices, setDevices] = useState<DeviceConfig[]>(DEFAULT_DEVICES);
  const [products, setProducts] = useState<ProductConfig[]>(DEFAULT_PRODUCTS);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(DEFAULT_DEVICES[0].id);
  const [selectedProductId, setSelectedProductId] = useState<string>(DEFAULT_PRODUCTS[0].id);

  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<BurstProcessResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  // Load initial configurations and audit logs
  useEffect(() => {
    async function init() {
      const [devs, prods, txs] = await Promise.all([
        fetchDevices(),
        fetchProducts(),
        fetchTransactions(),
      ]);
      setDevices(devs);
      setProducts(prods);
      setTransactions(txs);
      if (devs.length > 0) setSelectedDeviceId(devs[0].id);
      if (prods.length > 0) setSelectedProductId(prods[0].id);
    }
    init();
  }, []);

  // Trigger burst capture
  const handleTriggerBurst = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      const res = await triggerBurstProcessing(selectedDeviceId, selectedProductId);
      setCurrentResult(res);

      if (res.decision === 'TERIMA') {
        const newTx: TransactionItem = {
          id: res.transaction_id,
          timestamp: res.timestamp,
          device_id: res.device_id,
          product_id: res.product_id,
          final_value: res.final_value || '0.00',
          decision: res.decision,
          confidence: res.calibrated_confidence,
          latency_ms: res.latency_ms,
        };
        setTransactions((prev) => [newTx, ...prev]);
      }
    } catch (err) {
      console.error('Burst acquisition failed:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, selectedDeviceId, selectedProductId]);

  // Manual confirmation [M]
  const handleManualApprove = useCallback(() => {
    if (!currentResult || currentResult.decision !== 'KONFIRMASI') return;
    const approvedRes: BurstProcessResponse = {
      ...currentResult,
      decision: 'TERIMA',
      final_value: currentResult.raw_prediction,
    };
    setCurrentResult(approvedRes);

    const manualTx: TransactionItem = {
      id: approvedRes.transaction_id,
      timestamp: new Date().toLocaleTimeString(),
      device_id: approvedRes.device_id,
      product_id: approvedRes.product_id,
      final_value: approvedRes.raw_prediction,
      decision: 'TERIMA',
      confidence: approvedRes.calibrated_confidence,
      latency_ms: approvedRes.latency_ms,
      note: 'Diverifikasi Manual oleh Operator',
    };
    setTransactions((prev) => [manualTx, ...prev]);
  }, [currentResult]);

  // Manual reset / cancel [Esc]
  const handleManualCancel = useCallback(() => {
    if (currentResult) {
      setCurrentResult((prev) => (prev ? { ...prev, decision: 'BATAL' as DecisionType } : null));
    }
  }, [currentResult]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTriggerBurst();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleManualApprove();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleManualCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerBurst, handleManualApprove, handleManualCancel]);

  const activeDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  return (
    <div className="min-h-screen bg-industrial-950 text-industrial-200 flex flex-col font-sans selection:bg-emerald-900 selection:text-white">
      {/* Station Header */}
      <Header
        devices={devices}
        products={products}
        selectedDevice={selectedDeviceId}
        selectedProduct={selectedProductId}
        onSelectDevice={setSelectedDeviceId}
        onSelectProduct={setSelectedProductId}
        isProcessing={isCapturing}
      />

      {/* Main Workstation Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Core Acquisition Dual-Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <CameraViewfinder
            isCapturing={isCapturing}
            onTriggerBurst={handleTriggerBurst}
            slotCount={activeDevice?.slot_count || 5}
            decimalPlaces={activeDevice?.decimal_places || 2}
          />

          <DecisionDisplay
            decision={currentResult ? currentResult.decision : 'BATAL'}
            weightValue={currentResult ? currentResult.final_value : null}
            confidence={currentResult ? currentResult.calibrated_confidence : 0}
            latencyMs={currentResult ? currentResult.latency_ms : 0}
            onManualApprove={handleManualApprove}
            onManualCancel={handleManualCancel}
            rejectionReason={
              currentResult?.layers?.physical?.reason ||
              currentResult?.layers?.structural?.reason ||
              currentResult?.layers?.temporal?.reason
            }
          />
        </div>

        {/* 4-Layer Diagnostic Rail */}
        <VerificationRail layers={currentResult?.layers} />

        {/* Local SQLite / JSONL Audit Trail */}
        <TransactionHistory transactions={transactions} />
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-industrial-800 bg-industrial-900/60 px-6 py-3 text-xs font-mono text-industrial-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Sistem Pembacaan Timbangan Digital PP-OCRv6 &bull; Mode Operasional Berkecepatan Tinggi</span>
        <span className="text-industrial-400">Pintasan: [Space] Ambil &bull; [M] Manual Confirm &bull; [Esc] Reset</span>
      </footer>
    </div>
  );
}

export default App;
