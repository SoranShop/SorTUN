// The hero of the front page: a quiet network of servers, drifting slowly, with light (the
// traffic) moving along the links between them, the panel's login scene from the same tokens.
// It follows the pointer a little, fades as the page scrolls, runs only while it is on screen,
// and holds still under reduced motion or low power.
import { clamp, fitCanvas, lerp, paletteNow, rgba, rng } from "./panel/draw";

interface Node {
  x: number;
  y: number;
  ax: number;
  ay: number;
  ph: number;
  r: number;
  z: number;
}

interface Link {
  a: number;
  b: number;
  sparks: { k: number; sp: number }[];
}

export function startHero(canvas: HTMLCanvasElement, section: HTMLElement, fade: HTMLElement[]) {
  let raf = 0;
  let visible = true;
  let mx = 0.5;
  let my = 0.5;
  let seededFor = "";
  let nodes: Node[] = [];
  let links: Link[] = [];
  const still = () =>
    matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.low === "1";

  const seed = (W: number, H: number) => {
    const r = rng(19);
    const count = clamp(Math.round((W * H) / 30000), 14, 46);
    nodes = Array.from({ length: count }, () => ({
      x: 0.03 + r() * 0.94,
      y: 0.05 + r() * 0.78,
      ax: 8 + r() * 16,
      ay: 8 + r() * 16,
      ph: r() * 6.28,
      r: 1.8 + r() * 2.8,
      z: 0.3 + r() * 0.7,
    }));
    const seen = new Set<string>();
    links = [];
    nodes.forEach((n, i) => {
      const near = nodes
        .map((m, j) => ({ j, d: Math.hypot((m.x - n.x) * W, (m.y - n.y) * H) }))
        .filter((o) => o.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2);
      for (const { j } of near) {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(k)) continue;
        seen.add(k);
        links.push({ a: i, b: j, sparks: r() < 0.6 ? [{ k: r(), sp: 0.1 + r() * 0.18 }] : [] });
      }
    });
    seededFor = `${W}x${H}`;
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible) return;
    const P = paletteNow();
    const { ctx, W, H } = fitCanvas(canvas);
    if (seededFor !== `${W}x${H}`) seed(W, H);
    const time = now / 1000;
    const hold = still();
    const rtl = document.documentElement.dir === "rtl";

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, P.skyTop);
    bg.addColorStop(1, P.bg);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // The glow stays clear of the bottom edge, which is the page's own colour, so the next
    // section follows with no seam.
    const glow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, H * 0.5);
    glow.addColorStop(0, rgba(P.water, P.night ? 0.1 : 0.12));
    glow.addColorStop(1, rgba(P.water, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const at = nodes.map((n) => {
      const drift = hold ? 0 : 1;
      const x = n.x * W + drift * Math.sin(time * 0.15 + n.ph) * n.ax + (mx - 0.5) * 28 * n.z;
      return {
        x: rtl ? W - x : x,
        y: n.y * H + drift * Math.cos(time * 0.12 + n.ph) * n.ay + (my - 0.5) * 20 * n.z,
      };
    });

    ctx.lineCap = "round";
    for (const l of links) {
      const a = at[l.a];
      const b = at[l.b];
      const z = (nodes[l.a].z + nodes[l.b].z) / 2;
      ctx.strokeStyle = rgba(P.text3, (P.night ? 0.22 : 0.3) * z);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (hold) continue;
      ctx.globalCompositeOperation = P.night ? "lighter" : "source-over";
      for (const s of l.sparks) {
        s.k = (s.k + s.sp * 0.016) % 1;
        const r = 5 * z;
        ctx.drawImage(P.sprite, lerp(a.x, b.x, s.k) - r, lerp(a.y, b.y, s.k) - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    nodes.forEach((n, i) => {
      const { x, y } = at[i];
      const twinkle = hold ? 1 : 0.75 + 0.25 * Math.sin(time * 1.1 + n.ph);
      const gold = i % 5 === 0;
      ctx.fillStyle = rgba(gold ? P.gold : P.water, 0.18 * n.z);
      ctx.beginPath();
      ctx.arc(x, y, n.r * 3, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = rgba(gold ? P.gold : P.waterBright, 0.85 * n.z * twinkle);
      ctx.beginPath();
      ctx.arc(x, y, n.r, 0, 6.28);
      ctx.fill();
    });

    if (!hold) raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  // The text and the cue fade as the hero scrolls away.
  const onScroll = () => {
    const r = section.getBoundingClientRect();
    const k = clamp(-r.top / Math.max(1, r.height * 0.6), 0, 1);
    for (const el of fade) {
      el.style.opacity = String(1 - k);
      el.style.transform = `translateY(${-k * 30}px)`;
      el.inert = k > 0.6;
    }
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", kick);
  addEventListener("pointermove", (e) => {
    mx = e.clientX / innerWidth;
    my = e.clientY / innerHeight;
    if (still()) kick();
  });
  // A theme or language switch redraws a still scene.
  new MutationObserver(kick).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "dir", "data-low"] });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) kick();
  }).observe(section);

  onScroll();
  kick();
  section.classList.add("ready");
}
