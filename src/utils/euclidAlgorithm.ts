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

  const hits = countHits(arr, 0, n);

  // Front ratio = 1 - bias01
  // bias01=0   -> front 100%
  // bias01=0.5 -> front 50% (neutral, shouldn't be called)
  // bias01=1   -> front 0%
  const frontRatio = 1.0 - bias01;
  const targetFront = Math.round(hits * frontRatio);

  const out = arr.slice();
  const frontHits = countHits(out, 0, half);
  if (frontHits === targetFront) return out;

  const sourceStart = frontHits > targetFront ? 0 : half;
  const sourceLen = frontHits > targetFront ? half : n - half;
  const destStart = frontHits > targetFront ? half : 0;
  const destLen = frontHits > targetFront ? n - half : half;
  const moves = Math.abs(frontHits - targetFront);

  for (let i = 0; i < moves; i++) {
    const sourceHits = rankedHits(out, sourceStart, sourceLen);
    const destEmpties = rankedEmpties(out, destStart, destLen);
    if (sourceHits.length === 0 || destEmpties.length === 0) break;

    const sourceIndex = sourceHits[0];
    const destIndex = destEmpties[0];
    out[sourceIndex] = 0;
    out[destIndex] = 1;
  }

  return out;
}

/**
 * Count hits in range
 */
function countHits(arr: number[], start: number, len: number): number {
  let hits = 0;
  for (let i = 0; i < len; i++) {
    if (arr[start + i] === 1) hits++;
  }
  return hits;
}

function rankedHits(arr: number[], start: number, len: number): number[] {
  const hits: Array<{ idx: number; score: number }> = [];
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (arr[idx] === 1) {
      hits.push({ idx, score: distanceToNearestHit(arr, idx, start, len, true) });
    }
  }

  hits.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score; // remove most crowded
    return a.idx - b.idx;
  });

  return hits.map(item => item.idx);
}

function rankedEmpties(arr: number[], start: number, len: number): number[] {
  const empties: Array<{ idx: number; score: number }> = [];
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (arr[idx] === 0) {
      empties.push({ idx, score: distanceToNearestHit(arr, idx, start, len, false) });
    }
  }

  empties.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score; // fill most open
    return a.idx - b.idx;
  });

  return empties.map(item => item.idx);
}

function distanceToNearestHit(
  arr: number[],
  index: number,
  start: number,
  len: number,
  excludeSelf: boolean
): number {
  let min = Infinity;
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (arr[idx] === 1) {
      if (excludeSelf && idx === index) continue;
      const dist = Math.abs(idx - index);
      if (dist < min) min = dist;
    }
  }

  return min === Infinity ? len : min;
}
