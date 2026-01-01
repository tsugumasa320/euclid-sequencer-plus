import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  
  // Timing variables - exact copy from moistpeace.com
  const isPlayingRef = useRef(false);
  const currentStepRef = useRef(0);
  const nextTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  
  // Constants from moistpeace.com
  const lookahead = 0.025; // 25ms
  const ahead = 0.10;      // 100ms ahead scheduling

  const cycleLength = useMemo(() => calculateCycleLength(tracks, transport.timeSignature), [tracks, transport.timeSignature]);

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
      
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, []);

  // Keep scheduling cycle aligned with track lengths and time signature
  useEffect(() => {
    const nextCycle = Math.max(1, cycleLength);
    cycleLengthRef.current = nextCycle;
    currentStepRef.current = currentStepRef.current % nextCycle;
    setCurrentStep(prev => prev % nextCycle);
  }, [cycleLength]);

  // Trigger drum sounds using DrumMachine
  const triggerDrumSound = (trackId: string, volume: number = 0.8, time?: number) => {
    if (drumMachineRef.current) {
      drumMachineRef.current.trigger(trackId, volume, time);
    }
  };

  // nextStep function - exact copy from moistpeace.com
  const nextStep = useCallback(() => {
    const bpm = Math.max(40, Math.min(300, transport.bpm)); // clamp between 40-300
    const swing = Math.max(0, Math.min(0.30, (transport.swing / 100) * 0.30)); // convert swing to ratio
    
    const base = 60 / bpm / 4; // base 16th note duration
    const even = (currentStepRef.current % 2 === 0);
    const interval = base * (even ? (1 + swing) : (1 - swing));
    
    nextTimeRef.current += interval;
    const cycle = Math.max(1, cycleLengthRef.current);
    currentStepRef.current = (currentStepRef.current + 1) % cycle;
  }, [transport.bpm, transport.swing]);

  // schedule function - exact copy from moistpeace.com
  const schedule = useCallback((step: number, time: number) => {
    const t = Math.max(time, Tone.now() + 0.001);

    // Check if any track has solo enabled
    const hasSolo = tracks.some(track => track.solo);
    
    // Trigger drums - equivalent to moistpeace.com drum loop
    tracks.forEach(track => {
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
    if (onStepChange) {
      onStepChange(step);
    }
  }, [tracks, onStepChange, triggerDrumSound]);

  // Main loop function - exact copy from moistpeace.com
  const loop = useCallback(() => {
    if (!isPlayingRef.current) return;
    
    while (nextTimeRef.current < Tone.now() + ahead) {
      schedule(currentStepRef.current, nextTimeRef.current);
      nextStep();
    }
    
    timerIdRef.current = setTimeout(loop, lookahead * 1000); // Convert to ms
  }, [schedule, nextStep]);

  const startAudio = useCallback(async (): Promise<void> => {
    if (isPlayingRef.current) return;
    if (!isReady) return;

    try {
      await Tone.start();

      // Initialize timing variables - exact copy from moistpeace.com
      isPlayingRef.current = true;
      currentStepRef.current = currentStepRef.current % Math.max(1, cycleLengthRef.current);
      nextTimeRef.current = Tone.now();

      // Start the main loop
      loop();
    } catch (error) {
      console.error('Failed to start audio:', error);
    }
  }, [isReady, loop]);

  const stopAudio = useCallback(() => {
    isPlayingRef.current = false;

    // Clear timer
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }

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
