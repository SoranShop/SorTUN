// The login scene: a quiet network of servers, drifting slowly, with light moving along the
// links between them. A wrong password sends a ring out from the middle; a right one zooms
// into the network, and the dashboard comes after it.
import { clamp, easeInOut, fitCanvas, lerp, rgba, rng } from "./draw";
import type { Palette } from "./draw";

export interface LoginSceneOptions {
  palette: () => Palette;
  low: () => boolean;
  rtl: () => boolean;
}

export interface LoginScene {
  /** Starts the zoom; `done` runs when it ends. */
  descend: (done: () => void) => void;
  ripple: () => void;
  stop: () => void;
}

interface Node {
  /** Where it rests, as a share of the screen. */
  x: number;
  y: number;
  /** How far and how fast it drifts. */
  ax: number;
  ay: number;
  ph: number;
  r: number;
  /** Nearer nodes move more with the pointer. */
  z: number;
}

interface Link {
  a: number;
  b: number;
  /** Light along the link: where each one is (0-1) and its speed. */
  sparks: { k: number; sp: number }[];
}

export function startLoginScene(canvas: HTMLCanvasElement, opts: LoginSceneOptions): LoginScene {
  let raf = 0;
  let stopped = false;
  let zoomStart = -1;
  let onDone: (() => void) | null = null;
  let rippleAt = -1;
  let mx = 0.5;
  let my = 0.5;
  let seededFor = "";
  let nodes: Node[] = [];
  let links: Link[] = [];

  const onMove = (e: PointerEvent) => {
    mx = e.clientX / innerWidth;
    my = e.clientY / innerHeight;
  };
  addEventListener("pointermove", onMove);

  const seed = (W: number, H: number) => {
    const r = rng(7);
    const count = clamp(Math.round((W * H) / 52000), 12, 34);
    nodes = Array.from({ length: count }, () => ({
      x: 0.04 + r() * 0.92,
      y: 0.06 + r() * 0.88,
      ax: 6 + r() * 14,
      ay: 6 + r() * 14,
      ph: r() * 6.28,
      r: 1.8 + r() * 2.6,
      z: 0.3 + r() * 0.7,
    }));
    // Each node is linked to its two nearest, once.
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
        links.push({ a: i, b: j, sparks: r() < 0.55 ? [{ k: r(), sp: 0.12 + r() * 0.18 }] : [] });
      }
    });
    seededFor = `${W}x${H}`;
  };

  const frame = (now: number) => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const P = opts.palette();
    const { ctx, W, H } = fitCanvas(canvas);
    if (seededFor !== `${W}x${H}`) seed(W, H);
    const time = now / 1000;
    const still = opts.low();
    const rtl = opts.rtl();

    // The zoom into the middle, when the password was right.
    let p = 0;
    if (zoomStart >= 0) p = clamp((now - zoomStart) / (still ? 250 : 1100), 0, 1);
    const e = easeInOut(p);
    const scale = 1 + e * 2.2;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, P.bg);
    bg.addColorStop(1, P.skyTop);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.max(W, H) * 0.6);
    glow.addColorStop(0, rgba(P.water, P.night ? 0.1 : 0.12));
    glow.addColorStop(1, rgba(P.water, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);

    const at = nodes.map((n) => {
      const drift = still ? 0 : 1;
      const px = (mx - 0.5) * 24 * n.z;
      const py = (my - 0.5) * 18 * n.z;
      const x = n.x * W + drift * Math.sin(time * 0.15 + n.ph) * n.ax + px;
      return {
        x: rtl ? W - x : x,
        y: n.y * H + drift * Math.cos(time * 0.12 + n.ph) * n.ay + py,
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
      if (still) continue;
      ctx.globalCompositeOperation = P.night ? "lighter" : "source-over";
      for (const s of l.sparks) {
        s.k = (s.k + s.sp * 0.016) % 1;
        const r = 5 * z;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(P.sprite, lerp(a.x, b.x, s.k) - r, lerp(a.y, b.y, s.k) - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    nodes.forEach((n, i) => {
      const { x, y } = at[i];
      const twinkle = still ? 1 : 0.75 + 0.25 * Math.sin(time * 1.1 + n.ph);
      ctx.fillStyle = rgba(i % 5 === 0 ? P.gold : P.water, 0.18 * n.z);
      ctx.beginPath();
      ctx.arc(x, y, n.r * 3, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = rgba(i % 5 === 0 ? P.gold : P.waterBright, 0.85 * n.z * twinkle);
      ctx.beginPath();
      ctx.arc(x, y, n.r, 0, 6.28);
      ctx.fill();
    });
    ctx.restore();

    // A wrong password: one red ring out from the middle.
    if (rippleAt >= 0) {
      const k = clamp((now - rippleAt) / (still ? 300 : 900), 0, 1);
      if (k >= 1) rippleAt = -1;
      else {
        ctx.strokeStyle = rgba(P.danger, 0.55 * (1 - k));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 40 + k * Math.max(W, H) * 0.45, 0, 6.28);
        ctx.stroke();
      }
    }

    // The zoom ends in the page's own colour, so the dashboard comes in without a jump.
    if (p > 0) {
      ctx.fillStyle = rgba(P.bg, smoothEnd(e));
      ctx.fillRect(0, 0, W, H);
      if (p >= 1 && onDone) {
        const done = onDone;
        onDone = null;
        done();
      }
    }
  };
  raf = requestAnimationFrame(frame);

  return {
    descend(done) {
      zoomStart = performance.now();
      onDone = done;
    },
    ripple() {
      rippleAt = performance.now();
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
    },
  };
}

/** The cover over the zoom: none for most of it, all of it at the end. */
function smoothEnd(e: number): number {
  return clamp((e - 0.55) / 0.45, 0, 1);
}
