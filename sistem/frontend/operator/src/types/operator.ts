export type DecisionType = 'TERIMA' | 'TOLAK' | 'KONFIRMASI' | 'BATAL';

export interface LayerResult {
  layer_name: string;
  passed: boolean;
  score: number;
  reason?: string;
}

export interface FrameItem {
  frame_idx: number;
  image_url?: string;
  raw_text: string;
  confidence: number;
  decision: DecisionType;
}

export interface BurstProcessResponse {
  status: string;
  transaction_id: string;
  timestamp: string;
  decision: DecisionType;
  final_value: string | null;
  raw_prediction: string;
  confidence: number;
  calibrated_confidence: number;
  layers: {
    temporal: LayerResult;
    structural: LayerResult;
    physical: LayerResult;
    calibration: LayerResult;
  };
  latency_ms: number;
  device_id: string;
  product_id: string;
  frames?: FrameItem[];
}

export interface TransactionItem {
  id: string;
  timestamp: string;
  device_id: string;
  product_id: string;
  final_value: string;
  decision: DecisionType;
  confidence: number;
  latency_ms: number;
  operator_id?: string;
  note?: string;
}

export interface DeviceConfig {
  id: string;
  name: string;
  slot_count: number;
  decimal_places: number;
  display_type: string;
}

export interface ProductConfig {
  id: string;
  name: string;
  target_weight: number;
  min_weight: number;
  max_weight: number;
  tolerance_pct: number;
}
