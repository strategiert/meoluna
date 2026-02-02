/**
 * Galaxy Spiral - Spiralförmige Sterne die sich drehen
 * Meoluna Moon-Theme inspired
 */

import { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface GalaxySpiralProps {
  starCount?: number;      // 0-100
  rotationSpeed?: number;  // 0-100
  spiralTightness?: number; // 0-100
}

export function GalaxySpiral({
  starCount = 60,
  rotationSpeed = 30,
  spiralTightness = 50
}: GalaxySpiralProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      interface Star {
        angle: number;
        distance: number;
        size: number;
        brightness: number;
        speed: number;
        hue: number;
        twinklePhase: number;
        arm: number;
      }

      const stars: Star[] = [];
      let time = 0;
      const numArms = 4;

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);

        const numStars = Math.floor((starCount / 100) * 400) + 100;

        for (let i = 0; i < numStars; i++) {
          const arm = i % numArms;
          const distFromCenter = p.random(0.1, 1);

          stars.push({
            angle: (arm / numArms) * p.TWO_PI + p.random(-0.5, 0.5),
            distance: distFromCenter * Math.min(p.width, p.height) * 0.45,
            size: p.random(1, 4) * (1 - distFromCenter * 0.5),
            brightness: p.random(50, 100),
            speed: p.random(0.8, 1.2),
            hue: p.random() > 0.7 ? p.random(30, 60) : p.random(200, 280), // Yellow stars or blue/purple
            twinklePhase: p.random(p.TWO_PI),
            arm
          });
        }
      };

      p.draw = () => {
        p.clear();

        const centerX = p.width / 2;
        const centerY = p.height / 2;
        const rotation = rotationSpeed / 1000;
        const tightness = (spiralTightness / 100) * 0.8 + 0.1;

        time += 0.01;

        // Draw central glow (moon)
        const glowSize = Math.min(p.width, p.height) * 0.15;
        for (let r = glowSize; r > 0; r -= 5) {
          const alpha = p.map(r, 0, glowSize, 30, 0);
          p.noStroke();
          p.fill(45, 30, 100, alpha); // Golden moon glow
          p.circle(centerX, centerY, r * 2);
        }

        // Draw and update stars
        stars.forEach(star => {
          // Spiral movement
          star.angle += rotation * star.speed;

          // Calculate position with spiral
          const spiralOffset = star.distance * tightness;
          const x = centerX + Math.cos(star.angle + spiralOffset) * star.distance;
          const y = centerY + Math.sin(star.angle + spiralOffset) * star.distance;

          // Mouse interaction - subtle attraction
          const toMouse = p.createVector(mousePos.x - x, mousePos.y - y);
          const mouseDist = toMouse.mag();
          let fx = x, fy = y;

          if (mouseDist < 200 && mouseDist > 0) {
            const attraction = p.map(mouseDist, 0, 200, 20, 0);
            toMouse.normalize().mult(attraction);
            fx = x + toMouse.x;
            fy = y + toMouse.y;
          }

          // Twinkle effect
          const twinkle = (p.sin(time * 3 + star.twinklePhase) + 1) / 2;
          const currentSize = star.size * (0.7 + twinkle * 0.6);
          const currentBrightness = star.brightness * (0.6 + twinkle * 0.4);

          // Draw star glow
          p.noStroke();
          p.fill(star.hue, 40, currentBrightness, 20);
          p.circle(fx, fy, currentSize * 4);

          // Draw star core
          p.fill(star.hue, 30, currentBrightness, 80);
          p.circle(fx, fy, currentSize);

          // Bright center for larger stars
          if (star.size > 2.5) {
            p.fill(0, 0, 100, 60 * twinkle);
            p.circle(fx, fy, currentSize * 0.4);
          }
        });

        // Draw connecting dust lanes
        p.stroke(220, 30, 50, 5);
        p.strokeWeight(1);
        p.noFill();

        for (let arm = 0; arm < numArms; arm++) {
          p.beginShape();
          for (let d = 0; d < Math.min(p.width, p.height) * 0.45; d += 10) {
            const baseAngle = (arm / numArms) * p.TWO_PI + time * rotation * 50;
            const spiralOffset = d * tightness * 0.01;
            const x = centerX + Math.cos(baseAngle + spiralOffset) * d;
            const y = centerY + Math.sin(baseAngle + spiralOffset) * d;
            p.vertex(x, y);
          }
          p.endShape();
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
  }, [starCount, rotationSpeed, spiralTightness]);

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

export default GalaxySpiral;
