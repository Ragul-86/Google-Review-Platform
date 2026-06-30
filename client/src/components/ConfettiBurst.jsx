import { useEffect, useRef } from 'react';

const COLORS = ['#FBBF24', '#F59E0B', '#34D399', '#60A5FA', '#F472B6', '#A78BFA'];

/* ── Lightweight confetti burst ────────────────────────────────────
   A small self-contained canvas particle system — no extra npm
   dependency. Mounts only while `active` is true and clears itself
   automatically after `duration` ms. Fired once when a Scratch Card
   reward is revealed. */
export default function ConfettiBurst({ active, duration = 2200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 90 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 60 * dpr,
      y: canvas.height * 0.22,
      vx: (Math.random() - 0.5) * 9 * dpr,
      vy: (Math.random() * -9 - 4) * dpr,
      size: (Math.random() * 6 + 4) * dpr,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
    }));

    const gravity = 0.32 * dpr;
    const drag = 0.992;
    const start = performance.now();
    let rafId;

    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.vy += gravity;
        p.vx *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      if (elapsed < duration) rafId = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [active, duration]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100] w-full h-full"
      aria-hidden="true"
    />
  );
}
