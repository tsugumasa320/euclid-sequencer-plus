import '@testing-library/jest-dom';

// Basic Web Audio mocks for tests
(globalThis as any).AudioContext = class MockAudioContext {
  createGain() { return { connect: () => {}, gain: { value: 0 } }; }
  createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
  destination = { connect: () => {} };
  sampleRate = 44100;
  currentTime = 0;
  state = 'running';
  resume = () => Promise.resolve();
  suspend = () => Promise.resolve();
  close = () => Promise.resolve();
};

(globalThis as any).webkitAudioContext = (globalThis as any).AudioContext;
