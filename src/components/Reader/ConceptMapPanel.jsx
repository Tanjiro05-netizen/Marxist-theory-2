import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const COLORS = {
  heading: '#f97316',
  headingBg: 'rgba(249,115,22,0.12)',
  concept: '#ef4444',
  conceptBg: 'rgba(239,68,68,0.10)',
  link: 'rgba(255,255,255,0.08)',
  label: '#e4e4e7',
  labelMuted: '#a1a1aa',
};

const truncate = (str, max) => (str.length > max ? str.slice(0, max - 1) + '…' : str);

const ConceptMapPanel = ({ graphData, onNodeClick }) => {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setDimensions({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const safeGraphData = useMemo(() => {
    if (!graphData?.nodes?.length) return { nodes: [], links: [] };
    return graphData;
  }, [graphData]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('charge').strength(-220);
    fg.d3Force('link').distance(80);
    fg.d3Force('center', null);
    fg.d3Force('x', require('d3-force').forceX(0).strength(0.05));
    fg.d3Force('y', require('d3-force').forceY(0).strength(0.05));
  });

  const handleEngineStop = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(300, 40);
    }
  }, []);

  if (!safeGraphData.nodes.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 h-[420px] flex items-center justify-center">
        <p className="text-sm text-gray-400">No concept graph data available for this text.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-gray-900/50 border border-gray-700 rounded-lg h-[420px] no-pdf overflow-hidden">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={safeGraphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={5}
          d3AlphaDecay={0.03}
          d3VelocityDecay={0.3}
          warmupTicks={60}
          cooldownTicks={120}
          onEngineStop={handleEngineStop}
          linkColor={() => COLORS.link}
          linkWidth={0.8}
          linkDirectionalParticles={0}
          nodeCanvasObjectMode={() => 'replace'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const isHeading = node.type === 'heading';
            const radius = Math.max(3, (node.val || 5) * 0.7);
            const rawLabel = node.label || '';
            const label = isHeading ? truncate(rawLabel, 28) : truncate(rawLabel, 22);
            const fontSize = isHeading
              ? Math.max(9, 11 / globalScale)
              : Math.max(8, 10 / globalScale);

            ctx.beginPath();
            ctx.fillStyle = isHeading ? COLORS.heading : COLORS.concept;
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fill();

            if (globalScale > 0.4) {
              ctx.font = `${isHeading ? '600' : '400'} ${fontSize}px -apple-system, sans-serif`;
              const textWidth = ctx.measureText(label).width;
              const padding = 3;
              const textX = node.x + radius + 4;
              const textY = node.y + fontSize * 0.35;

              ctx.fillStyle = isHeading ? COLORS.headingBg : COLORS.conceptBg;
              ctx.fillRect(textX - padding, textY - fontSize + 1, textWidth + padding * 2, fontSize + 4);

              ctx.fillStyle = isHeading ? COLORS.label : COLORS.labelMuted;
              ctx.fillText(label, textX, textY);
            }
          }}
          onNodeClick={(node) => onNodeClick?.(node)}
        />
      )}
    </div>
  );
};

export default ConceptMapPanel;
