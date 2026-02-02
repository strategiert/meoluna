/**
 * P5Background - Zufälliger p5.js Hintergrund bei jedem Besuch
 * Wählt bei jedem Page-Load einen anderen Effekt
 */

import { useState } from 'react';
import {
  TeslaWaves,
  LearningParticles,
  NeuralConstellation,
  FlowField,
  GalaxySpiral,
  DNAHelix,
  MathGrid,
  Fireflies,
  CircuitBoard,
  AuroraWaves,
} from './backgrounds';

// Alle Backgrounds mit optimierten Default-Parametern
const backgrounds = [
  { Component: TeslaWaves, props: { energy: 50, frequency: 30, vibration: 20 } },
  { Component: LearningParticles, props: { density: 40, speed: 25, glow: 60 } },
  { Component: NeuralConstellation, props: { nodeCount: 50, connectionDistance: 50, pulseSpeed: 40 } },
  { Component: FlowField, props: { particleCount: 50, noiseScale: 40, speed: 50 } },
  { Component: GalaxySpiral, props: { starCount: 60, rotationSpeed: 25, spiralTightness: 50 } },
  { Component: DNAHelix, props: { rotationSpeed: 35, helixWidth: 50, basePairDensity: 50 } },
  { Component: MathGrid, props: { animationSpeed: 35, functionCount: 50, gridOpacity: 25 } },
  { Component: Fireflies, props: { count: 45, glowIntensity: 60, followStrength: 40 } },
  { Component: CircuitBoard, props: { density: 45, pulseSpeed: 40, glowIntensity: 55 } },
  { Component: AuroraWaves, props: { intensity: 55, waveSpeed: 35, colorShift: 50 } },
];

export function P5Background() {
  // Zufälligen Index einmalig beim ersten Render wählen (kein useEffect = kein Re-render)
  const [selectedIndex] = useState(() => Math.floor(Math.random() * backgrounds.length));

  const { Component, props } = backgrounds[selectedIndex];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <Component {...props} />
    </div>
  );
}

export default P5Background;
