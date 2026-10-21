import {
  computeVelocities,
  linearFit,
  numericAnswerMatches,
  quadraticFit,
  roundTo,
} from './scienceLabMath';

const closeTo = (actual, expected, epsilon = 1e-6) => Math.abs(actual - expected) <= epsilon;

describe('linearFit', () => {
  it('fits a perfect line and reports r2 = 1', () => {
    const fit = linearFit([
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ]);
    expect(fit).not.toBeNull();
    expect(closeTo(fit.slope, 2)).toBe(true);
    expect(closeTo(fit.intercept, 1)).toBe(true);
    expect(closeTo(fit.r2, 1)).toBe(true);
  });

  it('fits noisy data with least squares', () => {
    const fit = linearFit([
      { x: 0, y: 0.1 },
      { x: 1, y: 1.9 },
      { x: 2, y: 4.2 },
    ]);
    expect(closeTo(fit.slope, 2.05, 1e-3)).toBe(true);
    expect(closeTo(fit.intercept, 0.0166667, 1e-3)).toBe(true);
    expect(fit.r2).toBeGreaterThan(0.99);
  });

  it('returns null for fewer than two points or zero x spread', () => {
    expect(linearFit([{ x: 1, y: 1 }])).toBeNull();
    expect(linearFit([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ])).toBeNull();
    expect(linearFit(null)).toBeNull();
  });
});

describe('quadraticFit', () => {
  it('recovers x = 0.5·t² from sampled constant-acceleration motion', () => {
    const points = [0, 1, 2, 3, 4].map((t) => ({ x: t, y: 0.5 * t * t }));
    const fit = quadraticFit(points);
    expect(fit).not.toBeNull();
    expect(closeTo(fit.a, 0.5)).toBe(true);
    expect(closeTo(fit.b, 0)).toBe(true);
    expect(closeTo(fit.c, 0)).toBe(true);
  });

  it('recovers the course fallback model x = 0.60t + 0.20t²', () => {
    const points = [0, 0.5, 1, 1.5, 2].map((t) => ({ x: t, y: 0.6 * t + 0.2 * t * t }));
    const fit = quadraticFit(points);
    expect(closeTo(fit.a, 0.2)).toBe(true);
    expect(closeTo(fit.b, 0.6)).toBe(true);
    expect(closeTo(fit.c, 0)).toBe(true);
  });

  it('returns null for fewer than three points', () => {
    expect(quadraticFit([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBeNull();
  });
});

describe('computeVelocities', () => {
  it('uses central differences at interior points', () => {
    const velocities = computeVelocities([
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ]);
    expect(closeTo(velocities[0].y, 2)).toBe(true); // one-sided first
    expect(closeTo(velocities[1].y, 2)).toBe(true); // central (4-0)/2
    expect(closeTo(velocities[2].y, 2)).toBe(true); // one-sided last
  });

  it('returns [] for fewer than two points and sorts by time', () => {
    expect(computeVelocities([{ x: 1, y: 1 }])).toEqual([]);
    const velocities = computeVelocities([
      { x: 2, y: 6 },
      { x: 0, y: 0 },
      { x: 1, y: 3 },
    ]);
    expect(velocities.map((point) => point.x)).toEqual([0, 1, 2]);
    expect(closeTo(velocities[1].y, 3)).toBe(true);
  });
});

describe('numericAnswerMatches', () => {
  it('accepts within absolute tolerance', () => {
    expect(numericAnswerMatches('9.02', 9, 0.05)).toBe(true);
    expect(numericAnswerMatches('9.06', 9, 0.05)).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(numericAnswerMatches('fast', 9, 1)).toBe(false);
    expect(numericAnswerMatches('', 9, 1)).toBe(false);
  });
});

describe('roundTo', () => {
  it('rounds to the requested digits', () => {
    expect(roundTo(1.518292683, 3)).toBe(1.518);
    expect(roundTo(-0.0004, 3)).toBe(-0);
    expect(roundTo('x', 2)).toBe(0);
  });
});
