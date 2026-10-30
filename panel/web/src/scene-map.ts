// The map: servers are nodes, tunnels are the links between them, and the traffic is the
// particles moving along a link. Drawn on a canvas; the page around it (numbers, tooltip, text
// alternative) is React.
import { clamp, fitCanvas, lerp, quad, rgba, uiFont } from "./draw";
import type { Palette } from "./draw";

export interface MapServer {
  id: string;
  name: string;
  /** Under the name: the role or place. */
  sub: string;
  st: "up" | "warn" | "down";
}

export interface MapTunnel {
  id: string;
  a: string;
  b: string;
  st: "up" | "down" | "off";
  /** Mbit/s, both directions together. */
  rate: number;
  /** The tunnel's name, on its link. */
  label: string;
  /** Next to the name: the rate while it flows, else its state. */
  value: string;
}

export interface MapData {
  servers: MapServer[];
  tunnels: MapTunnel[];
}

export interface MapHit {
  kind: "server" | "tunnel";
  id: string;
  x: number;
  y: number;
}

export interface MapOptions {
  data: () => MapData;
  palette: () => Palette;
  low: () => boolean;
  rtl: () => boolean;
  onHover: (hit: MapHit | null) => void;
  onOpen: (hit: MapHit) => void;
}

interface Particle {
  k: number;
  dir: number;
  s: number;
}

interface Point {
  x: number;
  y: number;
}

interface Geo {
  key: string;
  narrow: boolean;
  /** The node's radius. */
  r: number;
  pos: Record<string, Point>;
  links: { t: MapTunnel; pts: Point[]; len: number }[];
}

/** Where the nodes go: one in the middle, two side by side, more around an ellipse. */
function place(ids: string[], W: number, H: number, narrow: boolean, rtl: boolean): Record<string, Point> {
  const pos: Record<string, Point> = {};
  const n = ids.length;
  const padX = narrow ? 56 : 120;
  const padY = narrow ? 52 : 64;
  ids.forEach((id, i) => {
    let p: Point;
    if (n === 1) p = { x: W / 2, y: H / 2 - 12 };
    else if (n === 2) p = { x: i === 0 ? padX + 40 : W - padX - 40, y: H / 2 - 12 };
    else {
      // From the top, clockwise, so the first server (this one) is where the eye starts.
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      p = { x: W / 2 + Math.cos(a) * (W / 2 - padX), y: H / 2 - 8 + Math.sin(a) * (H / 2 - padY) };
    }
    pos[id] = rtl ? { x: W - p.x, y: p.y } : p;
  });
  return pos;
}

