import React, { useEffect, useMemo, useRef, useState } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule10, zoom as d3zoom, zoomIdentity, select } from 'd3';
import { feature } from 'topojson-client';
import { useTranslation } from 'react-i18next';
import { countries } from '../../data/countries';
import { CATEGORIES } from '../Globe/globeData';
import * as s from './MovementsVisualization.css.ts';

const WIDTH = 900;
const HEIGHT = 470;

/* 5-point star, ~6px outer radius (Revolutionary Wave marker). */
const STAR_PATH = 'M0,-6 L1.35,-1.85 L5.7,-1.85 L2.2,0.7 L3.5,4.85 L0,2.3 L-3.5,4.85 L-2.2,0.7 L-5.7,-1.85 L-1.35,-1.85 Z';

/* Static ocean labels placed by [lat, lng] — the classic italic water tier. */
const WATER_LABELS = [
  { name: 'PACIFIC  OCEAN', lat: -12, lng: -142 },
  { name: 'ATLANTIC  OCEAN', lat: 26, lng: -42 },
  { name: 'INDIAN  OCEAN', lat: -24, lng: 79 },
  { name: 'ARCTIC  OCEAN', lat: 80, lng: 20 },
];

/* Reverse lookup: world-atlas country name → ISO alpha-2. */
const NAME_TO_CODE = (() => {
  const map = {};
  countries.forEach(c => { map[c.name.toLowerCase()] = c.id; });
  const alias = {
    'united states of america': 'US',
    'russia': 'RU',
    'russian federation': 'RU',
    'north korea': 'KP',
    'south korea': 'KR',
    'republic of korea': 'KR',
    'dem. rep. korea': 'KP',
    'czech republic': 'CZ',
    'czechia': 'CZ',
    'viet nam': 'VN',
    'türkiye': 'TR',
    'turkey': 'TR',
    'great britain': 'GB',
    'united kingdom': 'GB',
    'bosnia and herz.': 'BA',
    'dominican rep.': 'DO',
    'central african rep.': 'CF',
    'eq. guinea': 'GQ',
    's. sudan': 'SS',
  };
  return { map, alias };
})();

const geoToCode = (name) => {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (NAME_TO_CODE.alias[lower]) return NAME_TO_CODE.alias[lower];
  if (NAME_TO_CODE.map[lower]) return NAME_TO_CODE.map[lower];
  for (const [n, code] of Object.entries(NAME_TO_CODE.map)) {
    if (lower.startsWith(n) || n.startsWith(lower)) return code;
  }
  return null;
};

/* Greedy label placement: try right/below-right of the anchor, skip if it
   would overlap an already-placed label (Axis Maps placement rules). */
const placeLabels = (anchors) => {
  const placed = [];
  const fits = (x, y, w) => placed.every(p => x + w < p.x || p.x + p.w < x || y < p.y - 11 || p.y + 11 < y - 11 || y - 11 > p.y + 11 || y + 11 < p.y);
  return anchors.map(a => {
    const w = a.name.length * 6.2 + 8;
    const candidates = [
      { x: a.x + 7, y: a.y + 3 },
      { x: a.x - 7 - w, y: a.y + 3 },
      { x: a.x + 7, y: a.y + 13 },
      { x: a.x - 7 - w, y: a.y - 9 },
    ];
    for (const c of candidates) {
      if (fits(c.x, c.y, w)) {
        placed.push({ ...c, w });
        return { ...a, ...c, anchor: c.x === a.x + 7 ? 'start' : 'end' };
      }
    }
    return null;
  }).filter(Boolean);
};

