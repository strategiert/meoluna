/**
 * Tesla Waves - Sinuswellen mit Energie/Frequenz/Vibration
 * Dynamische Wellenvisualisierung für Meoluna
 */

import { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface TeslaWavesProps {
  energy?: number;      // 0-100
  frequency?: number;   // 0-100
  vibration?: number;   // 0-100
}

export function TeslaWaves({
  energy = 50,
  frequency = 30,
  vibration = 20
}: TeslaWavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let time = 0;
      const waves: { offset: number; amplitude: number; speed: number; color: [number, number, number] }[] = [];
      const numWaves = 8;

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.noFill();

        // Initialize waves with Meoluna colors
        for (let i = 0; i < numWaves; i++) {
          waves.push({
            offset: (i / numWaves) * p.PI * 2,
            amplitude: 30 + i * 15,
            speed: 0.5 + i * 0.1,
            color: [
              220 + i * 10, // Hue: Blue to Purple (Meoluna theme)
              60 + i * 5,
              70 + i * 3
            ]
          });
        }
      };

      p.draw = () => {
        p.clear();

        const energyFactor = energy / 50;
        const freqFactor = (frequency / 50) * 2;
        const vibFactor = vibration / 100;

        const centerY = p.height / 2;
        time += 0.02 * energyFactor;

        // Draw waves
        waves.forEach((wave, i) => {
          p.stroke(wave.color[0], wave.color[1], wave.color[2], 40 - i * 3);
          p.strokeWeight(2 + (numWaves - i) * 0.3);

          p.beginShape();
          for (let x = 0; x <= p.width; x += 3) {
            const mouseInfluence = p.dist(x, centerY, mousePos.x, mousePos.y);
            const mouseEffect = p.map(mouseInfluence, 0, 300, vibFactor * 50, 0);

            const y = centerY +
              p.sin(x * 0.01 * freqFactor + time * wave.speed + wave.offset) * wave.amplitude * energyFactor +
              p.sin(x * 0.02 + time * 2) * 10 * vibFactor +
              (mouseEffect > 0 ? p.sin(time * 10) * mouseEffect : 0);

            p.vertex(x, y);
          }
          p.endShape();
        });

        // Add glow particles along waves
        if (p.frameCount % 3 === 0) {
          const waveIndex = p.floor(p.random(numWaves));
          const wave = waves[waveIndex];
          const x = p.random(p.width);
          const y = centerY +
            p.sin(x * 0.01 * freqFactor + time * wave.speed + wave.offset) * wave.amplitude * energyFactor;

          p.push();
          p.noStroke();
          p.fill(wave.color[0], 80, 100, 30);
          p.circle(x, y, p.random(3, 8));
          p.pop();
        }
      };

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(
            containerRef.current.offsetWidth,
            containerRef.current.offsetHeight
          );
        }
      };
    };

    p5Ref.current = new p5(sketch, containerRef.current);

    return () => {
      p5Ref.current?.remove();
    };
  }, [energy, frequency, vibration]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      onMouseMove={handleMouseMove}
    />
  );
}

export default TeslaWaves;
