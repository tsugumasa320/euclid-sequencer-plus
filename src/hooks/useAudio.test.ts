import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useAudio } from './useAudio';
import { Track, TransportState } from '../types';
import { generateEuclidPattern } from '../utils/euclidAlgorithm';

// Hoisted mocks so vi.mock can reference them
const toneMocks = vi.hoisted(() => {
  let nowValue = 0;
  return {
    get now() {
      return nowValue;
    },
    set now(value: number) {
      nowValue = value;
    },
    start: vi.fn(() => Promise.resolve()),
    nowFn: vi.fn(() => nowValue),
  };
});

const drumMocks = vi.hoisted(() => {
  const instance = {
    trigger: vi.fn(),
    setMasterVolume: vi.fn(),
    dispose: vi.fn(),
  };
  return {
    instance,
    factory: vi.fn(() => instance),
  };
});

// Mock Tone.js to avoid real audio work
vi.mock('tone', () => ({
  start: toneMocks.start,
  now: toneMocks.nowFn,
  Transport: {
    bpm: { value: 120 },
    swing: 0,
    timeSignature: [4, 4],
    start: vi.fn(),
    stop: vi.fn(),
    clear: vi.fn(),
    scheduleRepeat: vi.fn(() => 1),
  },
}));

// Mock DrumMachine
vi.mock('../utils/drumSounds', () => ({
  DrumMachine: drumMocks.factory,
}));

const mockTracks: Track[] = [
  {
    id: 'kick',
    name: 'Kick',
    steps: 16,
    hits: 4,
    bias: 0.5,
    rotation: 0,
    volume: 70,
    muted: false,
    solo: false,
    pattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    color: '#ff6b6b',
  },
];

const mockTransport: TransportState = {
  isPlaying: false,
  bpm: 120,
  swing: 0,
  timeSignature: '4/4',
  currentStep: 0,
};

describe('useAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toneMocks.now = 0;
    toneMocks.start.mockClear();
    toneMocks.nowFn.mockClear();
    drumMocks.instance.trigger.mockClear();
    drumMocks.instance.setMasterVolume.mockClear();
    drumMocks.instance.dispose.mockClear();
    drumMocks.factory.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes and starts/stops without errors', async () => {
    const { result, unmount } = renderHook(() => useAudio(mockTracks, mockTransport));

    expect(result.current.isReady).toBe(true);

    await act(async () => {
      await result.current.startAudio();
    });

    act(() => {
      result.current.stopAudio();
    });

    expect(result.current.currentStep).toBe(0);
    unmount();
  });

  it('clamps cycle when steps change at runtime', () => {
    const onStepChange = vi.fn();
    const { rerender, result, unmount } = renderHook(
      ({ tracks, transport }) => useAudio(tracks, transport, onStepChange),
      { initialProps: { tracks: mockTracks, transport: mockTransport } }
    );

    const updatedTracks = [{ ...mockTracks[0], steps: 8, pattern: Array(8).fill(false) }];
    rerender({ tracks: updatedTracks, transport: mockTransport });

    expect(result.current.currentStep).toBeLessThan(8);
    unmount();
  });

  it('updates master volume safely', () => {
    const { result, unmount } = renderHook(() => useAudio(mockTracks, mockTransport));

    act(() => {
      result.current.updateMasterVolume(150); // should clamp internally
    });

    expect(() => result.current.updateMasterVolume(-10)).not.toThrow();
    unmount();
  });

});
