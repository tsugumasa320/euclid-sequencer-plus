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
  
  // Timing variables - exact copy from moistpeace.com
  const isPlayingRef = useRef(false);
  const currentStepRef = useRef(0);
  const scheduleIdRef = useRef<number | null>(null);

  // Keep refs in sync with latest props
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
    const initAudio = async () => {
      try {
        drumMachineRef.current = new DrumMachine();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initAudio();

    return () => {
      // Cleanup
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

  // Trigger drum sounds using DrumMachine
  const triggerDrumSound = (trackId: string, volume: number = 0.8, time?: number) => {
    if (drumMachineRef.current) {
      drumMachineRef.current.trigger(trackId, volume, time);
    }
  };

  // nextStep function - keep step counter in sync with cycle
  const nextStep = useCallback(() => {
    const cycle = Math.max(1, cycleLengthRef.current);
    currentStepRef.current = (currentStepRef.current + 1) % cycle;
  }, []);

  // schedule function - exact copy from moistpeace.com
  const schedule = useCallback((step: number, time: number) => {
    const t = Math.max(time, Tone.now() + 0.001);
    const currentTracks = tracksRef.current;

    // Check if any track has solo enabled
    const hasSolo = currentTracks.some(track => track.solo);
    
    // Trigger drums - equivalent to moistpeace.com drum loop
    currentTracks.forEach(track => {
      const stepInPattern = step % track.steps;
      const shouldPlay = !track.muted && 
                       track.pattern[stepInPattern] && 
                       (!hasSolo || track.solo);
      
      if (shouldPlay) {
        const volume = track.volume / 100;
        triggerDrumSound(track.id, volume, t);
      }
    });

    // Update step indicators - equivalent to moistpeace.com visual update
    setCurrentStep(step);
    const cb = onStepChangeRef.current;
    if (cb) {
      cb(step);
    }
  }, [triggerDrumSound]);

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
    if (!isReady) return;

    try {
      await Tone.start();
      Tone.Transport.bpm.value = transportRef.current.bpm;
      Tone.Transport.swing = transportRef.current.swing / 100;
      Tone.Transport.swingSubdivision = '16n';

      // Initialize timing variables - exact copy from moistpeace.com
      isPlayingRef.current = true;
      currentStepRef.current = currentStepRef.current % Math.max(1, cycleLengthRef.current);

      // Schedule using Tone.Transport to survive scroll throttling
      if (scheduleIdRef.current === null) {
        scheduleIdRef.current = Tone.Transport.scheduleRepeat((time) => {
          schedule(currentStepRef.current, time);
          nextStep();
        }, '16n');
      }
      Tone.Transport.start();
    } catch (error) {
      console.error('Failed to start audio:', error);
    }
  }, [isReady, schedule, nextStep]);

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
    Tone.Transport.bpm.value = bpm;
  };

  const updateSwing = (swing: number) => {
    Tone.Transport.swing = swing / 100;
  };

  const triggerTrack = (trackId: string) => {
    triggerDrumSound(trackId, 0.8);
  };

  // Update master volume
  const updateMasterVolume = (volume: number) => {
    if (drumMachineRef.current) {
      drumMachineRef.current.setMasterVolume(volume / 100);
    }
  };

  // Update time signature
  const updateTimeSignature = (_timeSignature: string) => {
    const parsed = parseTimeSignature(_timeSignature);
    if (parsed) {
      Tone.Transport.timeSignature = parsed;
    }
  };

  // Ensure playback state follows transport and readiness
  useEffect(() => {
    if (transport.isPlaying) {
      startAudio();
    } else {
      stopAudio();
    }
  }, [transport.isPlaying, startAudio, stopAudio]);

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
