import { useEffect, useRef } from "react";

/** Lightweight canvas constellation. Disabled on small/reduced-motion devices. */
export function HeroBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    if (reduce || mobile) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const nodes = Array.from({ length: 46 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00035,
    }));

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 0.16) {
            ctx.strokeStyle = `rgba(46,233,166,${(1 - d / 0.16) * 0.16})`;
            ctx.lineWidth = 1 * devicePixelRatio;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * w, nodes[i].y * h);
            ctx.lineTo(nodes[j].x * w, nodes[j].y * h);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = "rgba(232,195,106,0.85)";
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, 1.6 * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid-fade bg-[size:56px_56px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -left-24 top-10 h-72 w-72 animate-float rounded-full bg-mint-500/20 blur-3xl" />
      <div className="absolute right-0 top-24 h-80 w-80 animate-float rounded-full bg-iris-500/20 blur-3xl [animation-delay:1.4s]" />
      <div className="absolute bottom-10 left-1/3 h-56 w-56 animate-pulse-slow rounded-full bg-gold-500/10 blur-3xl" />
      <div className="absolute left-[12%] top-[22%] hidden h-40 w-40 rotate-12 rounded-3xl border border-white/10 bg-white/5 shadow-glass backdrop-blur-md md:block" />
      <div className="absolute right-[14%] top-[18%] hidden h-28 w-28 -rotate-6 rounded-2xl border border-mint-500/20 bg-mint-500/5 shadow-glow md:block" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
