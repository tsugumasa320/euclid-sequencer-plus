import * as Tone from 'tone';

export class DrumMachine {
  private players: Map<string, Tone.PolySynth | Tone.NoiseSynth> = new Map();
  private gains: Map<string, Tone.Gain> = new Map();
  private baseGains: Map<string, number> = new Map();
  private lastTriggerTimes: Map<string, number> = new Map();
  private masterGain: Tone.Gain;

  constructor() {
    this.masterGain = new Tone.Gain(0.8).toDestination();
    this.initializeSynths();
  }

  private initializeSynths() {
    // 808-style Kick Drum - PolySynth with MembraneSynth
    const kickPolySynth = new Tone.PolySynth(Tone.MembraneSynth, {
      pitchDecay: 0.08,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.5,
        sustain: 0.01,
        release: 1.2,
        attackCurve: 'linear'
      }
    });
    
    const kickGain = new Tone.Gain(0.9).connect(this.masterGain);
    kickPolySynth.connect(kickGain);
    this.players.set('kick', kickPolySynth);
    this.gains.set('kick', kickGain);
    this.baseGains.set('kick', 0.9);

    // 808-style Snare
    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.15,
        sustain: 0.05,
        release: 0.3
      }
    });
    
    const snareGain = new Tone.Gain(0.8).connect(this.masterGain);
    snare.connect(snareGain);
    this.players.set('snare', snare);
    this.gains.set('snare', snareGain);
    this.baseGains.set('snare', 0.8);

    // 808-style Hi-Hat
    const hihat = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.05
      }
    });
    
    const hihatGain = new Tone.Gain(0.5).connect(this.masterGain);
    hihat.connect(hihatGain);
    this.players.set('hihat', hihat);
    this.gains.set('hihat', hihatGain);
    this.baseGains.set('hihat', 0.5);

    // Crash Cymbal
    const crash = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.01,
        decay: 2.5,
        sustain: 0.1,
        release: 4
      }
    });
    
    const crashGain = new Tone.Gain(0.2).connect(this.masterGain);
    crash.connect(crashGain);
    this.players.set('crash', crash);
    this.gains.set('crash', crashGain);
    this.baseGains.set('crash', 0.2);

    // 808-style Percussion - PolySynth with MembraneSynth
    const percPolySynth = new Tone.PolySynth(Tone.MembraneSynth, {
      pitchDecay: 0.02,
      octaves: 1.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 0.8
      }
    });
    
    const percGain = new Tone.Gain(0.7).connect(this.masterGain);
    percPolySynth.connect(percGain);
    this.players.set('perc', percPolySynth);
    this.gains.set('perc', percGain);
    this.baseGains.set('perc', 0.7);

    // 808-style Clap
    const clap = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    });
    
    const clapFilter = new Tone.Filter({
      frequency: 1500,
      type: 'bandpass',
      Q: 2
    });
    
    const clapGain = new Tone.Gain(0.6).connect(this.masterGain);
    clap.connect(clapFilter);
    clapFilter.connect(clapGain);
    this.players.set('clap', clap);
    this.gains.set('clap', clapGain);
    this.baseGains.set('clap', 0.6);
  }

  public trigger(drumType: string, volume: number = 0.8, time?: number) {
    let now = time ?? Tone.now();
    const player = this.players.get(drumType);
    const gain = this.gains.get(drumType);
    
    if (!player || !gain) return;

    const lastTime = this.lastTriggerTimes.get(drumType) ?? -Infinity;
    if (now <= lastTime) {
      now = lastTime + 0.0001;
    }

    const clampedVolume = Math.min(Math.max(volume, 0), 1);

    // Adjust gain for this hit
    const baseGain = this.baseGains.get(drumType) ?? gain.gain.value;
    // Prevent previous scheduled resets from fighting new hits
    if (typeof gain.gain.cancelScheduledValues === 'function') {
      gain.gain.cancelScheduledValues(now);
    }
    gain.gain.setValueAtTime(baseGain * clampedVolume, now);
    
    switch (drumType) {
      case 'kick':
        (player as Tone.PolySynth).triggerAttackRelease('C1', '8n', now);
        this.lastTriggerTimes.set(drumType, now);
        break;
        
      case 'snare':
        (player as Tone.NoiseSynth).triggerAttackRelease('8n', now);
        this.lastTriggerTimes.set(drumType, now);
        break;
        
      case 'hihat':
        (player as Tone.NoiseSynth).triggerAttackRelease('16n', now);
        this.lastTriggerTimes.set(drumType, now);
        break;
        
      case 'crash':
        (player as Tone.NoiseSynth).triggerAttackRelease('2n', now);
        this.lastTriggerTimes.set(drumType, now);
        break;
        
      case 'perc':
        (player as Tone.PolySynth).triggerAttackRelease('G3', '8n', now);
        this.lastTriggerTimes.set(drumType, now);
        break;
        
      case 'clap':
        // Multiple quick bursts for clap effect
        const clapPlayer = player as Tone.NoiseSynth;
        const first = now;
        const second = Math.max(first + 0.01, (this.lastTriggerTimes.get(drumType) ?? -Infinity) + 0.0001);
        const third = Math.max(second + 0.01, second + 0.0001);
        clapPlayer.triggerAttackRelease('32n', first);
        clapPlayer.triggerAttackRelease('32n', second);
        clapPlayer.triggerAttackRelease('32n', third);
        this.lastTriggerTimes.set(drumType, third);
        break;
    }
    
    // Reset gain after a short delay
    gain.gain.setValueAtTime(baseGain, now + 0.1);
  }

  public setMasterVolume(volume: number) {
    const clamped = Math.min(Math.max(volume, 0), 1);
    this.masterGain.gain.value = clamped;
  }

  public dispose() {
    this.players.forEach(player => {
      player.dispose();
    });
    this.gains.forEach(gain => {
      gain.dispose();
    });
    this.players.clear();
    this.gains.clear();
    this.baseGains.clear();
    this.lastTriggerTimes.clear();
    this.masterGain.dispose();
  }
}

/**
 * オフラインレンダリングで単一ヒットをFloat32Arrayとして取得するヘルパー
 */
export async function renderDrumHitToArray(drumType: string, durationSeconds = 1): Promise<Float32Array> {
  const duration = Math.max(0.01, durationSeconds);
  const buffer = await Tone.Offline(({ transport }) => {
    const machine = new DrumMachine();
    machine.trigger(drumType, 1, 0);
    transport.scheduleOnce(() => machine.dispose(), duration);
    transport.start();
  }, duration);

  const channel = buffer.getChannelData(0);
  return channel instanceof Float32Array ? channel : new Float32Array(channel);
}
