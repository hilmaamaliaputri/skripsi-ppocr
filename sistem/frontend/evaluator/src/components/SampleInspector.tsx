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
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#16A36A]/10 text-[#16A36A] dark:text-[#38C98A] border border-[#16A36A]/30 whitespace-nowrap">
            TERIMA
          </span>
        );
      case 'TOLAK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 whitespace-nowrap">
            TOLAK
          </span>
        );
      case 'KONFIRMASI':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 whitespace-nowrap">
            KONFIRMASI
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-slate-900 text-slate-400 border border-slate-700 whitespace-nowrap">
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
      {/* 1. Left Table List */}
      <div className="lg:col-span-2">
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
      <div className="lg:col-span-1">
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
