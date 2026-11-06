import React from 'react';
import type { DeviceConfig, ProductConfig } from '../types/operator';
import { Scale, Package, ShieldCheck, Activity } from 'lucide-react';

interface HeaderProps {
  devices: DeviceConfig[];
  products: ProductConfig[];
  selectedDevice: string;
  selectedProduct: string;
  onSelectDevice: (id: string) => void;
  onSelectProduct: (id: string) => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  devices,
  products,
  selectedDevice,
  selectedProduct,
  onSelectDevice,
  onSelectProduct,
  isProcessing,
}) => {
  return (
    <header className="border-b border-industrial-800 bg-industrial-900/90 backdrop-blur px-6 py-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
            W1
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Workstation Penimbangan Industri #01
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFIKASI AKTIF
              </span>
            </div>
            <p className="text-[11px] font-mono text-industrial-400">
              Akuisisi Cepat 5-Frame &bull; Model PP-OCRv6 ONNX &bull; Toleransi L1–L4
            </p>
          </div>
        </div>

        {/* Profile Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Device Profile */}
          <div className="flex items-center gap-2 bg-industrial-950 border border-industrial-800 px-3 py-1.5 rounded text-xs font-mono">
            <Scale className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-industrial-400 text-[11px]">Timbangan:</span>
            <select
              value={selectedDevice}
              onChange={(e) => onSelectDevice(e.target.value)}
              disabled={isProcessing}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id} className="bg-industrial-900 text-white">
                  {d.name} ({d.slot_count}d, .{d.decimal_places})
                </option>
              ))}
            </select>
          </div>

          {/* Product Profile */}
          <div className="flex items-center gap-2 bg-industrial-950 border border-industrial-800 px-3 py-1.5 rounded text-xs font-mono">
            <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-industrial-400 text-[11px]">Produk / SKU:</span>
            <select
              value={selectedProduct}
              onChange={(e) => onSelectProduct(e.target.value)}
              disabled={isProcessing}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-industrial-900 text-white">
                  {p.name} [{p.min_weight}-{p.max_weight}kg]
                </option>
              ))}
            </select>
          </div>

          {/* Status Live Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-industrial-950 border border-industrial-800 text-[11px] font-mono text-emerald-400">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  );
};