/* Flat atlas view — hand-drawn-grade cartography on ink. */
const MovementsMap2D = ({ events, connections, selectedEvent, onSelectEvent, onSelectCountry, yearRange }) => {
  const { t } = useTranslation();
  const [features, setFeatures] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const zoomLayerRef = useRef(null);
  const counterLayerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/topo/countries-110m.json')
      .then(r => r.json())
      .then(topo => {
        if (!cancelled) setFeatures(feature(topo, topo.objects.countries).features);
      })
      .catch(() => { if (!cancelled) setFeatures([]); });
    return () => { cancelled = true; };
  }, []);

  const projection = useMemo(
    () => geoNaturalEarth1().fitExtent([[10, 12], [WIDTH - 10, HEIGHT - 12]], { type: 'Sphere' }),
    []
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule10(), []);

  const eventsByCountry = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (!ev.country) return;
      map[ev.country] = (map[ev.country] || 0) + 1;
    });
    return map;
  }, [events]);

  /* Projected marker/label anchors. Curated events get labels. */
  const anchors = useMemo(() => events.map(ev => {
    const p = projection([ev.lng, ev.lat]);
    return { ...ev, x: p[0], y: p[1] };
  }), [events, projection]);

  const curated = useMemo(
    () => anchors.filter(a => a.category !== 'timeline'),
    [anchors]
  );
  const labels = useMemo(
    () => placeLabels(curated.map(a => ({ x: a.x, y: a.y, name: a.name, id: a.id }))),
    [curated]
  );

  /* Journey lines between connected events. */
  const arcs = useMemo(() => {
    const byId = Object.fromEntries(anchors.map(a => [a.id, a]));
    return connections
      .map(conn => {
        const from = byId[conn.from];
        const to = byId[conn.to];
        if (!from || !to) return null;
        const cx = (from.x + to.x) / 2;
        const cy = (from.y + to.y) / 2;
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        return {
          key: `${conn.from}-${conn.to}`,
          d: `M${from.x},${from.y} Q${cx},${cy - dist * 0.16} ${to.x},${to.y}`,
        };
      })
      .filter(Boolean);
  }, [connections, anchors]);

  /* d3-zoom: transform the map layer, counter-scale markers/labels around
     the viewport centre so their size stays constant. All imperative —
     no React re-renders during pan. */
  useEffect(() => {
    if (!svgRef.current) return undefined;
    const svg = svgRef.current;
    const applyZoom = (transform) => {
      if (zoomLayerRef.current) zoomLayerRef.current.setAttribute('transform', transform.toString());
      if (counterLayerRef.current) {
        const cx = WIDTH / 2;
        const cy = HEIGHT / 2;
        const inv = 1 / transform.k;
        counterLayerRef.current.setAttribute(
          'transform',
          `translate(${cx},${cy}) scale(${inv}) translate(${-cx},${-cy})`
        );
      }
    };
    const zoomBehavior = d3zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => applyZoom(event.transform));
    const selection = select(svg);
    selection.call(zoomBehavior);
    applyZoom(zoomIdentity);
    return () => { selection.on('.zoom', null); };
  }, [features]);

  const handleMouseMove = (e) => setTooltipPos({ x: e.clientX, y: e.clientY });

  const renderMarker = (a) => {
    const color = CATEGORIES[a.category]?.color || '#ece9e0';
    const isSelected = selectedEvent?.id === a.id;
    if (a.category === 'revolution') {
      return (
        <g key={a.id} transform={`translate(${a.x},${a.y})`} className={s.eventDot} onClick={() => onSelectEvent(a)}>
          <circle r={isSelected ? 12 : 9} fill="url(#markerGlow)" opacity={isSelected ? 0.9 : 0.55} />
          <path d={STAR_PATH} fill={color} stroke="#0b0d12" strokeWidth={0.8} transform={isSelected ? 'scale(1.35)' : undefined} />
        </g>
      );
    }
    const r = a.category === 'timeline' ? 2 : 3.2;
    return (
      <g key={a.id} transform={`translate(${a.x},${a.y})`} className={s.eventDot} onClick={() => onSelectEvent(a)}>
        <circle r={isSelected ? 10 : 6.5} fill="url(#markerGlow)" opacity={isSelected ? 0.9 : 0.5} />
        <circle r={isSelected ? r + 1.5 : r} fill={color} stroke="#0b0d12" strokeWidth={0.8} />
      </g>
    );
  };

  return (
    <div className={s.atlasFrame} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ display: 'block', width: '100%', height: 'auto', background: '#10131b', cursor: 'grab' }}
      >
        <defs>
          <radialGradient id="markerGlow">
            <stop offset="0%" stopColor="#d41f3d" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#d41f3d" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#d41f3d" stopOpacity="0" />
          </radialGradient>
          {/* Ink-paper grain: fractal noise at a whisper of white keeps the
              ground from reading as flat digital black. */}
          <filter id="paperGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.035 0" />
          </filter>
        </defs>

        <g ref={zoomLayerRef}>
          {/* Ocean + graticule + sphere outline */}
          <path d={path({ type: 'Sphere' })} fill="#10131b" stroke="rgba(236,233,224,0.25)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <path d={path(graticule)} fill="none" stroke="#ece9e0" strokeOpacity={0.06} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />

          {/* Countries */}
          {(features || []).map(geo => {
            const code = geoToCode(geo.properties.name);
            const count = code ? eventsByCountry[code] || 0 : 0;
            const isSelectedCountry = selectedEvent?.country && code === selectedEvent.country;
            const cls = [
              s.country,
              count > 0 ? s.countryWithEvents : '',
              isSelectedCountry ? s.countrySelected : '',
            ].filter(Boolean).join(' ');
            return (
              <path
                key={geo.id || geo.properties.name}
                d={path(geo)}
                className={cls}
                onMouseEnter={() => {
                  if (count > 0) setTooltip({ name: geo.properties.name, count });
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => { if (code) onSelectCountry(code); }}
              />
            );
          })}

          {/* Chronological journey lines between connected events */}
          <g className={s.journeyArcs} fill="none" stroke="rgba(236,233,224,0.20)" strokeWidth={0.8} strokeDasharray="2 3">
            {arcs.map(arc => <path key={arc.key} d={arc.d} vectorEffect="non-scaling-stroke" />)}
          </g>

          {/* Markers + labels keep constant size while zooming */}
          <g ref={counterLayerRef}>
            {WATER_LABELS.map(w => {
              const p = projection([w.lng, w.lat]);
              return p ? (
                <text key={w.name} x={p[0]} y={p[1]} className={s.waterLabel}>{w.name}</text>
              ) : null;
            })}
            {anchors.map(renderMarker)}
            {labels.map(l => (
              <text key={l.id} x={l.x} y={l.y} dx={l.anchor === 'start' ? 7 : -7} dy={l.anchor === 'start' ? 3 : 3} textAnchor={l.anchor} className={s.eventLabel}>
                {l.name}
              </text>
            ))}
          </g>
        </g>

        {/* Ink-paper grain sits above the plate, outside the zoom layer */}
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} filter="url(#paperGrain)" pointerEvents="none" />
      </svg>

      <div className={s.atlasVignette} />

      <div className={s.cartouche}>
        <div>
          <div className={s.cartoucheKicker}>{t('data.atlasKicker')}</div>
          <div className={s.cartoucheTitle}>{t('data.movements')}</div>
          {yearRange && <div className={s.cartoucheRange}>{yearRange}</div>}
        </div>
        <div className={s.seal}>
          <svg width="18" height="18" viewBox="-7 -7 14 14" aria-hidden="true">
            <path d={STAR_PATH} fill="#d41f3d" />
          </svg>
        </div>
      </div>

      <div className={s.atlasAttribution}>Natural Earth · world-atlas</div>

      {tooltip && (
        <div className={s.mapTooltip} style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 32 }}>
          {tooltip.name} · {tooltip.count} {t('data.tooltipEvents')}
        </div>
      )}
    </div>
  );
};

export default MovementsMap2D;
