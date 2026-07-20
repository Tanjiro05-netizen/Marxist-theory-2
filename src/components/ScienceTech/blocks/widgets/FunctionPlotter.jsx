import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';

const DEFAULT_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b'];
const MARGIN = { top: 20, right: 30, bottom: 40, left: 50 };

const FunctionPlotter = ({ config }) => {
  const {
    functions: funcStrings = ['sin(x)', 'cos(x)'],
    x_range: xRange = [-6.28, 6.28],
    y_range: yRangeArg,
    parameters: paramConfig = [],
  } = config;

  // Parse function strings into actual functions
  const parseFunction = useCallback((str) => {
    const lowered = str.toLowerCase();
    if (lowered.includes('y=')) {
      str = str.split('=')[1] || str;
    }
    // Build a safe evaluator using Math scope
    const safeStr = str
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/exp\(/g, 'Math.exp(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/pow\(/g, 'Math.pow(')
      .replace(/pi\b/gi, 'Math.PI')
      .replace(/e\b/gi, 'Math.E')
      .replace(/\^/g, '**');
    return (x, params) => {
      try {
        const fn = new Function('Math', 'x', ...Object.keys(params || {}), `return (${safeStr});`); // eslint-disable-line no-new-func
        return fn(Math, x, ...Object.values(params || {}));
      } catch {
        return NaN;
      }
    };
  }, []);

  const [params, setParams] = useState(() => {
    const initial = {};
    paramConfig.forEach((p) => { initial[p.name] = p.default !== undefined ? p.default : (p.min + p.max) / 2; });
    return initial;
  });

  const svgRef = useRef(null);

  // Compute y-range dynamically
  const [computedYRange, setComputedYRange] = useState(yRangeArg || [-1.5, 1.5]);

  const width = 600;
  const height = 320;
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  useEffect(() => {
    if (yRangeArg) return;
    // Auto-compute y range from sampling all functions
    const samples = 200;
    let minY = Infinity;
    let maxY = -Infinity;
    funcStrings.forEach((str) => {
      const fn = parseFunction(str);
      for (let i = 0; i <= samples; i++) {
        const x = xRange[0] + (xRange[1] - xRange[0]) * (i / samples);
        const y = fn(x, params);
        if (!isNaN(y) && isFinite(y)) {
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    });
    if (minY !== Infinity && maxY !== -Infinity) {
      const pad = (maxY - minY) * 0.1 || 0.5;
      setComputedYRange([minY - pad, maxY + pad]);
    }
  }, [funcStrings, xRange, yRangeArg, params, parseFunction]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = d3.scaleLinear().domain(xRange).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(computedYRange).range([innerHeight, 0]);

    // Grid lines
    const xTicks = xScale.ticks(8);
    const yTicks = yScale.ticks(6);

    g.selectAll('.grid-x')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-x')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#333')
      .attr('stroke-dasharray', '2,2');

    g.selectAll('.grid-y')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-y')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#333')
      .attr('stroke-dasharray', '2,2');

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(8).tickSize(0);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickSize(0);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((g2) => g2.select('.domain').attr('stroke', '#555'))
      .call((g2) => g2.selectAll('.tick text').attr('fill', '#999').attr('font-size', '10px'));

    g.append('g')
      .call(yAxis)
      .call((g2) => g2.select('.domain').attr('stroke', '#555'))
      .call((g2) => g2.selectAll('.tick text').attr('fill', '#999').attr('font-size', '10px'));

    // Plot each function
    const line = d3
      .line()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    funcStrings.forEach((str, idx) => {
      const fn = parseFunction(str);
      const data = [];
      for (let i = 0; i <= 300; i++) {
        const x = xRange[0] + (xRange[1] - xRange[0]) * (i / 300);
        const y = fn(x, params);
        if (isFinite(y) && !isNaN(y)) data.push([x, y]);
      }

      if (data.length > 1) {
        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', DEFAULT_COLORS[idx % DEFAULT_COLORS.length])
          .attr('stroke-width', 2)
          .attr('d', line);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcStrings, xRange, computedYRange, params, parseFunction, innerWidth, innerHeight]);

  return (
    <div className="bg-black/40 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {funcStrings.map((str, idx) => (
          <span key={idx} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block w-3 h-0.5"
              style={{ backgroundColor: DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
            />
            <span className="text-gray-400 font-mono text-xs">{str}</span>
          </span>
        ))}
      </div>

      {paramConfig.length > 0 && (
        <div className="flex items-center gap-6 mb-3 flex-wrap">
          {paramConfig.map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-gray-400 text-xs">{p.name} = {Number(params[p.name]).toFixed(2)}</span>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step || 0.01}
                value={params[p.name] ?? ((p.min + p.max) / 2)}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, [p.name]: parseFloat(e.target.value) }))
                }
                className="w-24 accent-red-500"
              />
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <svg ref={svgRef} width={width} height={height} />
      </div>
    </div>
  );
};

export default FunctionPlotter;
