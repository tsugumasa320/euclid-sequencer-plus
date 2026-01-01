export interface EuclidParams {
  steps: number;
  hits: number;
  bias: number;
  rotation: number;
}

export interface Track {
  id: string;
  name: string;
  steps: number;
  hits: number;
  bias: number;
  rotation: number;
  volume: number;
  muted: boolean;
  solo: boolean;
  pattern: boolean[];
  color: string;
}

export interface TransportState {
  isPlaying: boolean;
  bpm: number;
  swing: number;
  timeSignature: string;
  currentStep: number;
}

export interface AppState {
  transport: TransportState;
  tracks: Track[];
  masterVolume: number;
  selectedTrackId: string | null;
}

export type TrackType = 'kick' | 'snare' | 'hihat' | 'crash' | 'perc' | 'clap';