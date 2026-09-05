import React, { useEffect, useRef } from 'react';

interface Props {
  category?: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'stormy';
  isDay?: boolean;
}

export const DynamicBackground: React.FC<Props> = ({ category = 'sunny', isDay = true }) => {
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

    // Particle definitions based on weather category
    const count = category === 'rainy' || category === 'stormy' ? 120 : category === 'snowy' ? 80 : 40;
    const particles: Array<{
      x: number;
      y: number;
      speedY: number;
      speedX: number;
      size: number;
      opacity: number;
      length?: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedY: category === 'rainy' || category === 'stormy' ? Math.random() * 8 + 10 : category === 'snowy' ? Math.random() * 1.5 + 0.5 : Math.random() * 0.5 - 0.25,
        speedX: category === 'stormy' ? Math.random() * 2 - 4 : category === 'snowy' ? Math.sin(Math.random() * Math.PI) * 0.8 : Math.random() * 0.4 - 0.2,
        size: category === 'snowy' ? Math.random() * 3 + 1.5 : category === 'sunny' ? Math.random() * 3 + 1 : 1.5,
        opacity: Math.random() * 0.6 + 0.2,
        length: category === 'rainy' || category === 'stormy' ? Math.random() * 18 + 10 : 0
      });
    }

    let lightningTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Stormy Lightning Flash Effect
      if (category === 'stormy') {
        lightningTimer++;
        if (lightningTimer % 180 === 0 && Math.random() > 0.4) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(0, 0, width, height);
        }
      }

      particles.forEach(p => {
        ctx.beginPath();
        if (category === 'rainy' || category === 'stormy') {
          // Rain Drop Lines
          ctx.strokeStyle = `rgba(180, 220, 255, ${p.opacity})`;
          ctx.lineWidth = 1.2;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + (p.length || 15));
          ctx.stroke();
        } else if (category === 'snowy') {
          // Soft Snow Particles
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (category === 'sunny') {
          // Solar Dust & Flare Particles
          ctx.fillStyle = isDay ? `rgba(255, 215, 120, ${p.opacity * 0.8})` : `rgba(180, 200, 255, ${p.opacity * 0.5})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Fog / Cloud Particles
          ctx.fillStyle = `rgba(200, 220, 240, ${p.opacity * 0.3})`;
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Move Particles
        p.y += p.speedY;
        p.x += p.speedX;

        // Reset Out of Bounds
        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [category, isDay]);

  let bgClass = "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900";
  let overlayGlow = "from-cyan-500/10 via-blue-500/5 to-purple-500/10";

  if (!isDay) {
    bgClass = "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950";
    overlayGlow = "from-indigo-500/10 via-purple-500/5 to-slate-900/20";
  } else if (category === 'sunny') {
    bgClass = "bg-gradient-to-br from-amber-900/40 via-sky-900/60 to-slate-900";
    overlayGlow = "from-amber-500/20 via-sky-500/10 to-orange-500/10";
  } else if (category === 'rainy') {
    bgClass = "bg-gradient-to-br from-slate-900 via-sky-950 to-blue-950";
    overlayGlow = "from-blue-600/20 via-cyan-500/10 to-slate-900/30";
  } else if (category === 'stormy') {
    bgClass = "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950";
    overlayGlow = "from-purple-600/25 via-indigo-500/15 to-blue-900/20";
  } else if (category === 'cloudy' || category === 'foggy') {
    bgClass = "bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-900";
    overlayGlow = "from-slate-400/10 via-sky-900/10 to-gray-500/10";
  } else if (category === 'snowy') {
    bgClass = "bg-gradient-to-br from-cyan-950 via-slate-900 to-sky-900";
    overlayGlow = "from-cyan-300/15 via-blue-400/10 to-indigo-900/20";
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none transition-all duration-1000">
      <div className={`absolute inset-0 ${bgClass}`} />
      <div className={`absolute inset-0 bg-gradient-to-tr ${overlayGlow} animate-pulse-slow`} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70 pointer-events-none" />
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[15%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px]" />
    </div>
  );
};
