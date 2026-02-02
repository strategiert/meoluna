/**
 * p5.js Background Prototypes for Meoluna Landing Page
 * 10 different visual styles to choose from
 */

export { TeslaWaves } from './TeslaWaves';
export { LearningParticles } from './LearningParticles';
export { NeuralConstellation } from './NeuralConstellation';
export { FlowField } from './FlowField';
export { GalaxySpiral } from './GalaxySpiral';
export { DNAHelix } from './DNAHelix';
export { MathGrid } from './MathGrid';
export { Fireflies } from './Fireflies';
export { CircuitBoard } from './CircuitBoard';
export { AuroraWaves } from './AuroraWaves';

// Background metadata for demo page
export const backgroundVariants = [
  {
    id: 'tesla-waves',
    name: 'Tesla Waves',
    description: 'Sinuswellen mit Energie/Frequenz/Vibration Slidern',
    component: 'TeslaWaves',
    inspiration: 'Energie & Wellen',
    params: [
      { name: 'energy', label: 'Energie', min: 0, max: 100, default: 50 },
      { name: 'frequency', label: 'Frequenz', min: 0, max: 100, default: 30 },
      { name: 'vibration', label: 'Vibration', min: 0, max: 100, default: 20 },
    ],
    interactive: true,
  },
  {
    id: 'learning-particles',
    name: 'Learning Particles',
    description: 'Schwebende Buchstaben, Zahlen, Formeln',
    component: 'LearningParticles',
    inspiration: 'Bildung-Theme',
    params: [
      { name: 'density', label: 'Dichte', min: 0, max: 100, default: 50 },
      { name: 'speed', label: 'Geschwindigkeit', min: 0, max: 100, default: 30 },
      { name: 'glow', label: 'Leuchten', min: 0, max: 100, default: 60 },
    ],
    interactive: false,
  },
  {
    id: 'neural-constellation',
    name: 'Neural Constellation',
    description: 'Verbundene Knoten die bei Hover aufleuchten',
    component: 'NeuralConstellation',
    inspiration: 'KI/Lernen',
    params: [
      { name: 'nodeCount', label: 'Knoten', min: 0, max: 100, default: 50 },
      { name: 'connectionDistance', label: 'Verbindungen', min: 0, max: 100, default: 50 },
      { name: 'pulseSpeed', label: 'Puls-Speed', min: 0, max: 100, default: 40 },
    ],
    interactive: true,
  },
  {
    id: 'flow-field',
    name: 'Flow Field',
    description: 'Perlin-Noise Strömungslinien in Aurora-Farben',
    component: 'FlowField',
    inspiration: 'Organisch',
    params: [
      { name: 'particleCount', label: 'Partikel', min: 0, max: 100, default: 50 },
      { name: 'noiseScale', label: 'Noise-Skala', min: 0, max: 100, default: 40 },
      { name: 'speed', label: 'Geschwindigkeit', min: 0, max: 100, default: 50 },
    ],
    interactive: false,
  },
  {
    id: 'galaxy-spiral',
    name: 'Galaxy Spiral',
    description: 'Spiralförmige Sterne die sich drehen',
    component: 'GalaxySpiral',
    inspiration: 'Meoluna Moon-Theme',
    params: [
      { name: 'starCount', label: 'Sterne', min: 0, max: 100, default: 60 },
      { name: 'rotationSpeed', label: 'Rotation', min: 0, max: 100, default: 30 },
      { name: 'spiralTightness', label: 'Spirale', min: 0, max: 100, default: 50 },
    ],
    interactive: true,
  },
  {
    id: 'dna-helix',
    name: 'DNA Helix',
    description: 'Doppelhelix Animation',
    component: 'DNAHelix',
    inspiration: 'Wissenschaft',
    params: [
      { name: 'rotationSpeed', label: 'Rotation', min: 0, max: 100, default: 40 },
      { name: 'helixWidth', label: 'Breite', min: 0, max: 100, default: 50 },
      { name: 'basePairDensity', label: 'Basenpaare', min: 0, max: 100, default: 50 },
    ],
    interactive: false,
  },
  {
    id: 'math-grid',
    name: 'Math Grid',
    description: 'Koordinatensystem mit tanzenden Funktionen',
    component: 'MathGrid',
    inspiration: 'Mathe',
    params: [
      { name: 'animationSpeed', label: 'Animation', min: 0, max: 100, default: 40 },
      { name: 'functionCount', label: 'Funktionen', min: 0, max: 100, default: 50 },
      { name: 'gridOpacity', label: 'Grid-Opacity', min: 0, max: 100, default: 30 },
    ],
    interactive: true,
  },
  {
    id: 'fireflies',
    name: 'Fireflies',
    description: 'Glühwürmchen die der Maus folgen',
    component: 'Fireflies',
    inspiration: 'Magisch',
    params: [
      { name: 'count', label: 'Anzahl', min: 0, max: 100, default: 50 },
      { name: 'glowIntensity', label: 'Leuchten', min: 0, max: 100, default: 60 },
      { name: 'followStrength', label: 'Folgen', min: 0, max: 100, default: 40 },
    ],
    interactive: true,
  },
  {
    id: 'circuit-board',
    name: 'Circuit Board',
    description: 'Leuchtende Leiterbahnen',
    component: 'CircuitBoard',
    inspiration: 'Tech/Digital',
    params: [
      { name: 'density', label: 'Dichte', min: 0, max: 100, default: 50 },
      { name: 'pulseSpeed', label: 'Pulse', min: 0, max: 100, default: 40 },
      { name: 'glowIntensity', label: 'Leuchten', min: 0, max: 100, default: 60 },
    ],
    interactive: true,
  },
  {
    id: 'aurora-waves',
    name: 'Aurora Waves',
    description: 'Nordlicht-ähnliche Farbwellen',
    component: 'AuroraWaves',
    inspiration: 'Meoluna Aurora-Theme',
    params: [
      { name: 'intensity', label: 'Intensität', min: 0, max: 100, default: 60 },
      { name: 'waveSpeed', label: 'Wellen-Speed', min: 0, max: 100, default: 40 },
      { name: 'colorShift', label: 'Farbverschiebung', min: 0, max: 100, default: 50 },
    ],
    interactive: false,
  },
] as const;

export type BackgroundVariantId = typeof backgroundVariants[number]['id'];
