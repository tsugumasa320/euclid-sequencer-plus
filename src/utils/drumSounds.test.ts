import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Tone from 'tone';
import { DrumMachine, renderDrumHitToArray } from './drumSounds';

let nowValue = 0;
const createdPolySynths: MockPolySynth[] = [];
const createdNoiseSynths: MockNoiseSynth[] = [];
const createdGains: MockGain[] = [];

const setValueAtTime = vi.fn();
const cancelScheduledValues = vi.fn();

class MockGain {
  gain: { value: number; setValueAtTime: typeof setValueAtTime; cancelScheduledValues: typeof cancelScheduledValues };
  constructor(value = 1) {
    this.gain = {
      value,
      setValueAtTime,
      cancelScheduledValues,
    };
  }
  connect = vi.fn(() => this);
  toDestination = vi.fn(() => this);
  dispose = vi.fn();
}

class MockPolySynth {
  triggerAttackRelease = vi.fn();
  connect = vi.fn(() => this);
  dispose = vi.fn();
}

class MockNoiseSynth {
  triggerAttackRelease = vi.fn();
  connect = vi.fn((destination?: any) => destination ?? this);
  dispose = vi.fn();
}

class MockFilter {
  connect = vi.fn((destination?: any) => destination);
  dispose = vi.fn();
}

vi.mock('tone', () => {
  const fakeTransport = {
    start: vi.fn(),
    scheduleOnce: vi.fn(),
  };

  return {
    PolySynth: vi.fn(() => {
      const inst = new MockPolySynth();
      createdPolySynths.push(inst);
      return inst;
    }),
    NoiseSynth: vi.fn(() => {
      const inst = new MockNoiseSynth();
      createdNoiseSynths.push(inst);
      return inst;
    }),
    MembraneSynth: vi.fn(),
    Gain: vi.fn((value?: number) => {
      const inst = new MockGain(value);
      createdGains.push(inst);
      return inst;
    }),
    Filter: vi.fn(() => new MockFilter()),
    now: vi.fn(() => nowValue),
    Offline: vi.fn((callback: any, duration: number) => {
      const buffer = {
        getChannelData: vi.fn(() => new Float32Array([0.1, 0.2, 0.3])),
      };
      callback({ transport: fakeTransport });
      return Promise.resolve(buffer);
    }),
    __transport: fakeTransport,
  };
});

