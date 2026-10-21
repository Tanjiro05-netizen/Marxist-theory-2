import React, { useState, useRef, useCallback, useEffect } from 'react';

const SpringMass = ({ config }) => {
  const cfg = { default_mass: 1, default_k: 10, max_mass: 5, max_k: 50, ...(config || {}) };
  const canvasRef = useRef(null);
  const [mass, setMass] = useState(cfg.default_mass);
  const [k, setK] = useState(cfg.default_k);
  const [isRunning, setIsRunning] = useState(false);

  const draw = useCallback((t) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, eqY = h / 2, scale = 60;
    const omega = Math.sqrt(k / mass);
    const disp = Math.cos(omega * t);
    const xPx = disp * scale;

    // Equilibrium line
    ctx.strokeStyle = '#333';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - 80, eqY);
    ctx.lineTo(cx + 80, eqY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Spring
    const top = 30, bot = eqY + xPx - 15;
    ctx.strokeStyle = '#d41f3d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    const coilH = (bot - top) / 12;
    for (let i = 0; i < 12; i++) {
      const y = top + i * coilH;
      ctx.lineTo(cx + 10, y + coilH * 0.25);
      ctx.lineTo(cx - 10, y + coilH * 0.75);
    }
    ctx.lineTo(cx, bot);
    ctx.stroke();

    // Mass
    const mS = Math.max(15, 10 + mass * 5);
    ctx.fillStyle = '#4a7fb5';
    ctx.fillRect(cx - mS / 2, eqY + xPx - mS / 2, mS, mS);
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${mass.toFixed(1)}kg`, cx, eqY + xPx + 4);

    // Wall
    ctx.fillStyle = '#444';
    ctx.fillRect(cx - 2, 0, 4, 30);

    // Stats
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    const period = (2 * Math.PI) / omega;
    ctx.fillText(`f = ${(1 / period).toFixed(2)} Hz`, 10, 20);
    ctx.fillText(`T = ${period.toFixed(2)} s`, 10, 35);
  }, [mass, k]);

  useEffect(() => {
    let animRef;
    if (isRunning) {
      const start = performance.now() / 1000;
      const animate = () => {
        const t = performance.now() / 1000 - start;
        draw(t);
        animRef = requestAnimationFrame(animate);
      };
      animRef = requestAnimationFrame(animate);
    } else {
      draw(0);
    }
    return () => cancelAnimationFrame(animRef);
  }, [isRunning, draw]);

  return (
    <div className="bg-black/40 rounded-none border border-gray-800 p-4">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Mass</span>
          <input type="range" min={0.1} max={cfg.max_mass} step={0.1} value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            className="w-20 accent-blue-500" />
          <span className="text-gray-300 text-sm font-mono w-10">{mass.toFixed(1)}kg</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">k</span>
          <input type="range" min={1} max={cfg.max_k} step={1} value={k}
            onChange={(e) => setK(parseFloat(e.target.value))}
            className="w-20 accent-red-500" />
          <span className="text-gray-300 text-sm font-mono w-10">{k}N/m</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => setIsRunning(!isRunning)}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors">
          {isRunning ? 'Stop' : 'Animate'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <canvas ref={canvasRef} width={500} height={280} className="rounded-none" />
      </div>
    </div>
  );
};

export default SpringMass;
