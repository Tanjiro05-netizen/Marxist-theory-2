// Pure numeric helpers for the PHY111 lab blocks. No React, no Supabase —
// unit-testable math only.

// Least-squares fit y = m*x + b over [{x, y}] points.
// Returns { slope, intercept, r2 } or null when underdetermined.
export const linearFit = (points) => {
  const clean = (points || []).filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
  const n = clean.length;
  if (n < 2) return null;

  const meanX = clean.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = clean.reduce((sum, p) => sum + p.y, 0) / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of clean) {
    sxx += (p.x - meanX) * (p.x - meanX);
    sxy += (p.x - meanX) * (p.y - meanY);
    syy += (p.y - meanY) * (p.y - meanY);
  }
  if (sxx === 0) return null;

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  return { slope, intercept, r2 };
};

// Least-squares fit y = a*x^2 + b*x + c via the normal equations.
// Returns { a, b, c } or null when underdetermined/degenerate.
export const quadraticFit = (points) => {
  const clean = (points || []).filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
  const n = clean.length;
  if (n < 3) return null;

  // Sums for powers of x up to 4 and x^k * y up to 2.
  let s0 = n;
  let s1 = 0;
  let s2 = 0;
  let s3 = 0;
  let s4 = 0;
  let t0 = 0;
  let t1 = 0;
  let t2 = 0;
  for (const p of clean) {
    s1 += p.x;
    s2 += p.x * p.x;
    s3 += p.x ** 3;
    s4 += p.x ** 4;
    t0 += p.y;
    t1 += p.x * p.y;
    t2 += p.x * p.x * p.y;
  }

  // Solve the 3x3 symmetric system [s4 s3 s2; s3 s2 s1; s2 s1 s0] [a b c]^T = [t2 t1 t0]^T
  // via Cramer's rule with a small-pivot guard.
  const det3 = (m) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  const matrix = [
    [s4, s3, s2],
    [s3, s2, s1],
    [s2, s1, s0],
  ];
  const d = det3(matrix);
  if (!Number.isFinite(d) || Math.abs(d) < 1e-12) return null;

  const replaceColumn = (index) =>
    matrix.map((row, rowIndex) => {
      const target = [t2, t1, t0][rowIndex];
      return row.map((value, colIndex) => (colIndex === index ? target : value));
    });

  const a = det3(replaceColumn(0)) / d;
  const b = det3(replaceColumn(1)) / d;
  const c = det3(replaceColumn(2)) / d;
  if (![a, b, c].every(Number.isFinite)) return null;
  return { a, b, c };
};

// Central-difference velocities from sorted [{x: t, y: position}] samples.
// Interior points use neighbours; endpoints use one-sided differences.
export const computeVelocities = (points) => {
  const clean = [...(points || [])]
    .filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y))
    .sort((p, q) => p.x - q.x);
  if (clean.length < 2) return [];

  return clean.map((point, index) => {
    if (index === 0) {
      const dt = clean[1].x - point.x;
      return { x: point.x, y: dt !== 0 ? (clean[1].y - point.y) / dt : 0 };
    }
    if (index === clean.length - 1) {
      const dt = point.x - clean[index - 1].x;
      return { x: point.x, y: dt !== 0 ? (point.y - clean[index - 1].y) / dt : 0 };
    }
    const prev = clean[index - 1];
    const next = clean[index + 1];
    const dt = next.x - prev.x;
    return { x: point.x, y: dt !== 0 ? (next.y - prev.y) / dt : 0 };
  });
};

// Numeric answer check against an absolute tolerance (authored tolerance
// already encodes any relative intent). A tiny epsilon absorbs float noise.
export const numericAnswerMatches = (submitted, expected, tolerance = 0) => {
  const value = Number(submitted);
  const target = Number(expected);
  if (!Number.isFinite(value) || !Number.isFinite(target)) return false;
  return Math.abs(value - target) <= Number(tolerance) + 1e-9;
};

export const roundTo = (value, digits = 3) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};
