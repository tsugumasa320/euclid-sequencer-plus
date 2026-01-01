import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { Track, TransportState } from '../types';
import { DrumMachine } from '../utils/drumSounds';

interface AudioHook {
  isReady: boolean;
  currentStep: number;
  startAudio: () => Promise<void>;
  stopAudio: () => void;
  updateTempo: (bpm: number) => void;
  updateSwing: (swing: number) => void;
  triggerTrack: (trackId: string) => void;
  updateMasterVolume: (volume: number) => void;
  updateTimeSignature: (timeSignature: string) => void;
}

export const useAudio = (
  tracks: Track[],
  transport: TransportState,
  onStepChange?: (step: number) => void
): AudioHook => {
  const [isReady, setIsReady] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const drumMachineRef = useRef<DrumMachine | null>(null);
  const cycleLengthRef = useRef(16);
  const tracksRef = useRef<Track[]>(tracks);
  const transportRef = useRef<TransportState>(transport);
  const onStepChangeRef = useRef<(step: number) => void | undefined>(onStepChange);

  const isPlayingRef = useRef(false);
  const currentStepRef = useRef(0);
  const scheduleIdRef = useRef<number | null>(null);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    transportRef.current = transport;
  }, [transport]);

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  // Initialize audio context and drum machine
  useEffect(() => {
    const initAudio = () => {
      try {
        // Don't create DrumMachine until user gesture
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initAudio();

    return () => {
      if (drumMachineRef.current) {
        drumMachineRef.current.dispose();
      }
    };
  }, []);

  // Keep scheduling cycle aligned with track lengths and time signature
  useEffect(() => {
    const nextCycle = calculateCycleLength(tracksRef.current, transportRef.current.timeSignature);
    const safeCycle = Math.max(1, nextCycle);
    cycleLengthRef.current = safeCycle;
    currentStepRef.current = currentStepRef.current % safeCycle;
    setCurrentStep(prev => prev % safeCycle);
  }, [tracks, transport.timeSignature]);

  const triggerDrumSound = (trackId: string, volume: number = 0.8, time?: number) => {
    if (drumMachineRef.current) {
      drumMachineRef.current.trigger(trackId, volume, time);
    }
  };

  const nextStep = useCallback(() => {
    const cycle = Math.max(1, cycleLengthRef.current);
    currentStepRef.current = (currentStepRef.current + 1) % cycle;
  }, []);

  const schedule = useCallback((step: number, time: number) => {
    const t = Math.max(time, Tone.now() + 0.001);
    const currentTracks = tracksRef.current;

    const hasSolo = currentTracks.some(track => track.solo);

    currentTracks.forEach(track => {
      const steps = Math.max(1, track.steps);
      const stepInPattern = step % steps;
      const shouldPlay = !track.muted &&
        track.pattern[stepInPattern] &&
        (!hasSolo || track.solo);

      if (shouldPlay) {
        const volume = track.volume / 100;
        triggerDrumSound(track.id, volume, t);
      }
    });

    setCurrentStep(step);
    const cb = onStepChangeRef.current;
    if (cb) {
      cb(step);
    }
  }, []);

  useEffect(() => {
    if (!isPlayingRef.current) return;
    if (scheduleIdRef.current === null) return;

    Tone.Transport.clear(scheduleIdRef.current);
    scheduleIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      schedule(currentStepRef.current, time);
      nextStep();
    }, '16n');
  }, [tracks, schedule, nextStep]);

  const startAudio = useCallback(async (): Promise<void> => {
    if (isPlayingRef.current) return;

    try {
      await Tone.start();

      if (!drumMachineRef.current) {
        drumMachineRef.current = new DrumMachine();
      }

      Tone.Transport.bpm.value = transportRef.current.bpm;
      Tone.Transport.swing = transportRef.current.swing / 100;
      Tone.Transport.swingSubdivision = '16n';

      const signature = parseTimeSignature(transportRef.current.timeSignature);
      if (signature) {
        Tone.Transport.timeSignature = signature;
      }

      isPlayingRef.current = true;
      currentStepRef.current = currentStepRef.current % Math.max(1, cycleLengthRef.current);

      if (scheduleIdRef.current !== null) {
        Tone.Transport.clear(scheduleIdRef.current);
      }
      scheduleIdRef.current = Tone.Transport.scheduleRepeat((time) => {
        schedule(currentStepRef.current, time);
        nextStep();
      }, '16n');

      Tone.Transport.start();
    } catch (error) {
      console.error('Failed to start audio:', error);
    }
  }, [schedule, nextStep]);

  const stopAudio = useCallback(() => {
    isPlayingRef.current = false;

    if (scheduleIdRef.current !== null) {
      Tone.Transport.clear(scheduleIdRef.current);
      scheduleIdRef.current = null;
    }

    Tone.Transport.stop();

    currentStepRef.current = 0;
    setCurrentStep(0);
  }, []);

  const updateTempo = (bpm: number) => {
    if (isPlayingRef.current) {
      Tone.Transport.bpm.value = bpm;
    }
  };

  const updateSwing = (swing: number) => {
    if (isPlayingRef.current) {
      Tone.Transport.swing = swing / 100;
    }
  };

  const triggerTrack = (trackId: string) => {
    if (drumMachineRef.current && isPlayingRef.current) {
      triggerDrumSound(trackId, 0.8);
    }
  };

  const updateMasterVolume = (volume: number) => {
    if (drumMachineRef.current) {
      drumMachineRef.current.setMasterVolume(volume / 100);
    }
  };

  const updateTimeSignature = (timeSignature: string) => {
    if (!isPlayingRef.current) return;

    const parsed = parseTimeSignature(timeSignature);
    if (parsed) {
      Tone.Transport.timeSignature = parsed;
    }
  };

  return {
    isReady,
    currentStep,
    startAudio,
    stopAudio,
    updateTempo,
    updateSwing,
    triggerTrack,
    updateMasterVolume,
    updateTimeSignature
  };
};

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function timeSignatureToSteps(timeSignature: string): number {
  const parsed = parseTimeSignature(timeSignature);
  if (!parsed) {
    return 16;
  }

  const [numerator, denominator] = parsed;
  const stepsPerBeat = Math.max(1, Math.floor(16 / denominator));
  return Math.max(1, numerator * stepsPerBeat);
}

function calculateCycleLength(tracks: Track[], timeSignature: string): number {
  const trackSteps = tracks
    .map(track => track.steps)
    .filter(steps => Number.isFinite(steps) && steps > 0);

  const signatureSteps = timeSignatureToSteps(timeSignature);
  const lengths = [...trackSteps, signatureSteps].filter(Boolean);

  if (lengths.length === 0) return 16;
  return lengths.reduce((acc, value) => lcm(acc, value));
}

function parseTimeSignature(timeSignature: string): [number, number] | null {
  const [numeratorStr, denominatorStr] = timeSignature.split('/');
  const numerator = parseInt(numeratorStr, 10);
  const denominator = parseInt(denominatorStr, 10);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }

  return [numerator, denominator];
}
