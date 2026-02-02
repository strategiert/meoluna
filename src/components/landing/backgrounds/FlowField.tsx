/**
 * Flow Field - Perlin-Noise Strömungslinien in Aurora-Farben
 * Organic flowing particles
 */

import { useRef, useEffect } from 'react';
import p5 from 'p5';

interface FlowFieldProps {
  particleCount?: number;  // 0-100
  noiseScale?: number;     // 0-100
  speed?: number;          // 0-100
}

export function FlowField({
  particleCount = 50,
  noiseScale = 40,
  speed = 50
}: FlowFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      interface Particle {
        pos: p5.Vector;
        prevPos: p5.Vector;
        vel: p5.Vector;
        acc: p5.Vector;
        hue: number;
        alpha: number;
        maxSpeed: number;
      }

      const particles: Particle[] = [];
      let zoff = 0;
      const cols = 50;
      const rows = 50;
      let scl: number;
      const flowField: p5.Vector[] = [];

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.background(0, 0, 0, 0);

        scl = p.width / cols;

        const numParticles = Math.floor((particleCount / 100) * 800) + 200;

        for (let i = 0; i < numParticles; i++) {
          particles.push(createParticle());
        }
      };

      const createParticle = (): Particle => {
        const pos = p.createVector(p.random(p.width), p.random(p.height));
        return {
          pos,
          prevPos: pos.copy(),
          vel: p.createVector(0, 0),
          acc: p.createVector(0, 0),
          hue: p.random(180, 300), // Aurora colors: cyan to magenta
          alpha: p.random(5, 20),
          maxSpeed: p.random(2, 4)
        };
      };

      const updateParticle = (particle: Particle) => {
        particle.prevPos.set(particle.pos);
        particle.vel.add(particle.acc);
        particle.vel.limit(particle.maxSpeed * (speed / 50));
        particle.pos.add(particle.vel);
        particle.acc.mult(0);

        // Wrap around
        if (particle.pos.x > p.width) {
          particle.pos.x = 0;
          particle.prevPos.x = 0;
        }
        if (particle.pos.x < 0) {
          particle.pos.x = p.width;
          particle.prevPos.x = p.width;
        }
        if (particle.pos.y > p.height) {
          particle.pos.y = 0;
          particle.prevPos.y = 0;
        }
        if (particle.pos.y < 0) {
          particle.pos.y = p.height;
          particle.prevPos.y = p.height;
        }
      };

      const followField = (particle: Particle) => {
        const x = p.floor(particle.pos.x / scl);
        const y = p.floor(particle.pos.y / scl);
        const index = x + y * cols;
        const force = flowField[index];
        if (force) {
          particle.acc.add(force);
        }
      };

      p.draw = () => {
        // Fade effect
        p.noStroke();
        p.fill(0, 0, 5, 5);
        p.rect(0, 0, p.width, p.height);

        const noise = (noiseScale / 100) * 0.1 + 0.01;

        // Update flow field
        let yoff = 0;
        for (let y = 0; y < rows; y++) {
          let xoff = 0;
          for (let x = 0; x < cols; x++) {
            const index = x + y * cols;
            const angle = p.noise(xoff, yoff, zoff) * p.TWO_PI * 2;
            const v = p5.Vector.fromAngle(angle);
            v.setMag(0.5);
            flowField[index] = v;
            xoff += noise;
          }
          yoff += noise;
        }
        zoff += 0.002 * (speed / 50);

        // Update and draw particles
        particles.forEach(particle => {
          followField(particle);
          updateParticle(particle);

          // Draw trail
          p.stroke(particle.hue, 70, 90, particle.alpha);
          p.strokeWeight(1);
          p.line(
            particle.prevPos.x, particle.prevPos.y,
            particle.pos.x, particle.pos.y
          );
        });
      };

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(
            containerRef.current.offsetWidth,
            containerRef.current.offsetHeight
          );
          p.background(0, 0, 0, 0);
        }
      };
    };

    p5Ref.current = new p5(sketch, containerRef.current);

    return () => {
      p5Ref.current?.remove();
    };
  }, [particleCount, noiseScale, speed]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
}

export default FlowField;
