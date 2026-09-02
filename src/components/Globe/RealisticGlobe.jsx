'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '../../supabaseClient';
import { GLOBE_EVENTS, GLOBE_CONNECTIONS, CATEGORIES, matchLocation } from './globeData';
import { GlobeOverlays } from './GlobeOverlays';
import * as s from './Globe.css.ts';

const TEXTURE_BASE = '/textures/earth';

/* ── Earth sphere with day/night blend + bump + specular + topology ── */
function EarthMesh() {
  const [dayMap, bumpMap, specMap, nightMap, topoMap] = useLoader(THREE.TextureLoader, [
    `${TEXTURE_BASE}/2k_earth_daymap.jpg`,
    `${TEXTURE_BASE}/2k_earth_normal_map.png`,
    `${TEXTURE_BASE}/2k_earth_specular_map.png`,
    `${TEXTURE_BASE}/2k_earth_nightmap.jpg`,
    `${TEXTURE_BASE}/earth_topology.png`,
  ]);

  useEffect(() => {
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;
    [dayMap, bumpMap, specMap, nightMap, topoMap].forEach(t => {
      t.anisotropy = 8;
    });
  }, [dayMap, bumpMap, specMap, nightMap, topoMap]);

  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[2, 192, 192]} />
      <meshStandardMaterial
        map={dayMap}
        bumpMap={bumpMap}
        bumpScale={0.05}
        displacementMap={topoMap}
        displacementScale={0.055}
        roughnessMap={specMap}
        roughness={0.8}
        metalness={0.1}
        emissiveMap={nightMap}
        emissive={new THREE.Color(0xffaa44)}
        emissiveIntensity={1.2}
        onBeforeCompile={(shader) => {
          shader.uniforms.sunDirection = { value: new THREE.Vector3(-5, 0, 3).normalize() };
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `
            #include <emissivemap_fragment>
            float sunDot = dot(normalize(vNormal), sunDirection);
            float dayMix = smoothstep(-0.15, 0.15, sunDot);
            totalEmissiveRadiance *= dayMix;
            diffuseColor.rgb *= mix(0.05, 1.0, dayMix);
            `
          );
          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vNormal = normalize(normalMatrix * normal);
            `
          );
        }}
      />
    </mesh>
  );
}

/* ── Cloud layer ── */
function CloudsMesh() {
  const meshRef = useRef();
  const cloudsMap = useLoader(THREE.TextureLoader, `${TEXTURE_BASE}/2k_earth_clouds.jpg`);

  useEffect(() => {
    cloudsMap.colorSpace = THREE.SRGBColorSpace;
    cloudsMap.anisotropy = 8;
  }, [cloudsMap]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.065;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.045}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={cloudsMap}
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ── Atmosphere glow (fresnel shader) ── */
function AtmosphereMesh() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x3366ff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float base = clamp(0.75 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
          float intensity = pow(base, 4.0);
          gl_FragColor = vec4(glowColor, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh scale={1.15} material={material}>
      <sphereGeometry args={[2, 64, 64]} />
    </mesh>
  );
}

/* ── Earth group with axial tilt. Earth + markers/arcs rotate together so
   geographic overlays stay glued to their locations. ── */
function EarthGroup({ events, connections, hiddenCategories, onHover, onSelect, hoveredId }) {
  const rotatingRef = useRef();

  useFrame((_, delta) => {
    if (rotatingRef.current) {
      rotatingRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group rotation={[0, 0, THREE.MathUtils.degToRad(23.5)]}>
      <group ref={rotatingRef}>
        <EarthMesh />
        <GlobeOverlays
          events={events}
          connections={connections}
          hiddenCategories={hiddenCategories}
          onHover={onHover}
          onSelect={onSelect}
          hoveredId={hoveredId}
        />
      </group>
      <CloudsMesh />
      <AtmosphereMesh />
    </group>
  );
}

/* ── Scene with lighting and controls ── */
function GlobeScene(props) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[-5, 0, 3]}
        intensity={2.2}
        color={0xffffff}
      />
      <Stars
        radius={300}
        depth={60}
        count={20000}
        factor={7}
        saturation={0}
        fade
      />
      <EarthGroup {...props} />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={2.6}
        maxDistance={12}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </>
  );
}

/* ── Main exported component ── */
const RealisticGlobe = () => {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const [timelineData, setTimelineData] = useState({ events: [], connections: [] });

  /* Fetch timeline events from Supabase and place them via the gazetteer */
  useEffect(() => {
    let cancelled = false;
    async function fetchTimeline() {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('id, title, description, year, location, category')
        .order('year', { ascending: true });
      if (cancelled || error || !data) return;

      const events = [];
      for (const ev of data) {
        const coords = matchLocation(ev.location);
        if (!coords) continue;
        events.push({
          id: `tl-${ev.id}`,
          name: ev.title,
          lat: coords[0],
          lng: coords[1],
          year: ev.year,
          category: 'timeline',
          description: ev.description || ev.location,
        });
      }
      /* Connect timeline events chronologically so the whole timeline
         forms a continuous path across the globe */
      const connections = [];
      for (let i = 0; i < events.length - 1; i++) {
        if (events[i].lat === events[i + 1].lat && events[i].lng === events[i + 1].lng) continue;
        connections.push({ from: events[i].id, to: events[i + 1].id, category: 'timeline' });
      }
      setTimelineData({ events, connections });
    }
    fetchTimeline();
    return () => { cancelled = true; };
  }, []);

  const allEvents = useMemo(
    () => [...GLOBE_EVENTS, ...timelineData.events],
    [timelineData.events]
  );
  const allConnections = useMemo(
    () => [...GLOBE_CONNECTIONS, ...timelineData.connections],
    [timelineData.connections]
  );

  const toggleCategory = (cat) => {
    setHiddenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const activeEvent = hovered || selected;

  return (
    <div className={s.globeContainer}>
      {!loaded && (
        <div className={s.loadingWrap}>
          <div className={s.spinner} />
          <span className={s.loadingText}>Loading Earth textures…</span>
        </div>
      )}
      <div className={s.canvasWrap}>
        <Canvas
          camera={{ position: [0, 1.5, 5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          onCreated={() => setLoaded(true)}
          onPointerMissed={() => setSelected(null)}
        >
          <color attach="background" args={['#08090d']} />
          <GlobeScene
            events={allEvents}
            connections={allConnections}
            hiddenCategories={hiddenCategories}
            onHover={setHovered}
            onSelect={setSelected}
            hoveredId={hovered?.id}
          />
        </Canvas>
      </div>

      {/* Category legend / filter */}
      <div className={s.legend}>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            className={`${s.legendItem} ${hiddenCategories.has(key) ? s.legendItemDisabled : ''}`}
            onClick={() => toggleCategory(key)}
          >
            <span className={s.legendDot} style={{ background: cat.color }} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Event info panel */}
      {activeEvent && (
        <div className={s.infoPanel}>
          <div
            className={s.infoCategory}
            style={{ color: CATEGORIES[activeEvent.category]?.color }}
          >
            {CATEGORIES[activeEvent.category]?.label}
          </div>
          <div className={s.infoTitle}>
            {activeEvent.name}
            <span className={s.infoYear}>{activeEvent.year}</span>
          </div>
          <p className={s.infoDesc}>{activeEvent.description}</p>
        </div>
      )}
    </div>
  );
};

export default RealisticGlobe;
