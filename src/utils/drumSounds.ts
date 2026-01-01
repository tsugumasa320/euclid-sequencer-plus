import * as Tone from 'tone';

export class DrumMachine {
  private players: Map<string, Tone.PolySynth | Tone.NoiseSynth> = new Map();
  private gains: Map<string, Tone.Gain> = new Map();
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
    
    const snareFilter = new Tone.Filter({
      frequency: 2000,
      type: 'bandpass',
      Q: 1
    });
    
    const snareGain = new Tone.Gain(0.8).connect(this.masterGain);
    snare.connect(snareFilter);
    snareFilter.connect(snareGain);
    this.players.set('snare', snare);
    this.gains.set('snare', snareGain);

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
    
    const hihatFilter = new Tone.Filter({
      frequency: 8000,
      type: 'highpass',
      Q: 1
    });
    
    const hihatGain = new Tone.Gain(0.5).connect(this.masterGain);
    hihat.connect(hihatFilter);
    hihatFilter.connect(hihatGain);
    this.players.set('hihat', hihat);
    this.gains.set('hihat', hihatGain);

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
    
    const crashFilter = new Tone.Filter({
      frequency: 4000,
      type: 'highpass',
      Q: 0.5
    });
    
    const crashReverb = new Tone.Reverb({
      decay: 3,
      wet: 0.3
    });
    
    const crashGain = new Tone.Gain(0.2).connect(this.masterGain);
    crash.connect(crashFilter);
    crashFilter.connect(crashReverb);
    crashReverb.connect(crashGain);
    this.players.set('crash', crash);
    this.gains.set('crash', crashGain);

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
  }

  public trigger(drumType: string, volume: number = 0.8, time?: number) {
    const now = time || Tone.now();
    const player = this.players.get(drumType);
    const gain = this.gains.get(drumType);
    
    if (!player || !gain) return;

    const clampedVolume = Math.min(Math.max(volume, 0), 1);

    // Adjust gain for this hit
    const originalGain = gain.gain.value;
    gain.gain.setValueAtTime(originalGain * clampedVolume, now);
    
    switch (drumType) {
      case 'kick':
        (player as Tone.PolySynth).triggerAttackRelease('C1', '8n', now);
        break;
        
      case 'snare':
        (player as Tone.NoiseSynth).triggerAttackRelease('8n', now);
        break;
        
      case 'hihat':
        (player as Tone.NoiseSynth).triggerAttackRelease('16n', now);
        break;
        
      case 'crash':
        (player as Tone.NoiseSynth).triggerAttackRelease('2n', now);
        break;
        
      case 'perc':
        (player as Tone.PolySynth).triggerAttackRelease('G3', '8n', now);
        break;
        
      case 'clap':
        // Multiple quick bursts for clap effect
        const clapPlayer = player as Tone.NoiseSynth;
        clapPlayer.triggerAttackRelease('32n', now);
        clapPlayer.triggerAttackRelease('32n', now + 0.01);
        clapPlayer.triggerAttackRelease('32n', now + 0.02);
        break;
    }
    
    // Reset gain after a short delay
    gain.gain.setValueAtTime(originalGain, now + 0.1);
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
    this.masterGain.dispose();
  }
}