describe('DrumMachine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setValueAtTime.mockClear();
    cancelScheduledValues.mockClear();
    createdPolySynths.length = 0;
    createdNoiseSynths.length = 0;
    createdGains.length = 0;
    nowValue = 0;
  });

  it('初期化時に全シンセとゲインが期待値で生成される', () => {
    new DrumMachine();

    expect(Tone.PolySynth).toHaveBeenCalledTimes(2); // kick, perc
    expect(Tone.NoiseSynth).toHaveBeenCalledTimes(4); // snare, hihat, crash, clap
    expect(Tone.Gain).toHaveBeenCalledTimes(7); // 6 per-track + master

    const gainCalls = (Tone.Gain as vi.Mock).mock.calls.map(([value]) => value);
    expect(gainCalls).toEqual(expect.arrayContaining([0.8, 0.9, 0.8, 0.5, 0.2, 0.7, 0.6]));
  });

  it('cancels pending gain automation when retriggered quickly', () => {
    const machine = new DrumMachine();

    nowValue = 0;
    machine.trigger('kick', 0.5);

    nowValue = 0.05;
    machine.trigger('kick', 0.2);

    expect(cancelScheduledValues).toHaveBeenNthCalledWith(1, 0);
    expect(cancelScheduledValues).toHaveBeenNthCalledWith(2, 0.05);

    const calls = setValueAtTime.mock.calls.map(([value, time]) => [Number(value), Number(time)]);
    expect(calls).toEqual(expect.arrayContaining([[0.45, 0], [0.9, 0.1]]));
    expect(calls.some(([value, time]) => Math.abs(value - 0.18) < 1e-6 && time === 0.05)).toBe(true);
    expect(calls.some(([value, time]) => Math.abs(value - 0.9) < 1e-6 && Math.abs(time - 0.15) < 1e-6)).toBe(true);
  });

  it('clamps hit volume between 0 and 1', () => {
    const machine = new DrumMachine();

    machine.trigger('kick', 2, 1.2);
    machine.trigger('kick', -1, 2);

    expect(setValueAtTime).toHaveBeenCalledWith(0.9, 1.2); // clamped to 1.0
    expect(setValueAtTime).toHaveBeenCalledWith(0, 2);     // clamped to 0.0
  });

  it('keeps trigger times monotonic per drum type', () => {
    const machine = new DrumMachine();

    machine.trigger('snare', 0.5, 1.0);
    machine.trigger('snare', 0.5, 1.0); // equal to last
    machine.trigger('snare', 0.5, 0.5); // earlier than last

    const times = setValueAtTime.mock.calls
      .filter(([, time]) => time === 1.0 || time === 0.5 || time > 1.0)
      .map(([, time]) => Number(time));

    expect(times.some(time => time > 1.0)).toBe(true);
  });

  it('各ドラムタイプが正しいノート/長さでトリガーされる', () => {
    const machine = new DrumMachine();
    nowValue = 1;

    machine.trigger('kick');
    machine.trigger('perc', 0.5, 2);

    machine.trigger('snare', 0.5, 3);
    machine.trigger('hihat', 0.5, 4);
    machine.trigger('crash', 0.5, 5);
    machine.trigger('clap', 0.5, 6);

    const [kickSynth, percSynth] = createdPolySynths;
    const [snare, hihat, crash, clap] = createdNoiseSynths;

    expect(kickSynth.triggerAttackRelease).toHaveBeenCalledWith('C1', '8n', 1);
    expect(percSynth.triggerAttackRelease).toHaveBeenCalledWith('G3', '8n', 2);
    expect(snare.triggerAttackRelease).toHaveBeenCalledWith('8n', 3);
    expect(hihat.triggerAttackRelease).toHaveBeenCalledWith('16n', 4);
    expect(crash.triggerAttackRelease).toHaveBeenCalledWith('2n', 5);

    expect(clap.triggerAttackRelease).toHaveBeenCalledTimes(3);
    expect(clap.triggerAttackRelease).toHaveBeenNthCalledWith(1, '32n', 6);
    expect(clap.triggerAttackRelease).toHaveBeenNthCalledWith(2, '32n', 6.01);
    expect(clap.triggerAttackRelease).toHaveBeenNthCalledWith(3, '32n', 6.02);
  });

  it('未知のドラムタイプでも例外を投げない', () => {
    const machine = new DrumMachine();
    expect(() => machine.trigger('unknown', 0.5)).not.toThrow();
  });

  it('マスターボリュームを0-1にクランプする', () => {
    const machine = new DrumMachine();
    const masterGain = (machine as any).masterGain as MockGain;

    machine.setMasterVolume(150);
    expect(masterGain.gain.value).toBe(1);

    machine.setMasterVolume(-10);
    expect(masterGain.gain.value).toBe(0);
  });

  it('disposeで全シンセとゲインを解放する', () => {
    const machine = new DrumMachine();

    machine.dispose();

    createdPolySynths.forEach(instance => {
      expect(instance.dispose).toHaveBeenCalledTimes(1);
    });
    createdNoiseSynths.forEach(instance => {
      expect(instance.dispose).toHaveBeenCalledTimes(1);
    });
    createdGains.forEach(instance => {
      expect(instance.dispose).toHaveBeenCalledTimes(1);
    });
  });

  it('Tone.Offline経由でヒットをFloat32Arrayとして取得できる', async () => {
    const data = await renderDrumHitToArray('kick', 0.5);

    expect(Tone.Offline).toHaveBeenCalledWith(expect.any(Function), 0.5);
    expect(data).toBeInstanceOf(Float32Array);

    const transport = (Tone as any).__transport;
    expect(transport.start).toHaveBeenCalled();
    expect(transport.scheduleOnce).toHaveBeenCalledWith(expect.any(Function), 0.5);
  });
});
