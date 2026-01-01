import { describe, it, expect } from 'vitest';
import { generateEuclidPattern } from './euclidAlgorithm';

describe('generateEuclidPattern', () => {
  it('returns empty pattern for invalid step counts', () => {
    expect(generateEuclidPattern({ steps: 0, hits: 2, bias: 0.5, rotation: 0 })).toEqual([]);
    expect(generateEuclidPattern({ steps: -4, hits: 2, bias: 0.5, rotation: 0 })).toEqual([]);
  });

  it('maintains hit count after bias and rotation', () => {
    const pattern = generateEuclidPattern({ steps: 8, hits: 3, bias: 0.7, rotation: 2 });
    expect(pattern.filter(Boolean).length).toBe(3);
    expect(pattern.length).toBe(8);
  });
});