export function startMap(canvas: HTMLCanvasElement, opts: MapOptions): () => void {
  let raf = 0;
  let stopped = false;
  let geo: Geo | null = null;
  let last = 0;
  let mouse: Point | null = null;
  let hover: MapHit | null = null;
  const fill = new Map<string, number>();
  const parts = new Map<string, Particle[]>();

  const layout = (W: number, H: number): Geo => {
    const { servers, tunnels } = opts.data();
    const narrow = W < 640;
    const pos = place(
      servers.map((s) => s.id),
      W,
      H,
      narrow,
      opts.rtl(),
    );
    // Links between the same two servers bend apart, one to each side in turn.
    const seen = new Map<string, number>();
    const links = tunnels
      .filter((t) => pos[t.a] && pos[t.b])
      .map((t) => {
        const pair = [t.a, t.b].sort().join("|");
        const k = seen.get(pair) ?? 0;
        seen.set(pair, k + 1);
        const p0 = pos[t.a];
        const p1 = pos[t.b];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const d = Math.hypot(dx, dy) || 1;
        // The normal, turned away from the middle of the map so links curve outwards.
        let nx = -dy / d;
        let ny = dx / d;
        const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        if ((mid.x - W / 2) * nx + (mid.y - H / 2) * ny < 0) {
          nx = -nx;
          ny = -ny;
        }
        const side = k % 2 === 0 ? 1 : -1;
        const bend = (0.12 * d + Math.ceil(k / 2) * (narrow ? 22 : 30)) * (k === 0 ? 1 : side);
        const c = { x: mid.x + nx * bend, y: mid.y + ny * bend };
        const pts = Array.from({ length: 61 }, (_, i) => quad(p0, c, p1, i / 60));
        let len = 0;
        for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        return { t, pts, len };
      });
    return { key: key(W, H), narrow, r: narrow ? 14 : 18, pos, links };
  };

  const key = (W: number, H: number) => {
    const { servers, tunnels } = opts.data();
    return `${W}x${H}${opts.rtl()}${servers.map((s) => s.id).join()}|${tunnels.map((t) => `${t.id}${t.a}${t.b}`).join()}`;
  };

  const frame = (now: number) => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    if (!canvas.isConnected || canvas.getBoundingClientRect().width === 0) return;
    const P = opts.palette();
    const { ctx, W, H } = fitCanvas(canvas);
    if (!geo || geo.key !== key(W, H)) geo = layout(W, H);
    const g = geo;
    const { servers, tunnels } = opts.data();
    // The layout is kept while the servers and tunnels stay the same, but what they show
    // (state, rate, labels) is read fresh on every frame.
    const fresh = new Map(tunnels.map((t) => [t.id, t]));
    const current = (t: MapTunnel) => fresh.get(t.id) ?? t;
    const time = now / 1000;
    const dt = Math.min(0.05, last ? time - last : 0.016);
    last = time;
    const still = opts.low();
    const rtl = opts.rtl();
    ctx.clearRect(0, 0, W, H);

    // The ground: a quiet grid of dots.
    ctx.fillStyle = rgba(P.text3, P.night ? 0.16 : 0.22);
    const step = g.narrow ? 22 : 28;
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
    }

    // Links.
    ctx.lineCap = "round";
    for (const ch of g.links) {
      const t = current(ch.t);
      const lit = hover?.kind === "tunnel" && hover.id === t.id;
      const target = t.st === "off" ? 0 : 1;
      const cur = fill.get(t.id) ?? 0;
      const speed = still ? 10 : 1.1;
      const shown = cur < target ? Math.min(target, cur + dt * speed) : Math.max(target, cur - dt * speed);
      fill.set(t.id, shown);
      const reach = t.st === "down" ? 0.55 : 1;
      const path = (from: number, to: number) => {
        ctx.beginPath();
        for (let i = Math.floor(from * 60); i <= Math.ceil(to * 60); i++) {
          if (i === Math.floor(from * 60)) ctx.moveTo(ch.pts[i].x, ch.pts[i].y);
          else ctx.lineTo(ch.pts[i].x, ch.pts[i].y);
        }
      };
      ctx.lineWidth = g.narrow ? 8 : 10;
      ctx.strokeStyle = rgba(P.text3, P.night ? (lit ? 0.3 : 0.16) : lit ? 0.32 : 0.2);
      path(0, 1);
      ctx.stroke();
      if (t.st === "off" || shown < 1) {
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = rgba(P.text3, lit ? 0.9 : 0.55);
        path(0, 1);
        ctx.stroke();
        ctx.restore();
      }
      const w = Math.min(shown, reach);
      if (w > 0.01) {
        const a = ch.pts[0];
        const b = ch.pts[60];
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, P.waterDeep);
        grad.addColorStop(1, lit ? P.waterBright : P.water);
        ctx.lineWidth = g.narrow ? 3.5 : 4.5;
        ctx.strokeStyle = grad;
        ctx.globalAlpha = still ? 0.35 + 0.65 * clamp(t.rate / 400, 0.2, 1) : 1;
        path(0, w);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (t.st === "down" && shown > 0.5) {
        const b = ch.pts[Math.round(reach * 60)];
        const k = still ? 0.5 : (time * 0.8) % 1;
        ctx.strokeStyle = rgba(P.danger, 1 - k);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6 + k * 16, 0, 6.28);
        ctx.stroke();
        ctx.fillStyle = P.danger;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, 6.28);
        ctx.fill();
        ctx.save();
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = rgba(P.danger, 0.5);
        ctx.lineWidth = 1.2;
        path(reach, 1);
        ctx.stroke();
        ctx.restore();
      }
      // Particles: downloads move from the exit to the entry, uploads the other way.
      if (!still && t.st === "up") {
        const list = parts.get(t.id) ?? [];
        parts.set(t.id, list);
        const want = Math.round(clamp(5 + t.rate / 10, 5, 48));
        while (list.length < want) list.push({ k: Math.random(), dir: Math.random() < 0.8 ? -1 : 1, s: 0.5 + Math.random() * 0.7 });
        list.length = Math.min(list.length, want);
        const v = clamp(50 + t.rate * 0.35, 50, 240) / ch.len;
        ctx.globalCompositeOperation = P.night ? "lighter" : "source-over";
        for (const q of list) {
          q.k += q.dir * v * dt * (q.dir < 0 ? 1 : 0.8);
          if (q.k < 0) q.k += 1;
          if (q.k > 1) q.k -= 1;
          if (q.k > shown) continue;
          const i = q.k * 60;
          const i0 = Math.floor(i);
          const f = i - i0;
          const a = ch.pts[i0];
          const b = ch.pts[Math.min(60, i0 + 1)];
          const r = (q.dir < 0 ? 6 : 4.5) * q.s * (g.narrow ? 0.8 : 1);
          ctx.globalAlpha = q.dir < 0 ? 1 : 0.6;
          ctx.drawImage(P.sprite, lerp(a.x, b.x, f) - r, lerp(a.y, b.y, f) - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    }

    // Link labels: a pill with the name, and the rate (or the state) after it. Each part is
    // drawn on its own, left to right, so a number and its unit never turn around in RTL.
    ctx.textBaseline = "middle";
    ctx.direction = "ltr";
    g.links.forEach((ch, i) => {
      const t = current(ch.t);
      const p = ch.pts[Math.round((0.42 + 0.08 * (i % 3)) * 60)];
      const fs = g.narrow ? 10 : 12;
      const nameFont = uiFont(600, fs);
      const valueFont = uiFont(500, fs);
      ctx.font = nameFont;
      const nw = ctx.measureText(t.label).width;
      ctx.font = valueFont;
      const vw = ctx.measureText(t.value).width;
      const gap = 8;
      const padX = 9;
      const w = nw + gap + vw + padX * 2 + 8;
      const h = g.narrow ? 18 : 22;
      const x = clamp(p.x - w / 2, 6, W - w - 6);
      const y = clamp(p.y, h, H - h);
      const lit = hover?.kind === "tunnel" && hover.id === t.id;
      ctx.fillStyle = rgba(P.night ? P.skyTop : "#fffaf1", P.night ? 0.92 : 0.96);
      ctx.beginPath();
      ctx.roundRect(x, y - h / 2, w, h, h / 2);
      ctx.fill();
      ctx.strokeStyle = t.st === "down" ? rgba(P.danger, 0.65) : t.st === "up" ? rgba(P.water, lit ? 0.9 : 0.4) : rgba(P.gold, lit ? 0.7 : 0.25);
      ctx.lineWidth = lit ? 1.5 : 1;
      ctx.stroke();
      // the state dot, then the two parts in reading order
      const dotX = rtl ? x + w - padX - 2 : x + padX + 2;
      ctx.fillStyle = t.st === "up" ? P.water : t.st === "down" ? P.danger : P.text3;
      ctx.beginPath();
      ctx.arc(dotX, y + 0.5, 3, 0, 6.28);
      ctx.fill();
      const inner = rtl ? x + padX : x + padX + 8;
      const nameX = rtl ? inner + vw + gap : inner;
      const valueX = rtl ? inner : inner + nw + gap;
      ctx.textAlign = "left";
      ctx.font = nameFont;
      ctx.fillStyle = t.st === "off" ? P.text3 : P.text;
      ctx.fillText(t.label, nameX, y + 1);
      ctx.font = valueFont;
      ctx.fillStyle = t.st === "up" ? P.water : t.st === "down" ? P.danger : P.text3;
      ctx.fillText(t.value, valueX, y + 1);
    });
    ctx.direction = rtl ? "rtl" : "ltr";

    // The servers: a node with its state on the ring, its name and what it is under it.
    for (const s of servers) {
      const { x, y } = g.pos[s.id];
      const lit = hover?.kind === "server" && hover.id === s.id;
      const state = s.st === "up" ? P.water : s.st === "warn" ? P.warn : P.danger;
      const r = g.r + (lit ? 2 : 0);
      ctx.fillStyle = rgba(state, P.night ? 0.14 : 0.16);
      ctx.beginPath();
      ctx.arc(x, y, r + 7, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = P.night ? P.skyTop : "#fffaf1";
      ctx.strokeStyle = state;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.28);
      ctx.fill();
      ctx.stroke();
      // A small server: two drive bays, each with its light.
      const bw = r * 1.05;
      const bh = r * 0.36;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = rgba(P.text, 0.75);
      for (const dy of [-bh * 0.65, bh * 0.65]) {
        ctx.beginPath();
        ctx.roundRect(x - bw / 2, y + dy - bh / 2, bw, bh, 2);
        ctx.stroke();
        ctx.fillStyle = P.gold;
        ctx.beginPath();
        ctx.arc(x + bw / 2 - bh * 0.55, y + dy, 1.4, 0, 6.28);
        ctx.fill();
      }
      ctx.textAlign = "center";
      ctx.font = uiFont(600, g.narrow ? 11 : 14);
      ctx.fillStyle = P.text;
      const nw = ctx.measureText(s.name).width;
      const lx = clamp(x, nw / 2 + 8, W - nw / 2 - 8);
      const ny = y + r + (g.narrow ? 16 : 20);
      ctx.fillText(s.name, lx, ny);
      if (!g.narrow) {
        ctx.font = uiFont(400, 12);
        ctx.fillStyle = P.text3;
        ctx.fillText(s.sub, lx, ny + 17);
      }
    }

    if (mouse) {
      const h = hit(g, opts.data(), mouse.x, mouse.y);
      if (h?.id !== hover?.id || h?.kind !== hover?.kind) {
        hover = h;
        opts.onHover(h);
        canvas.style.cursor = h ? "pointer" : "default";
      } else if (h) opts.onHover(h);
    }
  };

  const hit = (g: Geo, data: MapData, x: number, y: number): MapHit | null => {
    for (const s of data.servers) {
      const p = g.pos[s.id];
      if (p && Math.abs(x - p.x) < g.r + 34 && y > p.y - g.r - 8 && y < p.y + g.r + 42) return { kind: "server", id: s.id, x, y };
    }
    let best: MapHit | null = null;
    let bd = 14;
    for (const ch of g.links) {
      for (const p of ch.pts) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bd) {
          bd = d;
          best = { kind: "tunnel", id: ch.t.id, x, y };
        }
      }
    }
    return best;
  };

  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onLeave = () => {
    mouse = null;
    if (hover) opts.onHover(null);
    hover = null;
    canvas.style.cursor = "default";
  };
  const onClick = () => {
    if (hover) opts.onOpen(hover);
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("click", onClick);
  raf = requestAnimationFrame(frame);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("click", onClick);
  };
}
