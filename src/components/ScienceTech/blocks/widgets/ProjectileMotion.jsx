import React, { useState, useEffect, useRef, useCallback } from 'react';

const ProjectileMotion = ({ config }) => {
  const {
    default_angle = 45,
    default_velocity = 30,
    default_gravity = 9.81,
    max_velocity = 100,
    max_gravity = 20,
  } = config;

  const canvasRef = useRef(null);

  const [angle, setAngle] = useState(default_angle);
  const [velocity, setVelocity] = useState(default_velocity);
  const [gravity, setGravity] = useState(default_gravity);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPath, setShowPath] = useState(true);
  const [showVectors, setShowVectors] = useState(false);

  const animRef = useRef(null);
  const pathRef = useRef([]);

  const scale = 4; // pixels per meter

  const draw = useCallback((t = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0d0e14';
    ctx.fillRect(0, 0, width, height);

    // Ground
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(width, height - 40);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#555';
    ctx.font = '10px sans-serif';
    ctx.fillText('0', 35, height - 25);
    ctx.fillText('x (m)', width - 35, height - 25);
    ctx.fillText('y (m)', 10, 20);

    const g = gravity;
    const v0 = velocity;
    const theta = (angle * Math.PI) / 180;
  const vx = v0 * Math.cos(theta);
    const vy0 = v0 * Math.sin(theta);

    // Compute total flight time
    const flightTime = (2 * vy0) / g;

    // Draw path
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const pathPoints = [];
    const steps = 200;
    let maxY = 0;
    for (let i = 0; i <= steps; i++) {
      const tt = (i / steps) * flightTime;
      const x = vx * tt;
      const y = vy0 * tt - 0.5 * g * tt * tt;
      pathPoints.push({ x: 40 + x * scale, y: height - 40 - y * scale });
      if (y > maxY) maxY = y;
    }

    if (showPath) {
      for (let i = 0; i < pathPoints.length - 1; i++) {
        if (i === 0) ctx.moveTo(pathPoints[i].x, pathPoints[i].y);
        else ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      ctx.stroke();
    }

    // Draw projectile at time t
    if (t != null && t >= 0 && t <= flightTime) {
      const x = vx * t;
      const y = vy0 * t - 0.5 * g * t * t;
      const px = 40 + x * scale;
      const py = height - 40 - y * scale;

      if (y >= 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        if (pathRef.current.length > 50) pathRef.current.shift();
        pathRef.current.push({ x: px, y: py });

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        pathRef.current.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Velocity vectors
        if (showVectors) {
          const vxNow = vx;
          const vyNow = vy0 - g * t;
          const vMag = Math.sqrt(vxNow * vxNow + vyNow * vyNow);
          const vectorScale = 2;

          // vx arrow
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + vxNow * vectorScale, py);
          ctx.stroke();

          // vy arrow
          ctx.strokeStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py - vyNow * vectorScale);
          ctx.stroke();

          // total v
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + (vxNow / vMag) * vMag * vectorScale, py - (vyNow / vMag) * vMag * vectorScale);
          ctx.stroke();
        }
      }
    } else {
      pathRef.current = [];
    }

    // Stats
    const range = (v0 * v0 * Math.sin(2 * theta)) / g;
    ctx.fillStyle = '#999';
    ctx.font = '11px sans-serif';
    ctx.fillText(`Range: ${range.toFixed(1)} m`, 10, height - 5);
    ctx.fillText(`Max Height: ${maxY.toFixed(1)} m`, 150, height - 5);
    ctx.fillText(`Time: ${flightTime.toFixed(2)} s`, 300, height - 5);
  }, [angle, velocity, gravity, showPath, showVectors, scale]);

  // Draw initial state
  useEffect(() => {
    if (!isAnimating) draw(null);
  }, [draw, isAnimating]);

  const startAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    pathRef.current = [];
    const g = gravity;
    const v0 = velocity;
    const theta = (angle * Math.PI) / 180;
    const vy0 = v0 * Math.sin(theta);
    const flightTime = (2 * vy0) / g;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = (now - startTime) / 1000;
      const t = Math.min(elapsed, flightTime);
      draw(t);
      if (t < flightTime) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        // Draw final state once more
        draw(flightTime);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="bg-black/40 rounded-xl border border-gray-800 p-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Angle</span>
          <input
            type="range"
            min={0}
            max={90}
            step={1}
            value={angle}
            onChange={(e) => { setAngle(parseFloat(e.target.value)); setIsAnimating(false); }}
            className="w-24 accent-red-500"
          />
          <span className="text-gray-300 text-sm font-mono w-10">{angle}°</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Velocity</span>
          <input
            type="range"
            min={5}
            max={max_velocity}
            step={1}
            value={velocity}
            onChange={(e) => { setVelocity(parseFloat(e.target.value)); setIsAnimating(false); }}
            className="w-24 accent-blue-500"
          />
          <span className="text-gray-300 text-sm font-mono w-10">{velocity}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Gravity</span>
          <input
            type="range"
            min={1}
            max={max_gravity}
            step={0.1}
            value={gravity}
            onChange={(e) => { setGravity(parseFloat(e.target.value)); setIsAnimating(false); }}
            className="w-24 accent-green-500"
          />
          <span className="text-gray-300 text-sm font-mono w-10">{gravity.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={startAnimation}
          disabled={isAnimating}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-medium rounded transition-colors"
        >
          {isAnimating ? 'Running...' : 'Animate'}
        </button>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showPath}
            onChange={(e) => setShowPath(e.target.checked)}
            className="accent-red-500"
          />
          Show path
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showVectors}
            onChange={(e) => setShowVectors(e.target.checked)}
            className="accent-red-500"
          />
          Vectors
        </label>
      </div>

      <div className="overflow-x-auto">
        <canvas ref={canvasRef} width={600} height={300} className="rounded-lg" />
      </div>
    </div>
  );
};

export default ProjectileMotion;
