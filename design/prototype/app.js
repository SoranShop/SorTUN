/* SorTUN panel prototype: boot, login, the descent, the live map. No dependencies. */
(() => {
  "use strict";

  // ------------------------------------------------------------------ strings

  const T = {
    fa: {
      "boot.sub": "پنل تانل",
      "theme.toDawn": "سحر",
      "theme.toNight": "شب",
      "login.title": "SorTUN",
      "login.sub": "سرورهایتان به هم وصل، ترافیکتان در جریان.",
      "login.password": "رمز مدیر",
      "login.enter": "ورود",
      "login.or": "یا",
      "login.link": "لینک یک‌بارمصرف دارم",
      "login.checking": "در حال بررسی لینک…",
      "login.foot": "ساخت لینک ورود روی سرور:",
      "login.empty": "رمز را وارد کنید.",
      "login.wrong": "رمز درست نیست. ۴ تلاش دیگر مانده است.",
      "login.show": "نمایش رمز",
      "nav.map": "نقشه",
      "nav.servers": "سرورها",
      "nav.tunnels": "تانل‌ها",
      "nav.logs": "لاگ",
      "nav.settings": "تنظیمات",
      "nav.logout": "خروج",
      "page.map": "نقشه",
      "page.mapSub": "{s} سرور، {t} تانل",
      "page.servers": "سرورها",
      "page.tunnels": "تانل‌ها",
      "page.logs": "لاگ",
      "page.settings": "تنظیمات",
      "page.soon": "در مرحلهٔ ۹.۳",
      search: "جستجو یا اجرای دستور",
      "st.up": "جاری",
      "st.down": "قطع",
      "st.off": "خاموش",
      "st.warn": "هشدار",
      "m.through": "ترافیک همین حالا",
      "m.conns": "اتصال‌های باز",
      "m.connsNote": "استریم TCP و جریان UDP",
      "m.tunnels": "تانل‌های جاری",
      "m.servers": "سرورهای آنلاین",
      "m.serversNote": "همه روی SorTUN 3.0.0",
      "m.of": "از",
      "m.rateNote": "۱۲٪ بیشتر از یک ساعت پیش",
      "m.broken": "قطع:",
      "t.title": "تانل‌ها",
      "t.hint": "یکی را خاموش کنید تا آرام شدن پیوندش را ببینید",
      "t.name": "نام",
      "t.route": "مسیر",
      "t.transport": "ترنسپورت",
      "t.state": "وضعیت",
      "t.traffic": "یک دقیقهٔ اخیر",
      "t.rate": "الان",
      "t.onoff": "روشن / خاموش",
      "tip.down": "دانلود",
      "tip.up": "آپلود",
      "tip.lat": "تأخیر",
      "tip.conns": "اتصال",
      "tip.error": "خطا",
      "tip.cpu": "پردازنده",
      "tip.ram": "حافظه",
      "tip.tunnels": "تانل",
      "tip.role": "نقش",
      "role.entry": "ورودی",
      "role.exit": "خروجی",
      placeholder: "این صفحه در مرحلهٔ ۹.۳ طراحی می‌شود.",
      "proto.label": "نمونهٔ اولیه · رمز: sortun",
      "proto.replay": "پخش دوباره",
      "pal.placeholder": "دستور یا صفحه…",
      "pal.new": "تانل جدید",
      "pal.goto": "برو به",
      "pal.theme": "عوض کردن تم",
      "pal.lang": "English",
      "pal.low": "حالت کم‌مصرف",
      "pal.speed": "اسپیدتست روی تانل main",
      "pal.logout": "خروج",
      "toast.wizard": "wizard ساخت تانل در مرحلهٔ ۹.۳ طراحی می‌شود.",
      "toast.open": "جزئیات تانل در مرحلهٔ ۹.۳ طراحی می‌شود:",
      "toast.speedRun": "اسپیدتست روی main شروع شد…",
      "toast.speedDone": "main: ↓ ۸۴۲ Mbps  ↑ ۱۹۶ Mbps  ·  ۳۹ ms",
      "toast.low.on": "حالت کم‌مصرف روشن شد: ذره‌ها و انیمیشن‌ها متوقف شدند.",
      "toast.low.off": "حالت کم‌مصرف خاموش شد.",
      "toast.welcome": "خوش آمدید. ورود با لینک یک‌بارمصرف؛ لینک باطل شد.",
      stopped: "خاموش",
      "alt.prefix": "نقشهٔ تانل‌ها:",
    },
    en: {
      "boot.sub": "tunnel panel",
      "theme.toDawn": "Dawn",
      "theme.toNight": "Night",
      "login.title": "SorTUN",
      "login.sub": "Your servers, linked. Your traffic, through.",
      "login.password": "Admin password",
      "login.enter": "Enter",
      "login.or": "or",
      "login.link": "I have a one-time link",
      "login.checking": "Checking the link…",
      "login.foot": "Make a one-time link on the server:",
      "login.empty": "Enter the password.",
      "login.wrong": "Wrong password. 4 tries left.",
      "login.show": "Show password",
      "nav.map": "Map",
      "nav.servers": "Servers",
      "nav.tunnels": "Tunnels",
      "nav.logs": "Logs",
      "nav.settings": "Settings",
      "nav.logout": "Sign out",
      "page.map": "Map",
      "page.mapSub": "{s} servers, {t} tunnels",
      "page.servers": "Servers",
      "page.tunnels": "Tunnels",
      "page.logs": "Logs",
      "page.settings": "Settings",
      "page.soon": "in step 9.3",
      search: "Search or run a command",
      "st.up": "flowing",
      "st.down": "broken",
      "st.off": "stopped",
      "st.warn": "warning",
      "m.through": "Throughput now",
      "m.conns": "Open connections",
      "m.connsNote": "TCP streams and UDP flows",
      "m.tunnels": "Tunnels flowing",
      "m.servers": "Servers online",
      "m.serversNote": "all on SorTUN 3.0.0",
      "m.of": "of",
      "m.rateNote": "12% more than an hour ago",
      "m.broken": "Broken:",
      "t.title": "Tunnels",
      "t.hint": "switch one off to watch its link go quiet",
      "t.name": "Name",
      "t.route": "Route",
      "t.transport": "Transport",
      "t.state": "State",
      "t.traffic": "Last minute",
      "t.rate": "Now",
      "t.onoff": "On / off",
      "tip.down": "Down",
      "tip.up": "Up",
      "tip.lat": "Latency",
      "tip.conns": "Connections",
      "tip.error": "Error",
      "tip.cpu": "CPU",
      "tip.ram": "Memory",
      "tip.tunnels": "Tunnels",
      "tip.role": "Role",
      "role.entry": "entry",
      "role.exit": "exit",
      placeholder: "This screen is designed in step 9.3.",
      "proto.label": "Prototype · password: sortun",
      "proto.replay": "Replay intro",
      "pal.placeholder": "A command or a page…",
      "pal.new": "New tunnel",
      "pal.goto": "Go to",
      "pal.theme": "Switch theme",
      "pal.lang": "فارسی",
      "pal.low": "Low-power mode",
      "pal.speed": "Speed test on tunnel main",
      "pal.logout": "Sign out",
      "toast.wizard": "The tunnel wizard is designed in step 9.3.",
      "toast.open": "Tunnel detail is designed in step 9.3:",
      "toast.speedRun": "Speed test on main started…",
      "toast.speedDone": "main: ↓ 842 Mbps  ↑ 196 Mbps  ·  39 ms",
      "toast.low.on": "Low-power mode on: particles and motion stopped.",
      "toast.low.off": "Low-power mode off.",
      "toast.welcome": "Welcome. Signed in with a one-time link; the link is now spent.",
      stopped: "stopped",
      "alt.prefix": "Tunnel map:",
    },
  };

  // ------------------------------------------------------------------ data

  const SERVERS = [
    { id: "teh", name: "tehran-1", loc: { fa: "تهران", en: "Tehran" }, ip: "203.0.113.5", role: "entry", st: "up", cpu: 23, ram: 41 },
    { id: "tbz", name: "tabriz-edge", loc: { fa: "تبریز", en: "Tabriz" }, ip: "203.0.113.18", role: "entry", st: "up", cpu: 12, ram: 28 },
    { id: "fra", name: "frankfurt", loc: { fa: "فرانکفورت", en: "Frankfurt" }, ip: "198.51.100.7", role: "exit", st: "up", cpu: 31, ram: 37 },
    { id: "hel", name: "helsinki", loc: { fa: "هلسینکی", en: "Helsinki" }, ip: "198.51.100.41", role: "exit", st: "up", cpu: 9, ram: 22 },
    { id: "ams", name: "amsterdam", loc: { fa: "آمستردام", en: "Amsterdam" }, ip: "2001:db8::7", role: "exit", st: "warn", cpu: 4, ram: 19 },
  ];

  const TUNNELS = [
    { id: "main", a: "teh", b: "fra", tr: "tcpmux", prof: "ultraspeed", st: "up", base: 420, conns: 812, lat: 38, level: 0 },
    { id: "games", a: "teh", b: "hel", tr: "kcp", prof: "gaming", st: "up", base: 36, conns: 146, lat: 52, level: 1 },
    { id: "cdn", a: "tbz", b: "fra", tr: "wss", prof: "balanced", st: "up", base: 128, conns: 301, lat: 61, level: 2 },
    { id: "backup", a: "tbz", b: "ams", tr: "quic", prof: "balanced", st: "down", base: 0, conns: 0, lat: 0, level: 3,
      err: { fa: "handshake رد شد: توکن دو طرف یکی نیست", en: "handshake rejected: the two sides' tokens differ" } },
    { id: "office", a: "teh", b: "ams", tr: "tcp", prof: "balanced", st: "off", base: 22, conns: 40, lat: 44, level: 4 },
  ];

  for (const t of TUNNELS) {
    t.fill = 0; // how much of the channel holds water, 0..1
    t.noise = Math.random();
    t.down = 0;
    t.up = 0;
    t.open = 0;
    t.hist = Array.from({ length: 60 }, () => 0);
    t.parts = [];
  }

  // ------------------------------------------------------------------ state and helpers

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    lang: "fa",
    theme: "night",
    low: reduced.matches,
    page: "map",
    hot: null, // hovered tunnel id
  };

  const t = (k) => T[state.lang][k] ?? T.en[k] ?? k;
  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  function localDigits(s) {
    if (state.lang !== "fa" || state.digits === "latin") return s;
    return s.replace(/\d/g, (d) => FA_DIGITS[d]).replace(/\./g, "٫").replace(/,/g, "٬");
  }

  function fmt(n, dec = 0) {
    const [i, f] = Math.abs(n).toFixed(dec).split(".");
    const grouped = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return localDigits((n < 0 ? "-" : "") + grouped + (f ? "." + f : ""));
  }

  function fmtRate(mbps) {
    if (mbps >= 1000) return { v: fmt(mbps / 1000, 2), u: "Gbps" };
    return { v: fmt(mbps, mbps < 100 ? 1 : 0), u: "Mbps" };
  }

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const smooth = (a, b, x) => {
    const k = clamp((x - a) / (b - a), 0, 1);
    return k * k * (3 - 2 * k);
  };

  let P = {}; // the palette, read from CSS
  function readPalette() {
    const cs = getComputedStyle(html);
    const v = (n) => cs.getPropertyValue(n).trim();
    P = {
      bg: v("--bg"), skyTop: v("--sky-top"), s1: v("--stratum-1"), s2: v("--stratum-2"), s3: v("--stratum-3"),
      earth: v("--earth"), text: v("--text"), text2: v("--text-2"), text3: v("--text-3"),
      accent: v("--accent"), water: v("--water"), waterBright: v("--water-bright"), waterDeep: v("--water-deep"),
      danger: v("--danger"), warn: v("--warn"), star: v("--star"),
      night: state.theme === "night",
      gold: state.theme === "night" ? "#e9c46a" : "#9a6a10",
    };
    sprite = makeSprite(P.waterBright, P.water);
    redSprite = makeSprite("#ffb3b3", P.danger);
  }

  function rgba(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  let sprite, redSprite;
  function makeSprite(core, edge) {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, core);
    grd.addColorStop(0.35, rgba(edge, 0.55));
    grd.addColorStop(1, rgba(edge, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
    return c;
  }

  function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W: r.width, H: r.height };
  }

  const qb = (p0, c, p1, k) => {
    const m = 1 - k;
    return { x: m * m * p0.x + 2 * m * k * c.x + k * k * p1.x, y: m * m * p0.y + 2 * m * k * c.y + k * k * p1.y };
  };

  const uiFont = (w, px) => `${w} ${px}px "Space Grotesk", "Estedad", system-ui, sans-serif`;
  const monoFont = (px) => `400 ${px}px "IBM Plex Mono", ui-monospace, monospace`;

  // random but repeatable
  function rng(seed) {
    return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  }

  // ------------------------------------------------------------------ i18n, theme, low power

  function applyLang() {
    html.lang = state.lang;
    html.dir = state.lang === "fa" ? "rtl" : "ltr";
    for (const el of $$("[data-i18n]")) el.textContent = t(el.dataset.i18n);
    for (const b of $$('[data-act="lang"]')) b.textContent = b.classList.contains("chip") ? (state.lang === "fa" ? "English" : "فارسی") : state.lang === "fa" ? "EN" : "فا";
    $("#pw-eye").setAttribute("aria-label", t("login.show"));
    $("#palette-input").placeholder = t("pal.placeholder");
    applyThemeLabels();
    setPage(state.page, true, state.param);
    renderRows();
    odoAll(true);
  }

  function applyThemeLabels() {
    for (const b of $$('.chip[data-act="theme"]')) b.textContent = state.theme === "night" ? t("theme.toDawn") : t("theme.toNight");
    for (const b of $$('.square-btn[data-act="theme"]')) b.innerHTML = `<svg><use href="#i-${state.theme === "night" ? "sun" : "moon"}"/></svg>`;
  }

  function toggleTheme() {
    state.theme = state.theme === "night" ? "dawn" : "night";
    html.dataset.theme = state.theme;
    readPalette();
    applyThemeLabels();
    drawSparks();
    for (const f of K.ticks) f();
  }

  function toggleLang() {
    state.lang = state.lang === "fa" ? "en" : "fa";
    applyLang();
  }

  function setLow(on, announce) {
    state.low = on;
    for (const b of $$('[data-act="lowpower"]')) b.setAttribute("aria-pressed", String(on));
    if (announce) toast(t(on ? "toast.low.on" : "toast.low.off"));
  }

  // ------------------------------------------------------------------ the link loader

  const LOADER = `
    <path class="bed" d="M32 45 C 70 15, 110 75, 148 45"/>
    <path class="flow" pathLength="1" d="M32 45 C 70 15, 110 75, 148 45"/>
    <circle class="node" cx="32" cy="45" r="11"/>
    <circle class="node far" cx="148" cy="45" r="11"/>`;
  for (const s of $$("svg.qloader")) s.innerHTML = LOADER;

  // ------------------------------------------------------------------ screens

  function show(id) {
    for (const s of $$(".screen")) s.classList.toggle("is-on", s.id === id);
  }

  function boot() {
    const old = $("#boot");
    const fresh = old.cloneNode(true); // restarts the CSS animations
    old.replaceWith(fresh);
    show("boot");
    setTimeout(() => {
      openLogin();
      if (location.hash.startsWith("#t=")) {
        history.replaceState(null, "", location.pathname); // the token never stays in the address bar
        linkLogin(true);
      }
    }, state.low ? 700 : 2300);
  }

  // ------------------------------------------------------------------ login

  const login = {
    canvas: $("#login-scene"),
    running: false,
    descent: -1, // start time of the zoom in, or -1
    ripple: -1,
    mx: 0.5,
    my: 0.5,
    nodes: [],
    links: [],
  };

  function openLogin() {
    const form = $("#login-form");
    form.classList.remove("is-leaving", "is-busy");
    $("#pw").value = "";
    $("#pw").removeAttribute("aria-invalid");
    $("#pw-err").textContent = "";
    login.descent = -1;
    show("login");
    if (!login.running) {
      login.running = true;
      requestAnimationFrame(loginFrame);
    }
    setTimeout(() => $("#pw").focus({ preventScroll: true }), 400);
  }

  // The login scene: a quiet network of servers, drifting slowly, with light moving along the
  // links between them. A wrong password sends a ring out from the middle; a right one zooms
  // into the network (the panel's own scene-login.ts).
  function seedLogin(W, H) {
    const r = rng(7);
    const count = clamp(Math.round((W * H) / 52000), 12, 34);
    login.nodes = Array.from({ length: count }, () => ({
      x: 0.04 + r() * 0.92, y: 0.06 + r() * 0.88, ax: 6 + r() * 14, ay: 6 + r() * 14,
      ph: r() * 6.28, r: 1.8 + r() * 2.6, z: 0.3 + r() * 0.7,
    }));
    const seen = new Set();
    login.links = [];
    login.nodes.forEach((n, i) => {
      const near = login.nodes
        .map((m, j) => ({ j, d: Math.hypot((m.x - n.x) * W, (m.y - n.y) * H) }))
        .filter((o) => o.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2);
      for (const { j } of near) {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(k)) continue;
        seen.add(k);
        login.links.push({ a: i, b: j, sparks: r() < 0.55 ? [{ k: r(), sp: 0.12 + r() * 0.18 }] : [] });
      }
    });
    login.seeded = `${W}x${H}`;
  }

  function loginFrame(now) {
    if (!$("#login").classList.contains("is-on") && login.descent < 0) {
      login.running = false;
      return;
    }
    const { ctx, W, H } = fitCanvas(login.canvas);
    if (login.seeded !== `${W}x${H}`) seedLogin(W, H);
    const time = now / 1000;
    const still = state.low;
    const rtl = html.dir === "rtl";

    let p = 0;
    if (login.descent >= 0) p = clamp((now - login.descent) / (still ? 250 : 1100), 0, 1);
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
    const at = login.nodes.map((n) => {
      const drift = still ? 0 : 1;
      const x = n.x * W + drift * Math.sin(time * 0.15 + n.ph) * n.ax + (login.mx - 0.5) * 24 * n.z;
      return { x: rtl ? W - x : x, y: n.y * H + drift * Math.cos(time * 0.12 + n.ph) * n.ay + (login.my - 0.5) * 18 * n.z };
    });
    ctx.lineCap = "round";
    for (const l of login.links) {
      const a = at[l.a], b = at[l.b];
      const z = (login.nodes[l.a].z + login.nodes[l.b].z) / 2;
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
        ctx.drawImage(sprite, lerp(a.x, b.x, s.k) - r, lerp(a.y, b.y, s.k) - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    login.nodes.forEach((n, i) => {
      const { x, y } = at[i];
      const tw = still ? 1 : 0.75 + 0.25 * Math.sin(time * 1.1 + n.ph);
      const gold = i % 5 === 0;
      ctx.fillStyle = rgba(gold ? P.gold : P.water, 0.18 * n.z);
      ctx.beginPath();
      ctx.arc(x, y, n.r * 3, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = rgba(gold ? P.gold : P.waterBright, 0.85 * n.z * tw);
      ctx.beginPath();
      ctx.arc(x, y, n.r, 0, 6.28);
      ctx.fill();
    });
    ctx.restore();

    // a wrong password: one red ring out from the middle
    if (login.ripple >= 0) {
      const k = clamp((now - login.ripple) / (still ? 300 : 900), 0, 1);
      if (k >= 1) login.ripple = -1;
      else {
        ctx.strokeStyle = rgba(P.danger, 0.55 * (1 - k));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, 40 + k * Math.max(W, H) * 0.45, 0, 6.28);
        ctx.stroke();
      }
    }

    // the end of the zoom: the page's own colour fills the view
    if (p > 0) {
      ctx.fillStyle = rgba(P.bg, smooth(0.55, 1, e));
      ctx.fillRect(0, 0, W, H);
    }
    if (p >= 1) {
      login.descent = -1;
      enterApp();
    }
    requestAnimationFrame(loginFrame);
  }

  function descend() {
    $("#login-form").classList.add("is-leaving");
    login.descent = performance.now();
  }

  function linkLogin(fromUrl) {
    const form = $("#login-form");
    form.classList.add("is-busy");
    setTimeout(() => {
      descend();
      state.welcome = true;
    }, fromUrl ? 1600 : 1400);
  }

  $("#login-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const pw = $("#pw");
    const err = $("#pw-err");
    if (pw.value === "sortun") {
      err.textContent = "";
      descend();
      return;
    }
    err.textContent = t(pw.value ? "login.wrong" : "login.empty");
    pw.setAttribute("aria-invalid", "true");
    const wrap = $("#pw-wrap");
    wrap.classList.remove("shake");
    void wrap.offsetWidth;
    wrap.classList.add("shake");
    login.ripple = performance.now();
    pw.select();
  });

  $("#pw").addEventListener("input", () => {
    $("#pw").removeAttribute("aria-invalid");
    $("#pw-err").textContent = "";
  });

  $("#pw-eye").addEventListener("click", () => {
    const pw = $("#pw");
    pw.type = pw.type === "password" ? "text" : "password";
    pw.focus();
  });

  $("#link-login").addEventListener("click", () => linkLogin(false));

  addEventListener("pointermove", (e) => {
    login.mx = e.clientX / innerWidth;
    login.my = e.clientY / innerHeight;
  });

  // ------------------------------------------------------------------ app

  function enterApp() {
    const app = $("#app");
    app.classList.add("is-rising");
    show("app");
    setTimeout(() => app.classList.remove("is-rising"), 1200);
    for (const tn of TUNNELS) {
      tn.fill = 0; // channels fill as the dashboard rises
      tn.parts = [];
    }
    odoAll(true);
    if (!map.running) {
      map.running = true;
      requestAnimationFrame(mapFrame);
    }
    if (state.welcome) {
      state.welcome = false;
      setTimeout(() => toast(t("toast.welcome")), 900);
    }
  }

  function logout() {
    show("login");
    openLogin();
  }

  // pages: "map" lives here; the others register in K.pages (pages.js)
  const PAGES = ["map", "servers", "tunnels", "logs", "settings"];
  function setTitle(title, sub, back) {
    $("#page-title").textContent = title;
    $("#page-sub").textContent = sub || "";
    const b = $("#page-back");
    b.hidden = !back;
    b.onclick = back || null;
  }

  function setPage(id, silent, param) {
    const same = state.page === id && state.param === param;
    state.page = id;
    state.param = param;
    const rail = id === "tunnel" ? "tunnels" : id;
    for (const b of $$(".rail-item[data-page]")) {
      if (b.dataset.page === rail) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    }
    const swap = () => {
      let box = $(`.page[data-page="${id}"]`);
      if (!box) {
        box = document.createElement("div");
        box.className = "page";
        box.dataset.page = id;
        $("#main").append(box);
      }
      for (const p of $$(".page")) p.classList.toggle("is-on", p === box);
      if (id === "map") setTitle(t("page.map"), t("page.mapSub").replace("{s}", fmt(SERVERS.length)).replace("{t}", fmt(TUNNELS.length)));
      else K.pages[id]?.render(box, param);
    };
    if (silent || same) return swap();
    const line = $("#loader-line");
    line.classList.add("is-on");
    setTimeout(() => {
      swap();
      line.classList.remove("is-on");
      $("#main").scrollTop = 0;
    }, 450);
  }

  $$(".rail-item[data-page]").forEach((b) => b.addEventListener("click", () => setPage(b.dataset.page)));

  // ------------------------------------------------------------------ simulation

  function tick() {
    for (const tn of TUNNELS) {
      tn.noise = clamp(tn.noise + (Math.random() - 0.5) * 0.25, 0, 1);
      if (tn.st === "up") {
        tn.down = tn.base * (0.7 + 0.6 * tn.noise);
        tn.up = tn.down * (0.16 + 0.06 * Math.random());
        tn.open = Math.round(tn.conns * (0.85 + 0.3 * tn.noise));
      } else {
        tn.down = tn.up = tn.open = 0;
      }
      tn.hist.push(tn.down + tn.up);
      tn.hist.shift();
    }
    updateMetrics();
    updateRowRates();
    drawSparks();
    updateAlt();
    for (const f of K.ticks) f();
  }

  // ------------------------------------------------------------------ odometer numbers

  // Digits roll to their value. A fresh build starts at zero and rolls on the next frame.
  function odo(el, text, fresh) {
    const shape = text.replace(/[0-9۰-۹]/g, "d") + state.lang;
    const digits = state.lang === "fa" ? FA_DIGITS : "0123456789";
    el._text = text;
    el.setAttribute("aria-label", text);
    if (el.dataset.shape !== shape || fresh) {
      el.dataset.shape = shape;
      el.innerHTML = [...text]
        .map((ch) =>
          /[0-9۰-۹]/.test(ch)
            ? `<span class="odo-d"><span class="odo-c">${[...digits].map((d) => `<span>${d}</span>`).join("")}</span></span>`
            : `<span>${ch}</span>`
        )
        .join("");
      requestAnimationFrame(() => requestAnimationFrame(() => roll(el)));
      return;
    }
    roll(el);
  }

  function roll(el) {
    const text = el._text;
    if (text.replace(/[0-9۰-۹]/g, "d") + state.lang !== el.dataset.shape) return; // rebuilt since
    const cols = $$(".odo-c", el);
    let i = 0;
    for (const ch of text) {
      if (!/[0-9۰-۹]/.test(ch)) continue;
      const fa = FA_DIGITS.indexOf(ch);
      cols[i++].style.transform = `translateY(${-(fa >= 0 ? fa : Number(ch)) * 10}%)`;
    }
  }

  function updateMetrics(fresh) {
    const up = TUNNELS.filter((x) => x.st === "up");
    const total = up.reduce((s, x) => s + x.down + x.up, 0);
    const r = fmtRate(total);
    odo($("#m-rate"), r.v, fresh);
    $("#m-rate-unit").textContent = r.u;
    $("#m-rate-note").textContent = "▲ " + t("m.rateNote");
    odo($("#m-conns"), fmt(up.reduce((s, x) => s + x.open, 0)), fresh);
    odo($("#m-tun"), fmt(up.length), fresh);
    $("#m-tun-of").textContent = `${t("m.of")} ${fmt(TUNNELS.length)}`;
    const broken = TUNNELS.filter((x) => x.st === "down").map((x) => x.id);
    $("#m-tun-note").textContent = broken.length ? `${t("m.broken")} ${broken.join(", ")}` : "";
    $("#m-tun-note").style.color = broken.length ? "var(--danger)" : "";
    odo($("#m-srv"), fmt(SERVERS.length), fresh);
    $("#m-srv-of").textContent = `${t("m.of")} ${fmt(SERVERS.length)}`;
  }

  function odoAll(fresh) {
    updateMetrics(fresh);
  }

  // ------------------------------------------------------------------ tunnel rows

  const byId = (id) => SERVERS.find((s) => s.id === id);

  function stateLabel(st) {
    return { up: t("st.up"), down: t("st.down"), off: t("st.off") }[st];
  }

  function renderRows() {
    const body = $("#tunnel-rows");
    body.innerHTML = TUNNELS.map(
      (tn) => `
      <tr data-t="${tn.id}">
        <td><button class="t-name link">${tn.id}</button></td>
        <td><span class="t-route"><span>${byId(tn.a).name}</span><svg><use href="#i-arrow"/></svg><span>${byId(tn.b).name}</span></span></td>
        <td class="c-transport"><span class="tag">${tn.tr}</span> <span class="tag">${tn.prof}</span></td>
        <td><span class="state ${tn.st}"><i class="dot ${tn.st}"></i>${stateLabel(tn.st)}</span></td>
        <td class="c-spark"><canvas class="spark" aria-hidden="true"></canvas></td>
        <td class="rate num"></td>
        <td><button class="switch" role="switch" aria-checked="${tn.st !== "off"}" aria-label="${tn.id}"></button></td>
      </tr>`
    ).join("");
    for (const row of $$("tr[data-t]", body)) {
      const tn = TUNNELS.find((x) => x.id === row.dataset.t);
      $(".switch", row).addEventListener("click", () => toggleTunnel(tn));
      $(".t-name", row).addEventListener("click", () => setPage("tunnel", false, tn.id));
      row.addEventListener("mouseenter", () => (state.hot = tn.id));
      row.addEventListener("mouseleave", () => (state.hot = null));
    }
    updateRowRates();
    drawSparks();
  }

  function updateRowRates() {
    for (const row of $$("#tunnel-rows tr[data-t]")) {
      const tn = TUNNELS.find((x) => x.id === row.dataset.t);
      const cell = $(".rate", row);
      if (tn.st === "up") {
        const r = fmtRate(tn.down + tn.up);
        cell.textContent = `${r.v} ${r.u}`;
      } else cell.textContent = "—";
      row.classList.toggle("is-hot", state.hot === tn.id);
    }
  }

  function drawSparks() {
    for (const row of $$("#tunnel-rows tr[data-t]")) {
      const tn = TUNNELS.find((x) => x.id === row.dataset.t);
      const cv = $(".spark", row);
      if (!cv || !cv.getBoundingClientRect().width) continue;
      const { ctx, W, H } = fitCanvas(cv);
      ctx.clearRect(0, 0, W, H);
      const max = Math.max(1, ...tn.hist) * 1.15;
      const pts = tn.hist.map((v, i) => ({ x: (i / (tn.hist.length - 1)) * W, y: H - 2 - (v / max) * (H - 6) }));
      if (html.dir === "rtl") for (const q of pts) q.x = W - q.x;
      const col = tn.st === "down" ? P.danger : tn.st === "off" ? P.text3 : P.water;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rgba(col, 0.28));
      g.addColorStop(1, rgba(col, 0));
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.lineTo(pts[pts.length - 1].x, H);
      ctx.lineTo(pts[0].x, H);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function toggleTunnel(tn) {
    K.setRunning(tn, tn.st === "off"); // pages.js keeps the events and the broken flag
  }

  // ------------------------------------------------------------------ the map

  const map = { canvas: $("#map"), running: false, geo: null, mouse: null };

  // the layout changes with the size, the direction and the servers and tunnels on it
  const mapKey = (W, H) => `${W}x${H}${html.dir}${SERVERS.map((s) => s.id).join()}${TUNNELS.map((x) => x.id + x.level).join()}`;

  // Servers are nodes, tunnels the links between them (the panel's own scene-map.ts): one
  // node in the middle, two side by side, more around an ellipse from the top, clockwise.
  function layout(W, H) {
    const narrow = W < 640;
    const rtl = html.dir === "rtl";
    const n = SERVERS.length;
    const padX = narrow ? 56 : 120;
    const padY = narrow ? 52 : 64;
    const pos = {};
    SERVERS.forEach((s, i) => {
      let p;
      if (n === 1) p = { x: W / 2, y: H / 2 - 12 };
      else if (n === 2) p = { x: i === 0 ? padX + 40 : W - padX - 40, y: H / 2 - 12 };
      else {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        p = { x: W / 2 + Math.cos(a) * (W / 2 - padX), y: H / 2 - 8 + Math.sin(a) * (H / 2 - padY) };
      }
      pos[s.id] = rtl ? { x: W - p.x, y: p.y } : p;
    });
    // links between the same two servers bend apart, one to each side in turn
    const seen = {};
    const chans = TUNNELS.map((tn) => {
      const pair = [tn.a, tn.b].sort().join("|");
      const k = seen[pair] || 0;
      seen[pair] = k + 1;
      const p0 = pos[tn.a], p1 = pos[tn.b];
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const d = Math.hypot(dx, dy) || 1;
      let nx = -dy / d, ny = dx / d;
      const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      if ((mid.x - W / 2) * nx + (mid.y - H / 2) * ny < 0) (nx = -nx), (ny = -ny);
      const side = k % 2 === 0 ? 1 : -1;
      const bend = (0.12 * d + Math.ceil(k / 2) * (narrow ? 22 : 30)) * (k === 0 ? 1 : side);
      const c = { x: mid.x + nx * bend, y: mid.y + ny * bend };
      const pts = Array.from({ length: 61 }, (_, i) => qb(p0, c, p1, i / 60));
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      return { tn, p0, p1, c, pts, len };
    });
    return { W, H, pos, chans, narrow, rtl, r: narrow ? 14 : 18, key: mapKey(W, H) };
  }

  function mapFrame(now) {
    if (!$("#app").classList.contains("is-on")) {
      map.running = false;
      return;
    }
    requestAnimationFrame(mapFrame);
    if (state.page !== "map") return;
    const { ctx, W, H } = fitCanvas(map.canvas);
    const rtl = html.dir === "rtl";
    if (!map.geo || map.geo.key !== mapKey(W, H)) map.geo = layout(W, H);
    const g = map.geo;
    const time = now / 1000;
    const dt = Math.min(0.05, map.last ? time - map.last : 0.016);
    map.last = time;
    const still = state.low;

    ctx.clearRect(0, 0, W, H);

    // the ground: a quiet grid of dots
    ctx.fillStyle = rgba(P.text3, P.night ? 0.16 : 0.22);
    const step = g.narrow ? 22 : 28;
    for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
    ctx.lineCap = "round";

    // links
    const hover = map.hoverT || state.hot;
    for (const ch of g.chans) {
      const tn = ch.tn;
      const target = tn.st === "off" ? 0 : 1;
      const speed = still ? 10 : 1.1;
      tn.fill = tn.fill < target ? Math.min(target, tn.fill + dt * speed) : Math.max(target, tn.fill - dt * speed);
      const reach = tn.st === "down" ? 0.55 : 1; // a broken link carries traffic up to the break
      const lit = hover === tn.id;
      const path = (from, to) => {
        const a = Math.floor(from * 60), b = Math.ceil(to * 60);
        ctx.beginPath();
        for (let i = a; i <= b; i++) (i === a ? ctx.moveTo : ctx.lineTo).call(ctx, ch.pts[i].x, ch.pts[i].y);
      };

      // the track
      ctx.lineWidth = g.narrow ? 8 : 10;
      ctx.strokeStyle = rgba(P.text3, P.night ? (lit ? 0.3 : 0.16) : lit ? 0.32 : 0.2);
      path(0, 1);
      ctx.stroke();
      if (tn.st === "off" || tn.fill < 1) {
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = rgba(P.text3, lit ? 0.9 : 0.55);
        path(0, 1);
        ctx.stroke();
        ctx.restore();
      }
      // traffic
      const w = Math.min(tn.fill, reach);
      if (w > 0.01) {
        const grad = ctx.createLinearGradient(ch.p0.x, ch.p0.y, ch.p1.x, ch.p1.y);
        grad.addColorStop(0, P.waterDeep);
        grad.addColorStop(1, lit ? P.waterBright : P.water);
        ctx.lineWidth = g.narrow ? 3.5 : 4.5;
        ctx.strokeStyle = grad;
        ctx.globalAlpha = still ? 0.35 + 0.65 * clamp((tn.down + tn.up) / 400, 0.2, 1) : 1;
        path(0, w);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // the break
      if (tn.st === "down" && tn.fill > 0.5) {
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

      // particles: downloads flow exit -> entry, uploads entry -> exit
      if (!still && tn.st === "up") {
        const rate = tn.down + tn.up;
        const want = Math.round(clamp(6 + rate / 9, 6, 56));
        while (tn.parts.length < want) tn.parts.push({ k: Math.random(), dir: Math.random() < 0.8 ? -1 : 1, s: 0.5 + Math.random() * 0.7, j: Math.random() * 6 });
        if (tn.parts.length > want) tn.parts.length = want;
        const v = clamp(50 + rate * 0.35, 50, 240) / ch.len; // in path fractions per second
        ctx.globalCompositeOperation = P.night ? "lighter" : "source-over";
        for (const q of tn.parts) {
          q.k += q.dir * v * dt * (q.dir < 0 ? 1 : 0.8);
          if (q.k < 0) q.k += 1;
          if (q.k > 1) q.k -= 1;
          if (q.k > tn.fill) continue;
          const i = q.k * 60, i0 = Math.floor(i), f = i - i0;
          const a = ch.pts[i0], b = ch.pts[Math.min(60, i0 + 1)];
          const x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f);
          const r = (q.dir < 0 ? 7 : 5) * q.s * (g.narrow ? 0.8 : 1);
          ctx.globalAlpha = q.dir < 0 ? 1 : 0.6;
          ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    }

    // link labels
    ctx.textBaseline = "middle";
    ctx.direction = html.dir;
    for (const ch of g.chans) {
      const tn = ch.tn;
      const k = 0.42 + 0.08 * (tn.level % 3);
      const p = ch.pts[Math.round(k * 60)];
      let label = tn.id;
      if (tn.st === "up") {
        const r = fmtRate(tn.down + tn.up);
        label += `  ${r.v} ${r.u}`;
      } else label += `  ${stateLabel(tn.st)}`;
      ctx.font = uiFont(500, g.narrow ? 10 : 12);
      const tw = ctx.measureText(label).width + 14;
      const y = clamp(p.y, 12, H - 12);
      ctx.fillStyle = rgba(P.night ? P.skyTop : "#fbf6ec", 0.85);
      roundRect(ctx, p.x - tw / 2, y - 9, tw, 18, 4);
      ctx.fill();
      ctx.strokeStyle = tn.st === "down" ? rgba(P.danger, 0.6) : rgba(P.gold, hover === tn.id ? 0.7 : 0.25);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = tn.st === "down" ? P.danger : tn.st === "off" ? P.text3 : P.text;
      ctx.textAlign = "center";
      ctx.fillText(label, p.x, y + 1);
    }

    // the servers: a node with its state on the ring, its name and what it is under it
    for (const s of SERVERS) {
      const { x, y } = g.pos[s.id];
      const lit = map.hoverS === s.id;
      const col = s.st === "up" ? P.water : s.st === "warn" ? P.warn : P.danger;
      const r = g.r + (lit ? 2 : 0);
      ctx.fillStyle = rgba(col, P.night ? 0.14 : 0.16);
      ctx.beginPath();
      ctx.arc(x, y, r + 7, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = P.night ? P.skyTop : "#fffaf1";
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.28);
      ctx.fill();
      ctx.stroke();
      // a small server: two drive bays, each with its light
      const bw = r * 1.05, bh = r * 0.36;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = rgba(P.text, 0.75);
      for (const dy of [-bh * 0.65, bh * 0.65]) {
        roundRect(ctx, x - bw / 2, y + dy - bh / 2, bw, bh, 2);
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
      const lx = clamp(x, nw / 2 + 8, W - nw / 2 - 8); // keep edge labels on screen
      const ny = y + r + (g.narrow ? 16 : 20);
      ctx.fillText(s.name, lx, ny);
      if (!g.narrow) {
        ctx.font = uiFont(400, 12);
        ctx.fillStyle = P.text3;
        ctx.fillText(`${s.loc[state.lang]} · ${t("role." + s.role)}`, lx, ny + 17);
      }
    }

    // keep the tooltip fresh while hovering
    if (map.mouse) updateTip();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function hitTest(mx, my) {
    const g = map.geo;
    if (!g) return {};
    for (const s of SERVERS) {
      const x = g.pos[s.id];
      if (Math.abs(mx - x.x) < g.r + 34 && my > x.y - g.r - 8 && my < x.y + g.r + 42) return { s };
    }
    let best = null, bd = 14;
    for (const ch of g.chans) {
      for (const p of ch.pts) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < bd) (bd = d), (best = ch.tn);
      }
    }
    return { tn: best };
  }

  function updateTip() {
    const tip = $("#map-tip");
    const { x, y } = map.mouse;
    const hit = hitTest(x, y);
    map.hoverT = hit.tn ? hit.tn.id : null;
    map.hoverS = hit.s ? hit.s.id : null;
    map.canvas.classList.toggle("is-pointing", !!(hit.tn || hit.s));
    if (!hit.tn && !hit.s) {
      tip.classList.remove("is-on");
      return;
    }
    const row = (a, b, mono) => `<div class="row"><span>${a}</span><span class="${mono ? "mono" : "num"}">${b}</span></div>`;
    if (hit.tn) {
      const tn = hit.tn;
      const d = fmtRate(tn.down), u = fmtRate(tn.up);
      tip.innerHTML =
        `<b>${tn.id}</b><div class="row" style="margin-bottom:6px"><span class="mono">${byId(tn.a).name} → ${byId(tn.b).name}</span></div>` +
        (tn.st === "up"
          ? row(t("tip.down"), `${d.v} ${d.u}`) + row(t("tip.up"), `${u.v} ${u.u}`) + row(t("tip.lat"), `${fmt(tn.lat)} ms`) + row(t("tip.conns"), fmt(tn.open))
          : tn.st === "down"
          ? `<div class="row" style="color:var(--danger)"><span>${tn.err[state.lang]}</span></div>`
          : row(t("t.state"), stateLabel("off"))) +
        row(t("t.transport"), `${tn.tr} · ${tn.prof}`, true);
    } else {
      const s = hit.s;
      tip.innerHTML =
        `<b>${s.name}</b>` +
        row("IP", `<span dir="ltr">${s.ip}</span>`, true) +
        row(t("tip.role"), t("role." + s.role)) +
        row(t("tip.cpu"), `${fmt(s.cpu)}%`) +
        row(t("tip.ram"), `${fmt(s.ram)}%`) +
        row(t("tip.tunnels"), fmt(TUNNELS.filter((x) => x.a === s.id || x.b === s.id).length));
    }
    const band = map.canvas.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = x + 16, top = y + 16;
    if (left + tw > band.width - 8) left = x - tw - 16;
    if (top + th > band.height - 8) top = y - th - 16;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;
    tip.classList.add("is-on");
  }

  map.canvas.addEventListener("pointermove", (e) => {
    const r = map.canvas.getBoundingClientRect();
    map.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  map.canvas.addEventListener("pointerleave", () => {
    map.mouse = null;
    map.hoverT = map.hoverS = null;
    $("#map-tip").classList.remove("is-on");
  });
  map.canvas.addEventListener("click", () => {
    if (map.hoverT) setPage("tunnel", false, map.hoverT);
  });

  function updateAlt() {
    $("#map-alt").textContent =
      t("alt.prefix") +
      " " +
      TUNNELS.map((tn) => `${tn.id} (${byId(tn.a).name} → ${byId(tn.b).name}): ${stateLabel(tn.st)}${tn.st === "up" ? ", " + fmtRate(tn.down + tn.up).v + " " + fmtRate(tn.down + tn.up).u : ""}`).join("; ");
  }

  // ------------------------------------------------------------------ command palette

  const commands = () => [
    ...K.commands(),
    ...PAGES.map((p) => ({ label: `${t("pal.goto")} ${t("page." + p)}`, hint: "", run: () => setPage(p) })),
    { label: t("pal.speed"), hint: "", run: speedtest },
    { label: t("pal.theme"), hint: "", run: toggleTheme },
    { label: t("pal.lang"), hint: "", run: toggleLang },
    { label: t("pal.low"), hint: state.low ? "✓" : "", run: () => setLow(!state.low, true) },
    { label: t("pal.logout"), hint: "", run: logout },
  ];

  const pal = { el: $("#palette"), input: $("#palette-input"), list: $("#palette-list"), sel: 0, items: [] };

  function openPalette() {
    if (!$("#app").classList.contains("is-on")) return;
    pal.el.classList.add("is-on");
    pal.input.value = "";
    pal.sel = 0;
    renderPalette();
    setTimeout(() => pal.input.focus(), 30);
  }
  function closePalette() {
    pal.el.classList.remove("is-on");
  }
  function renderPalette() {
    const q = pal.input.value.trim().toLowerCase();
    pal.items = commands().filter((c) => c.label.toLowerCase().includes(q));
    pal.sel = clamp(pal.sel, 0, Math.max(0, pal.items.length - 1));
    pal.list.innerHTML = pal.items
      .map((c, i) => `<li role="option" aria-selected="${i === pal.sel}" data-i="${i}"><span>${c.label}</span><span class="hint">${c.hint}</span></li>`)
      .join("");
    for (const li of $$("li", pal.list)) {
      li.addEventListener("click", () => runPalette(Number(li.dataset.i)));
      li.addEventListener("mousemove", () => {
        if (pal.sel !== Number(li.dataset.i)) {
          pal.sel = Number(li.dataset.i);
          renderPalette();
        }
      });
    }
  }
  function runPalette(i) {
    const c = pal.items[i];
    closePalette();
    if (c) c.run();
  }
  pal.input.addEventListener("input", () => {
    pal.sel = 0;
    renderPalette();
  });
  pal.input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") (pal.sel = (pal.sel + 1) % Math.max(1, pal.items.length)), renderPalette(), e.preventDefault();
    else if (e.key === "ArrowUp") (pal.sel = (pal.sel - 1 + pal.items.length) % Math.max(1, pal.items.length)), renderPalette(), e.preventDefault();
    else if (e.key === "Enter") runPalette(pal.sel);
  });
  pal.el.addEventListener("click", (e) => {
    if (e.target === pal.el) closePalette();
  });

  addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      pal.el.classList.contains("is-on") ? closePalette() : openPalette();
    } else if (e.key === "Escape") closePalette();
  });

  function speedtest() {
    toast(t("toast.speedRun"));
    const line = $("#loader-line");
    line.classList.add("is-on");
    const main = TUNNELS[0];
    const base = main.base;
    main.base = 900; // the channel runs full during the test
    setTimeout(() => {
      main.base = base;
      line.classList.remove("is-on");
      toast(t("toast.speedDone"));
    }, 4000);
  }

  // ------------------------------------------------------------------ toasts

  function toast(text) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    $("#toasts").append(el);
    setTimeout(() => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 250);
    }, 3400);
  }

  // ------------------------------------------------------------------ wiring

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "lang") toggleLang();
    else if (act === "theme") toggleTheme();
    else if (act === "lowpower") setLow(!state.low, true);
    else if (act === "palette") openPalette();
    else if (act === "logout") logout();
    else if (act === "replay") {
      closePalette();
      boot();
    }
  });

  // shared with pages.js and wizard.js
  const K = (window.K = {
    T, SERVERS, TUNNELS, state, pages: {}, ticks: [], commands: () => [],
    $, $$, t, fmt, fmtRate, localDigits, clamp, lerp, rgba, fitCanvas, uiFont, monoFont, rng, byId, stateLabel,
    toast, setPage, setTitle, odo, LOADER, speedtest, toggleTheme, toggleLang, setLow, logout, renderRows, tick,
    get P() { return P; },
    addStrings(more) {
      for (const lang of Object.keys(more)) Object.assign(T[lang], more[lang]);
    },
  });

  reduced.addEventListener("change", () => setLow(reduced.matches, false));
  addEventListener("resize", () => drawSparks());

  html.dataset.theme = state.theme; // the start theme (the site passes ?theme=dawn along)
  readPalette();
  applyThemeLabels();
  setLow(state.low, false);
  applyLang();
  tick();
  setInterval(tick, 1000);
  document.fonts?.ready.then(() => (map.geo = null));
  addEventListener("DOMContentLoaded", boot); // after pages.js and wizard.js have registered
})();
