import React from 'react';
import type { TransactionItem } from '../types/operator';
import { History, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: TransactionItem[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const totalCount = transactions.length;
  const acceptedCount = transactions.filter((t) => t.decision === 'TERIMA').length;
  const rejectedCount = transactions.filter((t) => t.decision === 'TOLAK').length;

  const getDecisionBadge = (decision: TransactionItem['decision']) => {
    switch (decision) {
      case 'TERIMA':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> TERIMA
          </span>
        );
      case 'TOLAK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> TOLAK
          </span>
        );
      case 'KONFIRMASI':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> CONFIRM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700">
            BATAL
          </span>
        );
    }
  };

  return (
    <div className="rounded bg-industrial-900 border border-industrial-800 flex flex-col">
      {/* Header and Summary Bar */}
      <div className="p-3 border-b border-industrial-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Jejak Audit Penimbangan Stasiun (Lokal + SQLite)
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-industrial-400">Total: <strong className="text-white">{totalCount}</strong></span>
          <span className="text-emerald-400">Diterima: <strong>{acceptedCount}</strong></span>
          <span className="text-red-400">Ditolak: <strong>{rejectedCount}</strong></span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[220px]">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead className="bg-industrial-950 text-industrial-400 sticky top-0 border-b border-industrial-800">
            <tr>
              <th className="py-2 px-3">ID Transaksi</th>
              <th className="py-2 px-3">Waktu</th>
              <th className="py-2 px-3">Timbangan</th>
              <th className="py-2 px-3">Produk / SKU</th>
              <th className="py-2 px-3">Bobot Terbaca</th>
              <th className="py-2 px-3">Status Keputusan</th>
              <th className="py-2 px-3 text-right">Latensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-800/60">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-industrial-850/50 text-industrial-300 transition-colors">
                <td className="py-2 px-3 font-semibold text-industrial-200">{t.id}</td>
                <td className="py-2 px-3 text-industrial-400">{t.timestamp}</td>
                <td className="py-2 px-3 text-cyan-300">{t.device_id}</td>
                <td className="py-2 px-3">{t.product_id}</td>
                <td className="py-2 px-3 font-bold text-white">{t.final_value || '0.00'} kg</td>
                <td className="py-2 px-3">{getDecisionBadge(t.decision)}</td>
                <td className="py-2 px-3 text-right text-purple-400">{t.latency_ms.toFixed(1)} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
