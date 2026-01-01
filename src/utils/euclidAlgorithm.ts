import { EuclidParams } from '../types';

/**
 * Max v8 Euclidean algorithm implementation
 * Ported from JavaScript with bias and rotation features
 */

export function generateEuclidPattern(params: EuclidParams): boolean[] {
  const { steps, hits, bias, rotation } = params;

  if (steps <= 0 || hits < 0 || hits > steps) {
    const length = Math.max(0, steps);
    return new Array(length).fill(false);
  }

  // 1. Basic Euclidean algorithm
  let result = new Array(steps);
  for (let i = 0; i < steps; i++) {
    result[i] = ((i * hits) % steps) < hits ? 1 : 0;
  }

  // 2. Apply bias if not 0.5 (neutral)
  if (bias !== 0.5) {
    result = applyHalfBias01(result, bias);
  }

  // 3. Apply rotation/shift
  if (rotation !== 0) {
    result = rotate(result, rotation);
  }

  return result.map(v => v === 1);
}

/**
 * Rotate array (positive = clockwise)
 */
function rotate(arr: number[], amount: number): number[] {
  const n = arr.length;
  if (n <= 0) return arr;

  let shift = amount % n;
  if (shift < 0) shift += n;
  if (shift === 0) return arr;

  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[(i + shift) % n] = arr[i];
  }
  return out;
}

/**
 * Apply bias: 0.0-1.0, 0.5=neutral, <0.5 front-heavy, >0.5 back-heavy
 * Maintains hit count while adjusting distribution
 */
function applyHalfBias01(arr: number[], bias01: number): number[] {
  const n = arr.length;
  const half = Math.floor(n / 2);

  // Count hits
  let hits = 0;
  for (let i = 0; i < n; i++) {
    if (arr[i] === 1) hits++;
  }

  // Front ratio = 1 - bias01
  // bias01=0   -> front 100%
  // bias01=0.5 -> front 50% (neutral, shouldn't be called)
  // bias01=1   -> front 0%
  const frontRatio = 1.0 - bias01;
  const targetFront = Math.round(hits * frontRatio);

  // Get center-ordered indices for front and back halves
  const frontOrder = centerOrder(0, half);
  const backOrder = centerOrder(half, n - half);

  // Clear all, then place front hits, then back hits
  const out = new Array(n).fill(0);
  let placed = 0;

  // Place front hits
  for (let a = 0; a < frontOrder.length && placed < targetFront; a++) {
    out[frontOrder[a]] = 1;
    placed++;
  }

  // Place remaining hits in back
  for (let b = 0; b < backOrder.length && placed < hits; b++) {
    out[backOrder[b]] = 1;
    placed++;
  }

  // Fallback: place any remaining hits anywhere available
  if (placed < hits) {
    for (let i = 0; i < n && placed < hits; i++) {
      if (out[i] === 0) {
        out[i] = 1;
        placed++;
      }
    }
  }

  return out;
}

/**
 * Order indices from start..start+len-1 by distance from center
 */
function centerOrder(start: number, len: number): number[] {
  const out: number[] = [];
  if (len <= 0) return out;

  const center = start + (len - 1) / 2.0;

  const tmp: Array<{idx: number, d: number}> = [];
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    tmp.push({ idx, d: Math.abs(idx - center) });
  }

  tmp.sort((a, b) => {
    if (a.d < b.d) return -1;
    if (a.d > b.d) return 1;
    return a.idx - b.idx;
  });

  for (let k = 0; k < tmp.length; k++) {
    out.push(tmp[k].idx);
  }

  return out;
}
