'use client';

import React, { useEffect, useRef } from 'react';

interface WeatherCanvasProps {
  weatherCode: number;
  isDay?: number;
}

export const WeatherCanvas: React.FC<WeatherCanvasProps> = ({ weatherCode, isDay = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Weather type determination
    let type: 'clear-day' | 'clear-night' | 'cloudy' | 'rain' | 'thunderstorm' | 'snow' | 'fog' = 'clear-day';

    if (weatherCode >= 95) type = 'thunderstorm';
    else if (weatherCode >= 71 && weatherCode <= 86) type = 'snow';
    else if (weatherCode >= 51 && weatherCode <= 82) type = 'rain';
    else if (weatherCode === 45 || weatherCode === 48) type = 'fog';
    else if (weatherCode >= 2 && weatherCode <= 3) type = 'cloudy';
    else type = isDay ? 'clear-day' : 'clear-night';

    // Particle definitions
    const particles: any[] = [];
    const particleCount = type === 'rain' || type === 'thunderstorm' ? 140 : type === 'snow' ? 80 : 35;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 1,
        length: Math.random() * 20 + 10,
        speedY: Math.random() * 12 + 8,
        speedX: Math.random() * 2 - 1,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    let lightningTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render sky gradient overlay
      if (type === 'clear-day') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Sun glow
        ctx.beginPath();
        ctx.arc(width * 0.8, 120, 80, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(width * 0.8, 120, 45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
        ctx.fill();
      } else if (type === 'clear-night') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#030712');
        gradient.addColorStop(0.7, '#0f172a');
        gradient.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Stars
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.fill();
        });

        // Moon
        ctx.beginPath();
        ctx.arc(width * 0.8, 120, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(243, 244, 246, 0.9)';
        ctx.fill();
      } else if (type === 'cloudy' || type === 'fog') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#334155');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Drifting fog / cloud layers
        particles.forEach((p) => {
          p.x += p.speedX * 0.3;
          if (p.x > width) p.x = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(203, 213, 225, ${p.opacity * 0.08})`;
          ctx.fill();
        });
      } else if (type === 'rain' || type === 'thunderstorm') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Lightning flash effect
        if (type === 'thunderstorm') {
          lightningTimer++;
          if (lightningTimer % 180 < 5) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(0, 0, width, height);
          }
        }

        // Rain streak particles
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        particles.forEach((p) => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX, p.y + p.length);

          p.y += p.speedY;
          p.x += p.speedX;

          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        });
        ctx.stroke();
      } else if (type === 'snow') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Snowflakes
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.fill();

          p.y += p.speedY * 0.25;
          p.x += Math.sin(p.y * 0.02);

          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weatherCode, isDay]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
    />
  );
};
