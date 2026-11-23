import React, { useState } from 'react';
import type { SampleEvaluation, FrameEvaluationItem } from '../types/evaluator';
import { SampleTable } from './SampleTable';
import { SampleDetailPanel } from './SampleDetailPanel';
import { SampleLightboxModal } from './SampleLightboxModal';

interface SampleInspectorProps {
  samples: SampleEvaluation[];
  isLightMode?: boolean;
}

export const SampleInspector: React.FC<SampleInspectorProps> = ({
  samples,
  isLightMode = false,
}) => {
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [selectedSample, setSelectedSample] = useState<SampleEvaluation | null>(samples[0] || null);
  const [lightboxFrame, setLightboxFrame] = useState<FrameEvaluationItem | null>(null);

  const filtered = samples.filter((s) => {
    if (filterDecision === 'ALL') return true;
    if (filterDecision === 'ERRORS') return !s.is_correct;
    if (filterDecision === 'SILENT') return s.is_silent_error;
    return s.decision === filterDecision;
  });

  const getStatusBadge = (decision: SampleEvaluation['decision']) => {
    switch (decision) {
      case 'TERIMA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-100 dark:bg-[#16A36A]/15 text-emerald-800 dark:text-[#38C98A] border border-emerald-300 dark:border-[#38C98A]/35 whitespace-nowrap">
            TERIMA
          </span>
        );
      case 'TOLAK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/35 whitespace-nowrap">
            TOLAK
          </span>
        );
      case 'KONFIRMASI':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/35 whitespace-nowrap">
            KONFIRMASI
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
            BATAL
          </span>
        );
    }
  };

  const resolveImageUrl = (f: FrameEvaluationItem, sampleId?: string) => {
    let url = f.image_url || '';
    if (url.includes('/data/data/')) {
      url = url.replace('/data/data/', '/data/');
    }
    if (!url && sampleId) {
      url = `/data/synthetic/${sampleId}/frame_0${f.frame_idx}.jpg`;
    } else if (url && !url.startsWith('http')) {
      url = url.startsWith('/') ? url : `/${url}`;
    }
    return url;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* 1. Left Table List */}
      <div className="lg:col-span-7">
        <SampleTable
          samples={samples}
          filtered={filtered}
          selectedSample={selectedSample}
          onSelectSample={setSelectedSample}
          filterDecision={filterDecision}
          onChangeFilter={setFilterDecision}
          getStatusBadge={getStatusBadge}
          isLightMode={isLightMode}
        />
      </div>

      {/* 2. Detail Inspector Panel */}
      <div className="lg:col-span-5">
        <SampleDetailPanel
          selectedSample={selectedSample}
          onSelectFrame={setLightboxFrame}
          resolveImageUrl={resolveImageUrl}
          getStatusBadge={getStatusBadge}
          isLightMode={isLightMode}
        />
      </div>

      {/* 3. High-Resolution Frame Modal / Lightbox */}
      <SampleLightboxModal
        frame={lightboxFrame}
        sampleId={selectedSample?.id}
        onClose={() => setLightboxFrame(null)}
        resolveImageUrl={resolveImageUrl}
        getStatusBadge={getStatusBadge}
        isLightMode={isLightMode}
      />
    </div>
  );
};
