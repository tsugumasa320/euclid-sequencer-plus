import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TrackCircle from './TrackCircle';
import { Track } from '../types';

const baseTrack: Track = {
  id: 'kick',
  name: 'Kick',
  steps: 16,
  hits: 4,
  bias: 0.5,
  rotation: 0,
  volume: 70,
  muted: false,
  solo: false,
  pattern: [],
  color: '#ff6b6b',
};

describe('TrackCircle', () => {
  it('renders even if pattern is empty', () => {
    const { getByText } = render(
      <TrackCircle
        track={{ ...baseTrack, pattern: [] }}
        isSelected={false}
        currentStep={0}
        onClick={() => {}}
      />
    );

    expect(getByText('Kick')).toBeTruthy();
    expect(getByText('4/16')).toBeTruthy();
  });

  it('renders safely when steps is 0', () => {
    const { getByText } = render(
      <TrackCircle
        track={{ ...baseTrack, steps: 0, hits: 0, pattern: [] }}
        isSelected={false}
        currentStep={5}
        onClick={() => {}}
      />
    );

    expect(getByText('Kick')).toBeTruthy();
    expect(getByText('0/0')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
  });
});
