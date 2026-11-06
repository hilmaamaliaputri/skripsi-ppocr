export interface BootstrapCI {
  lower: number;
  upper: number;
  mean: number;
}

export interface MetricStats {
  fsr: number;
  cer: number;
  decimal_acc: number;
  silent_error: number;
  coverage: number;
  selective_acc: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
  bootstrap_ci?: {
    fsr: BootstrapCI;
    cer: BootstrapCI;
    silent_error: BootstrapCI;
  };
}

export interface RiskCoverageCoord {
  coverage: number;
  risk: number;
  threshold: number;
}

export interface CalibrationBin {
  bin_lower: number;
  bin_upper: number;
  avg_confidence: number;
  accuracy: number;
  count: number;
}

export interface LayerCheck {
  layer_name: string;
  passed: boolean;
  score: number;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface FrameEvaluationItem {
  frame_idx: number;
  image_url?: string;
  raw_text: string;
  normalized_text: string;
  confidence: number;
  decision: 'TERIMA' | 'TOLAK' | 'KONFIRMASI' | 'BATAL';
}

export interface SampleEvaluation {
  id: string;
  device_id: string;
  product_id: string;
  gt_value: string;
  pred_raw: string;
  pred_normalized: string;
  raw_confidence: number;
  calibrated_confidence: number;
  decision: 'TERIMA' | 'TOLAK' | 'KONFIRMASI' | 'BATAL';
  is_correct: boolean;
  is_silent_error: boolean;
  layers: {
    temporal: LayerCheck;
    structural: LayerCheck;
    physical: LayerCheck;
    calibration: LayerCheck;
  };
  latency_ms: number;
  detected_slots?: number;
  detected_decimal_pos?: number;
  frames?: FrameEvaluationItem[];
}

export interface CalibrationResult {
  optimal_temperature: number;
  ece_before: number;
  ece_after: number;
  bins_before: CalibrationBin[];
  bins_after: CalibrationBin[];
}

export interface BenchmarkResponse {
  status: string;
  manifest_name: string;
  sample_count: number;
  execution_time_s: number;
  temperature_used: number;
  confidence_threshold: number;
  metrics: MetricStats;
  risk_coverage: {
    coords: RiskCoverageCoord[];
    aurc: number;
  };
  calibration: CalibrationResult;
  samples: SampleEvaluation[];
}
