'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { CATEGORIES } from './globeData';

export const GLOBE_RADIUS = 2;
const MARKER_RADIUS = GLOBE_RADIUS * 1.035;

/* Convert lat/lng to a 3D position on the sphere (matches equirectangular UV mapping). */
export function latLngToVector3(lat, lng, radius = MARKER_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/* ── Single event marker ── */
function Marker({ event, onHover, onSelect, hovered }) {
  const ref = useRef();
  const position = useMemo(
    () => latLngToVector3(event.lat, event.lng),
    [event.lat, event.lng]
  );
  const color = CATEGORIES[event.category]?.color || '#ffffff';

  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = hovered ? 1.8 : 1 + Math.sin(clock.elapsedTime * 2.5) * 0.15;
      ref.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(event);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(event);
        }}
      >
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Soft halo */}
      <mesh>
        <sphereGeometry args={[0.036, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ── Arc between two events ── */
function Arc({ fromEvent, toEvent, category }) {
  const color = CATEGORIES[category]?.color || '#ffffff';

  const points = useMemo(() => {
    const start = latLngToVector3(fromEvent.lat, fromEvent.lng);
    const end = latLngToVector3(toEvent.lat, toEvent.lng);
    const dist = start.distanceTo(end);
    const mid = start
      .clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(MARKER_RADIUS + dist * 0.28);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(48);
  }, [fromEvent, toEvent]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.4}
      transparent
      opacity={0.65}
    />
  );
}

/* ── All markers + arcs, filtered by visible categories ── */
export function GlobeOverlays({ events, connections, hiddenCategories, onHover, onSelect, hoveredId }) {
  const byId = useMemo(() => {
    const map = {};
    events.forEach((e) => { map[e.id] = e; });
    return map;
  }, [events]);

  const visibleEvents = events.filter((e) => !hiddenCategories.has(e.category));
  const visibleConnections = connections.filter(
    (c) => !hiddenCategories.has(c.category) && byId[c.from] && byId[c.to]
  );

  return (
    <group>
      {visibleEvents.map((event) => (
        <Marker
          key={event.id}
          event={event}
          onHover={onHover}
          onSelect={onSelect}
          hovered={hoveredId === event.id}
        />
      ))}
      {visibleConnections.map((conn, i) => (
        <Arc
          key={`${conn.from}-${conn.to}-${i}`}
          fromEvent={byId[conn.from]}
          toEvent={byId[conn.to]}
          category={conn.category}
        />
      ))}
    </group>
  );
}
