/**
 * Fireflies - Glühwürmchen die der Maus folgen
 * Magical floating lights
 */

import { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface FirefliesProps {
  count?: number;          // 0-100
  glowIntensity?: number;  // 0-100
  followStrength?: number; // 0-100
}

export function Fireflies({
  count = 50,
  glowIntensity = 60,
  followStrength = 40
}: FirefliesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      interface Firefly {
        x: number;
        y: number;
        vx: number;
        vy: number;
        targetX: number;
        targetY: number;
        size: number;
        phase: number;
        hue: number;
        blinkSpeed: number;
        wanderAngle: number;
        trail: { x: number; y: number; alpha: number }[];
      }

      const fireflies: Firefly[] = [];
      let time = 0;

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);

        const numFireflies = Math.floor((count / 100) * 50) + 15;

        for (let i = 0; i < numFireflies; i++) {
          fireflies.push(createFirefly());
        }
      };

      const createFirefly = (): Firefly => ({
        x: p.random(p.width),
        y: p.random(p.height),
        vx: 0,
        vy: 0,
        targetX: p.random(p.width),
        targetY: p.random(p.height),
        size: p.random(3, 8),
        phase: p.random(p.TWO_PI),
        hue: p.random() > 0.7 ? p.random(30, 60) : p.random(80, 120), // Warm yellows and greens
        blinkSpeed: p.random(2, 5),
        wanderAngle: p.random(p.TWO_PI),
        trail: []
      });

      p.draw = () => {
        p.clear();

        const glow = glowIntensity / 100;
        const follow = followStrength / 100;
        time += 0.02;

        fireflies.forEach(firefly => {
          // Wander behavior
          firefly.wanderAngle += p.random(-0.3, 0.3);
          const wanderX = Math.cos(firefly.wanderAngle) * 0.5;
          const wanderY = Math.sin(firefly.wanderAngle) * 0.5;

          // Mouse attraction
          const toMouse = {
            x: mousePos.x - firefly.x,
            y: mousePos.y - firefly.y
          };
          const mouseDist = Math.sqrt(toMouse.x * toMouse.x + toMouse.y * toMouse.y);

          let attractX = 0, attractY = 0;
          if (mouseDist < 300 && mouseDist > 0) {
            const strength = p.map(mouseDist, 0, 300, follow * 2, 0);
            attractX = (toMouse.x / mouseDist) * strength;
            attractY = (toMouse.y / mouseDist) * strength;
          }

          // Update velocity
          firefly.vx += wanderX + attractX;
          firefly.vy += wanderY + attractY;

          // Damping
          firefly.vx *= 0.95;
          firefly.vy *= 0.95;

          // Speed limit
          const speed = Math.sqrt(firefly.vx * firefly.vx + firefly.vy * firefly.vy);
          if (speed > 3) {
            firefly.vx = (firefly.vx / speed) * 3;
            firefly.vy = (firefly.vy / speed) * 3;
          }

          // Update position
          firefly.x += firefly.vx;
          firefly.y += firefly.vy;

          // Bounce off edges with margin
          const margin = 50;
          if (firefly.x < margin) firefly.vx += 0.5;
          if (firefly.x > p.width - margin) firefly.vx -= 0.5;
          if (firefly.y < margin) firefly.vy += 0.5;
          if (firefly.y > p.height - margin) firefly.vy -= 0.5;

          // Keep in bounds
          firefly.x = p.constrain(firefly.x, 0, p.width);
          firefly.y = p.constrain(firefly.y, 0, p.height);

          // Update trail
          firefly.trail.unshift({ x: firefly.x, y: firefly.y, alpha: 30 });
          if (firefly.trail.length > 10) firefly.trail.pop();
          firefly.trail.forEach(t => t.alpha *= 0.85);

          // Calculate blink intensity
          const blink = (Math.sin(time * firefly.blinkSpeed + firefly.phase) + 1) / 2;
          const intensity = 0.3 + blink * 0.7;

          // Draw trail
          firefly.trail.forEach((t, i) => {
            if (t.alpha > 1) {
              p.noStroke();
              p.fill(firefly.hue, 70, 90, t.alpha * glow * intensity);
              const trailSize = firefly.size * (1 - i / firefly.trail.length) * 0.8;
              p.circle(t.x, t.y, trailSize);
            }
          });

          // Draw outer glow
          const glowSize = firefly.size * (3 + blink * 2);
          for (let r = glowSize; r > 0; r -= 3) {
            const alpha = p.map(r, 0, glowSize, 25, 0) * glow * intensity;
            p.noStroke();
            p.fill(firefly.hue, 60, 100, alpha);
            p.circle(firefly.x, firefly.y, r * 2);
          }

          // Draw core
          p.fill(firefly.hue, 40, 100, 80 * intensity);
          p.circle(firefly.x, firefly.y, firefly.size);

          // Draw bright center
          p.fill(0, 0, 100, 60 * intensity);
          p.circle(firefly.x, firefly.y, firefly.size * 0.4);
        });

        // Ambient particles
        if (p.frameCount % 10 === 0) {
          const px = p.random(p.width);
          const py = p.random(p.height);
          p.noStroke();
          p.fill(60, 50, 100, 15);
          p.circle(px, py, p.random(1, 3));
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
  }, [count, glowIntensity, followStrength]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseLeave = () => {
    setMousePos({ x: -1000, y: -1000 });
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

export default Fireflies;
