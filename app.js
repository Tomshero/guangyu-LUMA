/* =========================================================
   光屿 LUMA — app logic
   Vanilla JS. No dependencies. Everything stays in this browser.
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "luma-canvas-v1";
  const MAX_NOTES = 8;
  const MOBILE_BREAKPOINT = 900;
  const TAU = Math.PI * 2;

  const THEME_ORDER = ["lime", "ember", "tide", "iris"];

  const THEMES = {
    lime: {
      id: "lime",
      name: "青柠微光",
      en: "LICHEN",
      accent: "#deff63",
      accent2: "#7df5c8",
      bg: "#080b09",
      ink: "#f2f4e7",
    },
    ember: {
      id: "ember",
      name: "余烬日落",
      en: "EMBER",
      accent: "#ff9a76",
      accent2: "#ffd27d",
      bg: "#100b08",
      ink: "#f8efe6",
    },
    tide: {
      id: "tide",
      name: "深海潮汐",
      en: "TIDE",
      accent: "#8ed9ff",
      accent2: "#9f9bff",
      bg: "#060a12",
      ink: "#edf3f8",
    },
    iris: {
      id: "iris",
      name: "鸢尾黄昏",
      en: "IRIS",
      accent: "#dab7ff",
      accent2: "#ffb0d3",
      bg: "#0c0812",
      ink: "#f4eef8",
    },
  };

  const MOODS = [
    { label: "微光", sub: "a quiet kind of glow" },
    { label: "潮汐", sub: "in and out, gently" },
    { label: "失重", sub: "floating, for now" },
    { label: "回响", sub: "something answers" },
  ];

  const DEFAULT_HERO = {
    line1: "把灵感，",
    line2: "揉进夜色。",
    lede: "这不是一张看完就走的页面。改一句话，拖动一枚星屑，换一束光——它会记住你的每一次任性。",
  };

  const DEFAULT_NOTES = [
    {
      id: "seed-moon",
      kicker: "FIELD NOTE / 捕捉",
      title: "凌晨两点的月亮",
      body: "像一枚被遗忘的句号，挂在梦的句尾。先别急着把它读明白。",
      tag: "A THOUGHT, CAUGHT",
      x: 44.5,
      y: 8.2,
      r: -3.4,
      size: "regular",
    },
    {
      id: "seed-wind",
      kicker: "SMALL RITUAL / 练习",
      title: "给问题一点风",
      body: "不急着回答。让它在房间里再待一会儿，也许会自己长出新的形状。",
      tag: "LET IT BREATHE",
      x: 74.4,
      y: 26.5,
      r: 2.7,
      size: "regular",
    },
    {
      id: "seed-gravity",
      kicker: "FUTURE SELF / 寄给",
      title: "把小事做久",
      body: "每天向宇宙发送一个微小的信号。重复本身，就是一种温柔的引力。",
      tag: "SIGNAL NO. 003",
      x: 65.2,
      y: 60.5,
      r: -1.9,
      size: "wide",
    },
  ];

  const NEW_NOTE_PRESETS = [
    {
      kicker: "NEW SIGNAL / 新信号",
      title: "一枚刚降落的星屑",
      body: "写下刚刚闪过的念头吧。它不需要完整，只要真实。",
      tag: "JUST LANDED",
    },
    {
      kicker: "SMALL JOY / 小确幸",
      title: "今天值得记住的事",
      body: "也许是风刚好吹过，也许是一杯温度刚好的水。",
      tag: "TINY, BUT BRIGHT",
    },
    {
      kicker: "UNFINISHED / 未完成",
      title: "还没想明白的事",
      body: "先把它放在这儿。留白不是空缺，是给答案留的位置。",
      tag: "TO BE CONTINUED",
    },
    {
      kicker: "MIDNIGHT / 午夜",
      title: "一个没有名字的念头",
      body: "它可能只来这一趟。趁它还亮着，把它留住。",
      tag: "BEFORE IT FADES",
    },
  ];

  const NEW_NOTE_SLOTS = [
    { x: 50.2, y: 35.5, r: -1.6 },
    { x: 77.2, y: 47.2, r: 2.2 },
    { x: 55.8, y: 12.2, r: 1.4 },
    { x: 73.8, y: 67.4, r: -2.4 },
    { x: 51.8, y: 66.8, r: 1.1 },
    { x: 61.2, y: 43.6, r: -1.2 },
    { x: 42.8, y: 31.2, r: 2.6 },
    { x: 78.2, y: 29.6, r: -1.9 },
  ];

  const DEFAULT_SETTINGS = {
    theme: "lime",
    customAccent: null,
    mood: 0,
    motion: 1,
    grain: true,
    dust: true,
    pointerLight: true,
  };

  const CANVAS_SANS = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", sans-serif';
  const CANVAS_SERIF = '"Kaiti SC", "STKaiti", "KaiTi", "Songti SC", "Noto Serif SC", serif';
  const CANVAS_MONO = '"Cascadia Code", "SFMono-Regular", "Roboto Mono", Consolas, monospace';

  /* ---------- tiny utilities ---------- */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pad2 = (value) => String(value).padStart(2, "0");
  const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const cloneNotes = (notes) => notes.map((note) => ({ ...note }));
  const uid = () => `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const rand = (min, max) => min + Math.random() * (max - min);
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  function toFiniteNumber(value, fallback) {
    const number = typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function cleanString(value, fallback, maxLength) {
    if (typeof value !== "string") return fallback;
    return value
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
      .slice(0, maxLength);
  }

  function makeDefaultSettings() {
    return { ...DEFAULT_SETTINGS };
  }

  function makeDefaultData() {
    return {
      app: "luma",
      version: 1,
      hero: { ...DEFAULT_HERO },
      notes: cloneNotes(DEFAULT_NOTES),
      settings: makeDefaultSettings(),
    };
  }

  function normalizeHex(value) {
    if (typeof value !== "string") return null;
    let hex = value.trim();
    if (/^#[0-9a-f]{3}$/i.test(hex)) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : null;
  }

  function hexToRgb(hex) {
    const safe = normalizeHex(hex) || "#ffffff";
    return {
      r: Number.parseInt(safe.slice(1, 3), 16),
      g: Number.parseInt(safe.slice(3, 5), 16),
      b: Number.parseInt(safe.slice(5, 7), 16),
    };
  }

  function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function rgbChannels(hex) {
    const { r, g, b } = hexToRgb(hex);
    return `${r}, ${g}, ${b}`;
  }

  function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const channel = (value) => {
      const v = value / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }

  function readableOn(hex) {
    const background = relativeLuminance(hex);
    const dark = relativeLuminance("#080b09");
    const light = relativeLuminance("#f8faef");
    const darkContrast = (Math.max(background, dark) + 0.05) / (Math.min(background, dark) + 0.05);
    const lightContrast = (Math.max(background, light) + 0.05) / (Math.min(background, light) + 0.05);
    return lightContrast > darkContrast ? "#f8faef" : "#080b09";
  }

  function rgbToHsl({ r, g, b }) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: lightness };
    const delta = max - min;
    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    let hue;
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    return { h: hue * 60, s: saturation, l: lightness };
  }

  function hslToHex(h, s, l) {
    const hue = ((h % 360) + 360) % 360 / 360;
    if (s === 0) {
      const v = Math.round(l * 255);
      return `#${v.toString(16).padStart(2, "0").repeat(3)}`;
    }
    const hueToRgb = (p, q, t) => {
      let next = t;
      if (next < 0) next += 1;
      if (next > 1) next -= 1;
      if (next < 1 / 6) return p + (q - p) * 6 * next;
      if (next < 1 / 2) return q;
      if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const red = Math.round(hueToRgb(p, q, hue + 1 / 3) * 255);
    const green = Math.round(hueToRgb(p, q, hue) * 255);
    const blue = Math.round(hueToRgb(p, q, hue - 1 / 3) * 255);
    return `#${[red, green, blue].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function deriveAccent(hex) {
    const hsl = rgbToHsl(hexToRgb(hex));
    return hslToHex(
      hsl.h + 54,
      clamp(hsl.s * 0.82, 0.35, 0.9),
      clamp(hsl.l * 0.9 + 0.08, 0.42, 0.82)
    );
  }

  function resolveTheme(themeId, customAccent) {
    if (themeId === "custom") {
      const accent = normalizeHex(customAccent) || THEMES.lime.accent;
      return {
        id: "custom",
        name: "自定义",
        en: "CUSTOM",
        accent,
        accent2: deriveAccent(accent),
        bg: THEMES.lime.bg,
        ink: THEMES.lime.ink,
      };
    }
    return { ...(THEMES[themeId] || THEMES.lime) };
  }

  function normalizeHero(rawHero) {
    if (!isObject(rawHero)) return { ...DEFAULT_HERO };
    return {
      line1: cleanString(rawHero.line1, DEFAULT_HERO.line1, 36),
      line2: cleanString(rawHero.line2, DEFAULT_HERO.line2, 36),
      lede: cleanString(rawHero.lede, DEFAULT_HERO.lede, 180),
    };
  }

  function normalizeSettings(rawSettings) {
    const settings = makeDefaultSettings();
    if (!isObject(rawSettings)) return settings;

    if (rawSettings.theme === "custom") {
      const accent = normalizeHex(rawSettings.customAccent);
      if (accent) {
        settings.theme = "custom";
        settings.customAccent = accent;
      }
    } else if (THEME_ORDER.includes(rawSettings.theme)) {
      settings.theme = rawSettings.theme;
      settings.customAccent = normalizeHex(rawSettings.customAccent);
    }

    const mood = Math.round(toFiniteNumber(rawSettings.mood, 0));
    settings.mood = ((mood % MOODS.length) + MOODS.length) % MOODS.length;
    settings.motion = clamp(toFiniteNumber(rawSettings.motion, 1), 0.2, 2);

    ["grain", "dust", "pointerLight"].forEach((key) => {
      if (typeof rawSettings[key] === "boolean") settings[key] = rawSettings[key];
    });

    return settings;
  }

  function normalizeNotes(rawNotes) {
    if (!Array.isArray(rawNotes)) return cloneNotes(DEFAULT_NOTES);
    const usedIds = new Set();

    return rawNotes.slice(0, MAX_NOTES).map((rawNote, index) => {
      const slot = NEW_NOTE_SLOTS[index % NEW_NOTE_SLOTS.length];
      const fallbackSize = index === 2 ? "wide" : "regular";
      const source = isObject(rawNote) ? rawNote : {};
      let id = typeof source.id === "string" && /^[a-z0-9_-]{1,48}$/i.test(source.id) ? source.id : "";
      if (!id || usedIds.has(id)) id = uid();
      usedIds.add(id);

      return {
        id,
        kicker: cleanString(source.kicker, "FIELD NOTE / 星屑", 44).trim() || "FIELD NOTE / 星屑",
        title: cleanString(source.title ?? "", "", 40).trim(),
        body: cleanString(source.body ?? "", "", 260).trim(),
        tag: cleanString(source.tag, "A SMALL NOTE", 52).trim() || "A SMALL NOTE",
        x: clamp(toFiniteNumber(source.x, slot.x), 1, 82),
        y: clamp(toFiniteNumber(source.y, slot.y), 1, 78),
        r: clamp(toFiniteNumber(source.r, slot.r), -8, 8),
        size:
          source.size === "wide" || (source.size === undefined && fallbackSize === "wide")
            ? "wide"
            : "regular",
      };
    });
  }

  function sanitizeData(raw) {
    if (!isObject(raw)) return null;
    if (raw.app && raw.app !== "luma") return null;
    const hasHero = isObject(raw.hero);
    const hasNotes = Array.isArray(raw.notes);
    if (!hasHero && !hasNotes) return null;

    return {
      app: "luma",
      version: 1,
      hero: hasHero ? normalizeHero(raw.hero) : { ...DEFAULT_HERO },
      notes: hasNotes ? normalizeNotes(raw.notes) : cloneNotes(DEFAULT_NOTES),
      settings: normalizeSettings(raw.settings),
    };
  }

  function normalizeInlineText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s*\n+\s*/g, " ")
      .trim();
  }

  function normalizeBlockText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }

  function debounce(fn, wait) {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), wait);
    };
  }

  function fileTimestamp() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}${values.month}${values.day}-${values.hour}${values.minute}${values.second}`;
  }

  /* ---------- DOM references ---------- */

  const dom = {
    app: $("#app"),
    stage: $("#stage"),
    notes: $("#notes"),
    connections: $("#connections"),
    modeToggle: $("#modeToggle"),
    heroPrimary: $("#heroPrimary"),
    guideBtn: $("#guideBtn"),
    settingsBtn: $("#settingsBtn"),
    exportBtn: $("#exportBtn"),
    exportMenu: $("#exportMenu"),
    themeShuffle: $("#themeShuffle"),
    orb: $("#orb"),
    orbMood: $("#orbMood"),
    orbSub: $("#orbSub"),
    orbNumber: $("#orbNumber"),
    moodStatus: $("#moodStatus"),
    heroLine1: $("#heroLine1"),
    heroLine2: $("#heroLine2"),
    heroLede: $("#heroLede"),
    customColor: $("#customColor"),
    panelColor: $("#panelColor"),
    clock: $("#clock"),
    topDate: $("#topDate"),
    editTools: $("#editTools"),
    saveState: $("#saveState"),
    motionRange: $("#motionRange"),
    motionOutput: $("#motionOutput"),
    themeFlash: $("#themeFlash"),
    pointerLight: $("#pointerLight"),
    settingsPanel: $("#settingsPanel"),
    settingsClose: $("#settingsClose"),
    panelScrim: $("#panelScrim"),
    panelExportPng: $("#panelExportPng"),
    panelExportJson: $("#panelExportJson"),
    panelImport: $("#panelImport"),
    resetButton: $("#resetButton"),
    guideDialog: $("#guideDialog"),
    guideClose: $("#guideClose"),
    guideStart: $("#guideStart"),
    toast: $("#toast"),
    toastText: $("#toastText"),
    toastAction: $("#toastAction"),
    fileInput: $("#fileInput"),
    stardust: $("#stardust"),
  };

  const finePointerQuery = window.matchMedia("(pointer: fine)");
  const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- application state ---------- */

  let settings = makeDefaultSettings();
  let editing = false;
  let panelOpen = false;
  let panelReturnFocus = null;
  let saveTimer = 0;
  let toastTimer = 0;
  let toastActionHandler = null;
  let moodAnimationTimer = 0;
  let resetArmedTimer = 0;
  let resetArmed = false;
  let linksRaf = 0;
  let linkObserver = null;
  let pointerRaf = 0;
  let lastPointer = { x: 0, y: 0 };
  let lastLimitToastAt = 0;
  let posterBusy = false;
  let localStorageBroken = false;
  let starfield = null;
  let clockTimer = 0;
  let hasBoundEvents = false;

  /* =========================================================
     Starfield
     ========================================================= */

  class Starfield {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: true });
      this.stars = [];
      this.bursts = [];
      this.meteor = null;
      this.pointer = { x: 0, y: 0, active: false };
      this.speed = 1;
      this.visible = true;
      this.reduced = reducedMotionQuery.matches;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.dpr = 1;
      this.lastFrame = performance.now();
      this.nextMeteorAt = performance.now() + rand(5500, 11000);
      this.palette = {
        accent: THEMES.lime.accent,
        accent2: THEMES.lime.accent2,
        ink: THEMES.lime.ink,
        accentRgb: hexToRgb(THEMES.lime.accent),
        accent2Rgb: hexToRgb(THEMES.lime.accent2),
        inkRgb: hexToRgb(THEMES.lime.ink),
      };
      this.raf = 0;
      this.handleResize = debounce(() => this.resize(), 150);
      window.addEventListener("resize", this.handleResize, { passive: true });
      if (reducedMotionQuery.addEventListener) {
        reducedMotionQuery.addEventListener("change", (event) => {
          this.reduced = event.matches;
        });
      }
      this.resize();
      this.start();
    }

    resize() {
      this.width = Math.max(1, window.innerWidth);
      this.height = Math.max(1, window.innerHeight);
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (this.canvas) {
        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
      }
      if (this.ctx) {
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
      this.buildStars();
    }

    buildStars() {
      const count = Math.min(165, Math.max(68, Math.round((this.width * this.height) / 13500)));
      this.stars = Array.from({ length: count }, () => {
        const toneRoll = Math.random();
        return {
          nx: Math.random(),
          ny: Math.random(),
          size: rand(0.45, 1.65),
          phase: rand(0, TAU),
          drift: rand(0.3, 1.25),
          twinkle: rand(0.35, 1.4),
          tone: toneRoll > 0.82 ? 1 : toneRoll > 0.66 ? 2 : 0,
          depth: rand(0.5, 1),
        };
      });
    }

    setPalette(accent, accent2, ink) {
      this.palette = {
        accent,
        accent2,
        ink,
        accentRgb: hexToRgb(accent),
        accent2Rgb: hexToRgb(accent2),
        inkRgb: hexToRgb(ink),
      };
    }

    setSpeed(value) {
      this.speed = clamp(value, 0.2, 2);
    }

    setVisible(value) {
      this.visible = Boolean(value);
    }

    setPointer(x, y, active) {
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.active = Boolean(active);
    }

    burst(x, y, count = 24) {
      if (!this.visible || this.reduced || !this.ctx) return;
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * TAU;
        const velocity = rand(18, 165);
        const life = rand(0.55, 1.25);
        this.bursts.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - rand(4, 28),
          life,
          maxLife: life,
          size: rand(0.6, 2.2),
          color: Math.random() > 0.5 ? this.palette.accentRgb : this.palette.accent2Rgb,
        });
      }
    }

    start() {
      if (this.raf) return;
      this.lastFrame = performance.now();
      const loop = (now) => {
        const delta = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
        this.lastFrame = now;
        if (this.visible) this.draw(now, delta);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    draw(now, delta) {
      const ctx = this.ctx;
      if (!ctx) return;

      const width = this.width;
      const height = this.height;
      const time = this.reduced ? 0 : (now / 1000) * this.speed;
      const pointer = this.pointer;

      ctx.clearRect(0, 0, width, height);

      const positioned = this.stars.map((star) => {
        const x =
          star.nx * width +
          Math.cos(time * (0.055 + star.drift * 0.05) + star.phase) * (0.8 + star.depth * 2.2);
        const y =
          star.ny * height +
          Math.sin(time * (0.045 + star.drift * 0.04) + star.phase * 1.4) * (0.7 + star.depth * 1.7);
        return { star, x, y };
      });

      if (pointer.active && !this.reduced) {
        for (const item of positioned) {
          const dx = item.x - pointer.x;
          const dy = item.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 175 && distance > 2) {
            const alpha = (1 - distance / 175) * 0.14;
            ctx.strokeStyle = `rgba(${this.palette.accentRgb.r}, ${this.palette.accentRgb.g}, ${this.palette.accentRgb.b}, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(item.x, item.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      for (const item of positioned) {
        const { star } = item;
        const twinkle = this.reduced
          ? 0.58
          : 0.44 + 0.5 * Math.sin(time * star.twinkle * 1.45 + star.phase);
        const alpha = clamp(twinkle, 0.1, 0.9) * (0.45 + star.depth * 0.42);
        const color =
          star.tone === 1 ? this.palette.accentRgb : star.tone === 2 ? this.palette.accent2Rgb : this.palette.inkRgb;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(item.x, item.y, star.size, 0, TAU);
        ctx.fill();

        if (star.tone === 1 && !this.reduced && star.size > 1.15) {
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.11})`;
          ctx.beginPath();
          ctx.arc(item.x, item.y, star.size * 5.5, 0, TAU);
          ctx.fill();
        }
      }

      if (!this.reduced) {
        if (!this.meteor && now > this.nextMeteorAt) {
          const angle = rand(0.34, 0.52);
          const speed = rand(360, 540);
          this.meteor = {
            x: rand(width * 0.05, width * 0.72),
            y: rand(height * 0.05, height * 0.28),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: rand(1.1, 1.65),
            maxLife: 1.65,
          };
        }

        if (this.meteor) {
          const meteor = this.meteor;
          meteor.x += meteor.vx * delta;
          meteor.y += meteor.vy * delta;
          meteor.life -= delta;
          const strength = clamp(meteor.life / 0.65, 0, 1);
          const velocity = Math.hypot(meteor.vx, meteor.vy) || 1;
          const tail = 155 * strength;
          const tailX = meteor.x - (meteor.vx / velocity) * tail;
          const tailY = meteor.y - (meteor.vy / velocity) * tail;
          const gradient = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
          gradient.addColorStop(0, `rgba(${this.palette.accent2Rgb.r}, ${this.palette.accent2Rgb.g}, ${this.palette.accent2Rgb.b}, 0)`);
          gradient.addColorStop(0.75, `rgba(${this.palette.accent2Rgb.r}, ${this.palette.accent2Rgb.g}, ${this.palette.accent2Rgb.b}, ${0.22 * strength})`);
          gradient.addColorStop(1, `rgba(${this.palette.inkRgb.r}, ${this.palette.inkRgb.g}, ${this.palette.inkRgb.b}, ${0.72 * strength})`);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.35;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(meteor.x, meteor.y);
          ctx.stroke();
          ctx.fillStyle = `rgba(${this.palette.inkRgb.r}, ${this.palette.inkRgb.g}, ${this.palette.inkRgb.b}, ${0.7 * strength})`;
          ctx.beginPath();
          ctx.arc(meteor.x, meteor.y, 1.3, 0, TAU);
          ctx.fill();

          if (meteor.life <= 0 || meteor.x > width + 220 || meteor.y > height + 220) {
            this.meteor = null;
            this.nextMeteorAt = now + rand(8500, 16000);
          }
        }

        if (this.bursts.length) {
          ctx.globalCompositeOperation = "lighter";
          for (let index = this.bursts.length - 1; index >= 0; index -= 1) {
            const particle = this.bursts[index];
            particle.life -= delta;
            if (particle.life <= 0) {
              this.bursts.splice(index, 1);
              continue;
            }
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
            particle.vx *= 0.985;
            particle.vy = particle.vy * 0.985 + 22 * delta;
            const lifeRatio = particle.life / particle.maxLife;
            ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${lifeRatio * 0.72})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * lifeRatio + 0.35, 0, TAU);
            ctx.fill();
          }
          ctx.globalCompositeOperation = "source-over";
        }
      }
    }
  }

  /* =========================================================
     Boot
     ========================================================= */

  function init() {
    if (!dom.app || !dom.stage) return;

    const saved = loadSavedData();
    applyData(saved || makeDefaultData(), { persist: false });

    try {
      starfield = new Starfield(dom.stardust);
      const theme = resolveTheme(settings.theme, settings.customAccent);
      starfield.setPalette(theme.accent, theme.accent2, theme.ink);
      starfield.setSpeed(settings.motion);
      starfield.setVisible(settings.dust);
    } catch (error) {
      console.warn("LUMA: stardust could not start.", error);
    }

    bindEvents();
    setupLinkObservers();
    updateClock();
    clockTimer = window.setInterval(updateClock, 1000);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => queueLinks()).catch(() => {});
    }
    window.setTimeout(() => queueLinks(), 500);
    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener("change", () => queueLinks());
    }
  }

  function loadSavedData() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return sanitizeData(JSON.parse(raw));
    } catch (error) {
      console.warn("LUMA: local canvas was not readable.", error);
      return null;
    }
  }

  /* =========================================================
     Data → page
     ========================================================= */

  function applyData(data, { persist = false } = {}) {
    hideToast();
    if (editing) {
      setEditing(false, { quiet: true, skipSave: true });
    }

    settings = normalizeSettings(data.settings);
    setHero(data.hero);
    renderNotes(normalizeNotes(data.notes));
    applyTheme({ silent: true });
    setMood(settings.mood, { silent: true, animate: false });
    applyMotion({ silent: true });
    applyAtmosphere({ silent: true });
    syncEditableState();
    updateNoteCounts();
    queueLinks(true);

    if (persist) persistNow({ quiet: true });
  }

  function setHero(hero) {
    const normalized = normalizeHero(hero);
    if (dom.heroLine1) dom.heroLine1.textContent = normalized.line1;
    if (dom.heroLine2) dom.heroLine2.textContent = normalized.line2;
    if (dom.heroLede) dom.heroLede.textContent = normalized.lede;
  }

  function renderNotes(notes) {
    if (!dom.notes) return;
    dom.notes.replaceChildren();
    notes.forEach((note, index) => {
      dom.notes.appendChild(createNoteElement(note, index));
    });
    updateNoteCounts();
    syncEditableState();
    resetLinkObserver();
    queueLinks(true);
  }

  function createNoteElement(note, index, { isNew = false } = {}) {
    const article = document.createElement("article");
    article.className = `note${note.size === "wide" ? " note--wide" : ""}${isNew ? " is-new" : ""}`;
    article.dataset.id = note.id;
    article.dataset.x = String(note.x);
    article.dataset.y = String(note.y);
    article.dataset.r = String(note.r);
    article.style.setProperty("--x", `${note.x}%`);
    article.style.setProperty("--y", `${note.y}%`);
    article.style.setProperty("--r", `${note.r}deg`);
    article.style.setProperty("--i", String(index));

    article.innerHTML = `
      <header class="note-head">
        <span class="note-index" aria-hidden="true"></span>
        <span class="note-kicker"></span>
        <span class="note-controls">
          <button class="note-drag" type="button" aria-label="拖动这枚星屑" title="拖动星屑">
            <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <circle cx="3" cy="3" r="1"/><circle cx="9" cy="3" r="1"/>
              <circle cx="3" cy="6" r="1"/><circle cx="9" cy="6" r="1"/>
              <circle cx="3" cy="9" r="1"/><circle cx="9" cy="9" r="1"/>
            </svg>
          </button>
          <button class="note-delete" type="button" aria-label="删除这枚星屑" title="删除星屑">
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="m3 3 6 6M9 3 3 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
        </span>
      </header>
      <h2 class="note-title" data-editable data-field="title" data-placeholder="给这枚星屑一个名字" data-maxlength="40"></h2>
      <p class="note-body" data-editable data-field="body" data-placeholder="写下此刻的念头…" data-maxlength="260"></p>
      <footer class="note-foot">
        <span class="note-spark" aria-hidden="true">✦</span>
        <span class="note-tag"></span>
      </footer>
    `;

    const title = $(".note-title", article);
    title.id = `note-title-${note.id}`;
    article.setAttribute("aria-labelledby", title.id);
    $(".note-kicker", article).textContent = note.kicker;
    title.textContent = note.title;
    $(".note-body", article).textContent = note.body;
    $(".note-tag", article).textContent = note.tag;

    return article;
  }

  function updateNoteCounts() {
    if (!dom.notes) return;
    const count = dom.notes.querySelectorAll(".note").length;
    $$(".js-note-count").forEach((element) => {
      element.textContent = pad2(count);
    });
    const label = $(".field-label", dom.stage);
    if (label) label.setAttribute("aria-label", `${count} 枚星屑`);
  }

  function renumberNotes() {
    if (!dom.notes) return;
    $$(".note", dom.notes).forEach((note, index) => {
      const number = $(".note-index", note);
      if (number) number.textContent = pad2(index + 1);
      note.dataset.order = String(index);
    });
    updateNoteCounts();
  }

  function syncEditableState() {
    const labels = {
      line1: "主标题第一行",
      line2: "主标题第二行",
      lede: "开场白",
      title: "星屑标题",
      body: "星屑正文",
    };

    $$("[data-editable]").forEach((element) => {
      if (editing) {
        element.setAttribute("contenteditable", "true");
        element.setAttribute("spellcheck", "false");
        element.setAttribute("role", "textbox");
        element.setAttribute("aria-label", labels[element.dataset.field] || "可编辑文字");
        if (element.dataset.field === "body" || element.dataset.field === "lede") {
          element.setAttribute("aria-multiline", "true");
        } else {
          element.removeAttribute("aria-multiline");
        }
      } else {
        if (document.activeElement === element) element.blur();
        element.removeAttribute("contenteditable");
        element.removeAttribute("spellcheck");
        element.removeAttribute("role");
        element.removeAttribute("aria-label");
        element.removeAttribute("aria-multiline");
      }
    });

    $$(".note-controls").forEach((controls) => {
      controls.inert = !editing;
      controls.setAttribute("aria-hidden", String(!editing));
    });
  }

  function setEditing(next, { quiet = false, skipSave = false } = {}) {
    const nextValue = Boolean(next);
    if (nextValue === editing) {
      syncEditableState();
      return;
    }

    editing = nextValue;
    closeExportMenu();
    dom.app.classList.toggle("is-editing", editing);
    document.body.classList.toggle("is-editing", editing);
    dom.editTools.setAttribute("aria-hidden", String(!editing));
    dom.editTools.inert = !editing;
    $$("[data-mode-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(editing));
    });
    $$(".js-mode-label").forEach((label) => {
      label.textContent = editing ? "完成编辑" : "开始改写";
    });
    syncEditableState();
    queueLinks(true);

    if (!editing) {
      if (document.activeElement && document.activeElement.isContentEditable) {
        document.activeElement.blur();
      }
      if (!skipSave) persistNow({ quiet: true });
    }

    if (!quiet) {
      showToast(
        editing ? "画布已解锁 · 想从哪一句开始改？" : "已收好 · 下次打开，它还会在这里",
        { duration: editing ? 2400 : 3200 }
      );
    }

    if (editing) {
      window.setTimeout(() => queueLinks(true), 450);
    }
  }

  /* =========================================================
     State → persistence
     ========================================================= */

  function collectState() {
    const hero = {
      line1: normalizeInlineText(dom.heroLine1 ? dom.heroLine1.innerText : ""),
      line2: normalizeInlineText(dom.heroLine2 ? dom.heroLine2.innerText : ""),
      lede: normalizeBlockText(dom.heroLede ? dom.heroLede.innerText : ""),
    };

    const notes = $$(".note", dom.notes).map((note) => ({
      id: note.dataset.id || uid(),
      kicker: normalizeInlineText($(".note-kicker", note)?.innerText || "FIELD NOTE / 星屑"),
      title: normalizeInlineText($(".note-title", note)?.innerText || ""),
      body: normalizeBlockText($(".note-body", note)?.innerText || ""),
      tag: normalizeInlineText($(".note-tag", note)?.innerText || "A SMALL NOTE"),
      x: clamp(toFiniteNumber(note.dataset.x, 50), 1, 82),
      y: clamp(toFiniteNumber(note.dataset.y, 30), 1, 78),
      r: clamp(toFiniteNumber(note.dataset.r, 0), -8, 8),
      size: note.classList.contains("note--wide") ? "wide" : "regular",
    }));

    return {
      app: "luma",
      version: 1,
      updatedAt: new Date().toISOString(),
      hero,
      notes,
      settings: {
        ...settings,
        customAccent: normalizeHex(settings.customAccent),
      },
    };
  }

  function setSaveState(state, message) {
    if (!dom.saveState) return;
    dom.saveState.dataset.state = state;
    dom.saveState.textContent = message;
  }

  function scheduleSave() {
    setSaveState("saving", "正在保存…");
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => persistNow({ quiet: true }), 550);
  }

  function persistNow({ quiet = false } = {}) {
    window.clearTimeout(saveTimer);
    saveTimer = 0;
    const data = collectState();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorageBroken = false;
      setSaveState("saved", "已自动保存");
    } catch (error) {
      localStorageBroken = true;
      setSaveState("error", "本地存储不可用");
      if (!quiet) showToast("这块浏览器暂时不能保存，但页面仍然可以玩。");
    }
    return data;
  }

  /* =========================================================
     Editing interactions
     ========================================================= */

  function focusEditableEnd(element) {
    if (!element) return;
    element.focus({ preventScroll: true });
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function enforceMaxLength(element) {
    const limit = Number.parseInt(element?.dataset.maxlength || "0", 10);
    if (!limit || !element) return;
    const text = element.innerText || "";
    const characters = Array.from(text);
    if (characters.length <= limit) return;

    element.textContent = characters.slice(0, limit).join("");
    focusEditableEnd(element);
    const now = Date.now();
    if (now - lastLimitToastAt > 2800) {
      lastLimitToastAt = now;
      showToast(`最多 ${limit} 个字符，已经替你轻轻收住啦`, { duration: 2200 });
    }
  }

  function handleEditableInput(event) {
    const element = event.target.closest?.("[data-editable]");
    if (!element || !editing) return;
    enforceMaxLength(element);
    setSaveState("saving", "正在输入…");
    scheduleSave();
    queueLinks();
  }

  function handlePaste(event) {
    const element = event.target.closest?.("[data-editable]");
    if (!element || !editing) return;
    event.preventDefault();
    const clipboard = event.clipboardData || window.clipboardData;
    const text = clipboard ? clipboard.getData("text/plain") : "";
    if (!text) return;

    let inserted = false;
    try {
      inserted = document.execCommand("insertText", false, text);
    } catch (error) {
      inserted = false;
    }

    if (!inserted) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    enforceMaxLength(element);
    scheduleSave();
    queueLinks();
  }

  function handleEditableKeydown(event) {
    const element = event.target.closest?.("[data-editable]");
    if (!element) return;
    if (event.key === "Escape") {
      event.preventDefault();
      element.blur();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      const field = element.dataset.field;
      if (field === "line1" || field === "line2" || field === "title") {
        event.preventDefault();
        element.blur();
      }
    }
  }

  function handleDoubleClick(event) {
    const element = event.target.closest?.("[data-editable]");
    if (!element || editing) return;
    event.preventDefault();
    setEditing(true, { quiet: true });
    window.setTimeout(() => {
      if (element.isConnected) focusEditableEnd(element);
    }, 50);
  }

  /* =========================================================
     Notes: add, delete, drag, reposition
     ========================================================= */

  function currentNoteData(skipElement = null) {
    return $$(".note", dom.notes)
      .filter((note) => note !== skipElement)
      .map((note) => ({
        x: toFiniteNumber(note.dataset.x, 50),
        y: toFiniteNumber(note.dataset.y, 30),
      }));
  }

  function chooseNewSlot(existingNotes) {
    let best = NEW_NOTE_SLOTS[0];
    let bestScore = -Infinity;
    const offsetAll = existingNotes.length;

    NEW_NOTE_SLOTS.forEach((slot, index) => {
      const minimumDistance = existingNotes.length
        ? Math.min(
            ...existingNotes.map((note) =>
              Math.hypot((note.x - slot.x) * 1.45, (note.y - slot.y) * 1.05)
            )
          )
        : 100;
      const score = minimumDistance - ((index + offsetAll) % NEW_NOTE_SLOTS.length) * 0.01;
      if (score > bestScore) {
        bestScore = score;
        best = slot;
      }
    });

    return {
      x: clamp(best.x + rand(-1.8, 1.8), 2, 80),
      y: clamp(best.y + rand(-1.6, 2.2), 2, 72),
      r: best.r + rand(-0.8, 0.8),
    };
  }

  function addNote() {
    if (!editing) setEditing(true, { quiet: true });
    const notes = $$(".note", dom.notes);
    if (notes.length >= MAX_NOTES) {
      showToast("星图已经很满啦，先让一枚星屑离开吧");
      return;
    }

    const slot = chooseNewSlot(
      notes.map((note) => ({
        x: toFiniteNumber(note.dataset.x, 50),
        y: toFiniteNumber(note.dataset.y, 30),
      }))
    );
    const preset = NEW_NOTE_PRESETS[notes.length % NEW_NOTE_PRESETS.length];
    const note = {
      id: uid(),
      kicker: preset.kicker,
      title: "",
      body: "",
      tag: preset.tag,
      x: slot.x,
      y: slot.y,
      r: slot.r,
      size: notes.length % 3 === 1 ? "wide" : "regular",
    };
    const element = createNoteElement(note, notes.length, { isNew: true });
    const newTitle = $(".note-title", element);
    const newBody = $(".note-body", element);
    if (newTitle) newTitle.dataset.placeholder = preset.title;
    if (newBody) newBody.dataset.placeholder = preset.body;
    dom.notes.appendChild(element);
    renumberNotes();
    syncEditableState();
    resetLinkObserver();
    queueLinks(true);
    scheduleSave();

    window.setTimeout(() => {
      const title = $(".note-title", element);
      if (editing && title) focusEditableEnd(title);
      const rectangle = element.getBoundingClientRect();
      starfield?.burst(rectangle.left + 38, rectangle.top + 26, 16);
    }, 80);

    showToast("一枚新的星屑落下来了 · 写下它吧", { duration: 2400 });
  }

  function deleteNote(note) {
    if (!editing || !note || note.classList.contains("is-leaving")) return;
    const parent = note.parentNode;
    const nextSibling = note.nextElementSibling;
    const rectangle = note.getBoundingClientRect();
    starfield?.burst(rectangle.left + rectangle.width / 2, rectangle.top + 30, 14);

    note.classList.add("is-leaving");
    note.setAttribute("aria-hidden", "true");
    note.querySelector(".note-controls")?.setAttribute("inert", "");

    window.setTimeout(() => {
      if (!note.isConnected) return;
      note.remove();
      renumberNotes();
      resetLinkObserver();
      queueLinks(true);
      scheduleSave();
      showToast("一枚星屑飘走了", {
        actionLabel: "撤销",
        duration: 5800,
        onAction: () => {
          if (nextSibling && nextSibling.parentNode === parent) {
            parent.insertBefore(note, nextSibling);
          } else {
            parent.appendChild(note);
          }
          note.classList.remove("is-leaving");
          note.removeAttribute("aria-hidden");
          renumberNotes();
          syncEditableState();
          resetLinkObserver();
          queueLinks(true);
          persistNow({ quiet: true });
          showToast("星屑又回来了", { duration: 1600 });
        },
      });
    }, 280);
  }

  function setNotePosition(note, x, y, r = null) {
    const nextX = clamp(toFiniteNumber(x, 50), 1, 82);
    const nextY = clamp(toFiniteNumber(y, 30), 1, 78);
    note.dataset.x = String(Number(nextX.toFixed(2)));
    note.dataset.y = String(Number(nextY.toFixed(2)));
    note.style.setProperty("--x", `${nextX}%`);
    note.style.setProperty("--y", `${nextY}%`);
    if (r !== null && Number.isFinite(Number(r))) {
      const nextR = clamp(Number(r), -8, 8);
      note.dataset.r = String(Number(nextR.toFixed(2)));
      note.style.setProperty("--r", `${nextR}deg`);
    }
  }

  function shuffleNotes() {
    if (!editing) return;
    const notes = $$(".note", dom.notes);
    if (!notes.length) {
      showToast("先放一枚星屑进来吧");
      return;
    }

    const slots = [...NEW_NOTE_SLOTS]
      .sort(() => Math.random() - 0.5)
      .slice(0, notes.length);

    notes.forEach((note, index) => {
      const slot = slots[index] || {
        x: rand(35, 76),
        y: rand(10, 62),
        r: rand(-3, 3),
      };
      setNotePosition(
        note,
        clamp(slot.x + rand(-1.2, 1.2), 3, 80),
        clamp(slot.y + rand(-1.2, 1.2), 3, 70),
        slot.r + rand(-0.8, 0.8)
      );
    });

    animateConnectionsFor(920);
    scheduleSave();
    starfield?.burst(window.innerWidth * 0.64, window.innerHeight * 0.47, 18);
    showToast("风换了一个方向", { duration: 1700 });
  }

  function tidyNotes() {
    if (!editing) return;
    const notes = $$(".note", dom.notes);
    notes.forEach((note, index) => {
      const slot = NEW_NOTE_SLOTS[index % NEW_NOTE_SLOTS.length];
      setNotePosition(note, slot.x, slot.y, slot.r);
    });
    animateConnectionsFor(920);
    scheduleSave();
    showToast("星屑们回到了自己的轨道", { duration: 1700 });
  }

  function animateConnectionsFor(duration) {
    const started = performance.now();
    const step = () => {
      updateLinks();
      if (performance.now() - started < duration) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function handleNotesClick(event) {
    const deleteButton = event.target.closest(".note-delete");
    if (!deleteButton) return;
    if (!editing) return;
    const note = deleteButton.closest(".note");
    deleteNote(note);
  }

  function handleNotesKeydown(event) {
    const handle = event.target.closest(".note-drag");
    if (!handle || !editing) return;
    const note = handle.closest(".note");
    if (!note) return;
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 4 : 1;
    let x = toFiniteNumber(note.dataset.x, 50);
    let y = toFiniteNumber(note.dataset.y, 30);
    if (event.key === "ArrowLeft") x -= step;
    if (event.key === "ArrowRight") x += step;
    if (event.key === "ArrowUp") y -= step;
    if (event.key === "ArrowDown") y += step;

    const widthPercent = (note.offsetWidth / dom.stage.clientWidth) * 100;
    const heightPercent = (note.offsetHeight / dom.stage.clientHeight) * 100;
    setNotePosition(note, clamp(x, 1, 100 - widthPercent - 1), clamp(y, 1, 100 - heightPercent - 3));
    queueLinks();
    scheduleSave();
  }

  function handleDragStart(event) {
    if (!editing || mobileQuery.matches) return;
    const handle = event.target.closest(".note-drag");
    if (!handle) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const note = handle.closest(".note");
    if (!note) return;

    event.preventDefault();
    const stageRect = dom.stage.getBoundingClientRect();
    if (!stageRect.width || !stageRect.height) return;

    const startPointerX = event.clientX;
    const startPointerY = event.clientY;
    const startX = toFiniteNumber(note.dataset.x, 50);
    const startY = toFiniteNumber(note.dataset.y, 30);
    const widthPercent = (note.offsetWidth / stageRect.width) * 100;
    const heightPercent = (note.offsetHeight / stageRect.height) * 100;

    note.classList.add("is-dragging");
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    const move = (moveEvent) => {
      if (moveEvent.pointerId !== event.pointerId) return;
      const dxPercent = ((moveEvent.clientX - startPointerX) / stageRect.width) * 100;
      const dyPercent = ((moveEvent.clientY - startPointerY) / stageRect.height) * 100;
      setNotePosition(
        note,
        clamp(startX + dxPercent, 1, 100 - widthPercent - 1),
        clamp(startY + dyPercent, 1, 100 - heightPercent - 3)
      );
      queueLinks();
    };

    const cleanup = () => {
      note.classList.remove("is-dragging");
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
      try {
        handle.releasePointerCapture(event.pointerId);
      } catch (error) {
        /* no capture to release */
      }
    };

    const end = (upEvent) => {
      if (upEvent.pointerId !== event.pointerId) return;
      cleanup();
      scheduleSave();
      queueLinks(true);
      starfield?.burst(upEvent.clientX, upEvent.clientY, 15);
    };

    const cancel = (cancelEvent) => {
      if (cancelEvent.pointerId !== event.pointerId) return;
      cleanup();
      scheduleSave();
      queueLinks(true);
    };

    try {
      handle.setPointerCapture(event.pointerId);
    } catch (error) {
      /* window listeners are enough */
    }
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", end, { passive: true });
    window.addEventListener("pointercancel", cancel, { passive: true });
  }

  /* =========================================================
     Orb, light and atmosphere
     ========================================================= */

  function applyTheme({ silent = false, animate = false } = {}) {
    const theme = resolveTheme(settings.theme, settings.customAccent);
    const root = document.documentElement;
    root.style.setProperty("--bg", theme.bg);
    root.style.setProperty("--ink", theme.ink);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-2", theme.accent2);
    root.style.setProperty("--accent-rgb", rgbChannels(theme.accent));
    root.style.setProperty("--accent-2-rgb", rgbChannels(theme.accent2));
    root.style.setProperty("--on-accent", readableOn(theme.accent));
    document.body.dataset.theme = theme.id;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", theme.bg);

    if (dom.customColor) dom.customColor.value = theme.accent;
    if (dom.panelColor) dom.panelColor.value = theme.accent;

    updateThemeUI(theme);
    starfield?.setPalette(theme.accent, theme.accent2, theme.ink);

    if (animate && !silent) flashTheme(theme.accent);
    return theme;
  }

  function updateThemeUI(theme = resolveTheme(settings.theme, settings.customAccent)) {
    $$("[data-theme-choice]").forEach((button) => {
      const active = button.dataset.themeChoice === settings.theme;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const customDot = $(".theme-dot--custom");
    if (customDot) {
      const active = settings.theme === "custom";
      customDot.classList.toggle("is-active", active);
      if (active) {
        customDot.style.background = theme.accent;
        customDot.style.setProperty("--dot", theme.accent);
      } else {
        customDot.style.background = "";
        customDot.style.removeProperty("--dot");
      }
    }

    const customRow = $(".custom-color-row");
    if (customRow) customRow.classList.toggle("is-active", settings.theme === "custom");
  }

  function chooseTheme(themeId, { accent = null, announce = false } = {}) {
    if (themeId === "custom") {
      const nextAccent = normalizeHex(accent) || normalizeHex(settings.customAccent);
      if (!nextAccent) return;
      settings.theme = "custom";
      settings.customAccent = nextAccent;
    } else if (THEME_ORDER.includes(themeId)) {
      settings.theme = themeId;
      if (normalizeHex(settings.customAccent)) {
        settings.customAccent = normalizeHex(settings.customAccent);
      }
    } else {
      return;
    }

    const theme = applyTheme({ animate: true });
    scheduleSave();

    if (announce) {
      showToast(`换成了「${theme.name}」的光`, { duration: 1600 });
    }

    if (starfield) {
      const orbRect = dom.orb?.getBoundingClientRect();
      if (orbRect) {
        starfield.burst(
          orbRect.left + orbRect.width / 2,
          orbRect.top + orbRect.height / 2,
          18
        );
      }
    }
  }

  function cycleTheme() {
    const currentIndex = THEME_ORDER.indexOf(settings.theme);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % THEME_ORDER.length;
    chooseTheme(THEME_ORDER[nextIndex]);
  }

  function flashTheme(accent) {
    if (!dom.themeFlash || reducedMotionQuery.matches) return;
    const flash = dom.themeFlash;
    flash.style.transition = "none";
    flash.style.background = accent;
    flash.style.opacity = "0.075";
    void flash.offsetWidth;
    flash.style.transition = "opacity 850ms cubic-bezier(0.22, 1, 0.36, 1)";
    flash.style.opacity = "0";
  }

  function setMood(index, { silent = false, animate = false } = {}) {
    const normalized = ((Math.round(index) % MOODS.length) + MOODS.length) % MOODS.length;
    settings.mood = normalized;
    const mood = MOODS[normalized];

    if (dom.orb) {
      dom.orb.dataset.mood = String(normalized);
      dom.orb.setAttribute("aria-label", `今日天气：${mood.label}。点击切换心情`);
    }
    if (dom.orbMood) dom.orbMood.textContent = mood.label;
    if (dom.orbSub) dom.orbSub.textContent = mood.sub;
    if (dom.orbNumber) dom.orbNumber.textContent = `${pad2(normalized + 1)} / ${pad2(MOODS.length)}`;
    if (dom.moodStatus) dom.moodStatus.textContent = `今日天气：${mood.label}，${mood.sub}`;

    if (animate) {
      dom.orb?.classList.remove("is-changing");
      void dom.orb?.offsetWidth;
      dom.orb?.classList.add("is-changing");
      window.clearTimeout(moodAnimationTimer);
      moodAnimationTimer = window.setTimeout(() => dom.orb?.classList.remove("is-changing"), 680);

      const rect = dom.orb?.getBoundingClientRect();
      if (rect) {
        starfield?.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 34);
      }
    }

    if (!silent) scheduleSave();
  }

  function cycleMood() {
    setMood((settings.mood + 1) % MOODS.length, { animate: true });
  }

  function applyMotion({ silent = true } = {}) {
    const speed = clamp(toFiniteNumber(settings.motion, 1), 0.2, 2);
    settings.motion = speed;
    const root = document.documentElement;
    root.style.setProperty("--speed", String(speed));
    root.style.setProperty("--orbit-slow", `${(68 / speed).toFixed(1)}s`);
    root.style.setProperty("--orbit-mid", `${(41 / speed).toFixed(1)}s`);
    root.style.setProperty("--orb-spin", `${(18 / speed).toFixed(1)}s`);
    root.style.setProperty("--aurora-a-duration", `${(28 / speed).toFixed(1)}s`);
    root.style.setProperty("--aurora-b-duration", `${(35 / speed).toFixed(1)}s`);
    root.style.setProperty("--aurora-c-duration", `${(42 / speed).toFixed(1)}s`);
    root.style.setProperty(
      "--range-progress",
      `${(((speed - 0.2) / 1.8) * 100).toFixed(1)}%`
    );

    if (dom.motionRange) dom.motionRange.value = String(speed);
    if (dom.motionOutput) dom.motionOutput.textContent = `${speed.toFixed(1)}×`;
    starfield?.setSpeed(speed);

    if (!silent) scheduleSave();
  }

  function applyAtmosphere({ silent = true } = {}) {
    document.body.classList.toggle("no-dust", !settings.dust);
    document.body.classList.toggle("no-grain", !settings.grain);
    document.body.classList.toggle("no-pointer", !settings.pointerLight);
    $$("[data-toggle]").forEach((button) => {
      const key = button.dataset.toggle;
      button.setAttribute("aria-checked", String(Boolean(settings[key])));
    });
    starfield?.setVisible(settings.dust);
    if (!settings.pointerLight && dom.pointerLight) {
      dom.pointerLight.classList.remove("is-visible");
    }
    if (!silent) scheduleSave();
  }

  /* =========================================================
     Connection lines
     ========================================================= */

  function setupLinkObservers() {
    window.addEventListener("resize", debounce(() => queueLinks(true), 140), { passive: true });
    if ("ResizeObserver" in window) {
      linkObserver = new ResizeObserver(() => queueLinks());
      resetLinkObserver();
    }
  }

  function resetLinkObserver() {
    if (!linkObserver) return;
    linkObserver.disconnect();
    if (dom.stage) linkObserver.observe(dom.stage);
    $$(".note", dom.notes).forEach((note) => linkObserver.observe(note));
  }

  function queueLinks(force = false) {
    if (force && linksRaf) {
      cancelAnimationFrame(linksRaf);
      linksRaf = 0;
    }
    if (linksRaf) return;
    linksRaf = requestAnimationFrame(() => {
      linksRaf = 0;
      updateLinks();
    });
  }

  function cardEdgePoint(centerX, centerY, width, height, targetX, targetY) {
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
      return { x: centerX, y: centerY - height / 2 };
    }
    const scale = Math.min(
      (width / 2) / Math.max(0.001, Math.abs(dx)),
      (height / 2) / Math.max(0.001, Math.abs(dy))
    );
    return { x: centerX + dx * scale, y: centerY + dy * scale };
  }

  function updateLinks() {
    if (!dom.connections || !dom.orb || !dom.notes) return;
    if (mobileQuery.matches) {
      dom.connections.replaceChildren();
      dom.connections.removeAttribute("viewBox");
      return;
    }

    const stageRect = dom.stage.getBoundingClientRect();
    const orbRect = dom.orb.getBoundingClientRect();
    const width = stageRect.width;
    const height = stageRect.height;
    if (width < 2 || height < 2) return;

    const orbX = orbRect.left + orbRect.width / 2 - stageRect.left;
    const orbY = orbRect.top + orbRect.height / 2 - stageRect.top;
    const notes = $$(".note", dom.notes);
    const fragment = document.createDocumentFragment();

    dom.connections.setAttribute("viewBox", `0 0 ${width.toFixed(2)} ${height.toFixed(2)}`);

    notes.forEach((note, index) => {
      const noteRect = note.getBoundingClientRect();
      const centerX = noteRect.left + noteRect.width / 2 - stageRect.left;
      const centerY = noteRect.top + noteRect.height / 2 - stageRect.top;
      const edge = cardEdgePoint(
        centerX,
        centerY,
        note.offsetWidth,
        note.offsetHeight,
        orbX,
        orbY
      );

      const dx = edge.x - orbX;
      const dy = edge.y - orbY;
      const bend = (index % 2 === 0 ? 1 : -1) * 0.12;
      const control1X = orbX + dx * 0.34 - dy * bend;
      const control1Y = orbY + dy * 0.34 + dx * bend;
      const control2X = orbX + dx * 0.78 - dy * bend * 0.45;
      const control2Y = orbY + dy * 0.78 + dx * bend * 0.45;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", `connection-path${index % 2 ? " connection-path--alt" : ""}`);
      path.setAttribute(
        "d",
        `M ${orbX.toFixed(2)} ${orbY.toFixed(2)} C ${control1X.toFixed(2)} ${control1Y.toFixed(
          2
        )}, ${control2X.toFixed(2)} ${control2Y.toFixed(2)}, ${edge.x.toFixed(2)} ${edge.y.toFixed(2)}`
      );
      path.style.animationDelay = `${index * -3.2}s`;
      fragment.appendChild(path);

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("class", `connection-dot${index % 2 ? " connection-dot--alt" : ""}`);
      dot.setAttribute("cx", edge.x.toFixed(2));
      dot.setAttribute("cy", edge.y.toFixed(2));
      dot.setAttribute("r", "2");
      fragment.appendChild(dot);
    });

    dom.connections.replaceChildren(fragment);
  }

  /* =========================================================
     Overlays: popover, settings, guide, toast
     ========================================================= */

  function openSettings() {
    if (panelOpen) return;
    closeExportMenu();
    panelOpen = true;
    panelReturnFocus = document.activeElement;
    dom.panelScrim.classList.add("is-open");
    dom.settingsPanel.classList.add("is-open");
    dom.settingsPanel.setAttribute("aria-hidden", "false");
    dom.settingsBtn.setAttribute("aria-expanded", "true");
    dom.app.inert = true;
    document.body.classList.add("panel-open");
    window.setTimeout(() => dom.settingsClose?.focus(), 100);
  }

  function closeSettings({ restoreFocus = true } = {}) {
    if (!panelOpen) return;
    panelOpen = false;
    dom.panelScrim.classList.remove("is-open");
    dom.settingsPanel.classList.remove("is-open");
    dom.settingsPanel.setAttribute("aria-hidden", "true");
    dom.settingsBtn.setAttribute("aria-expanded", "false");
    dom.app.inert = false;
    document.body.classList.remove("panel-open");
    if (restoreFocus && panelReturnFocus && typeof panelReturnFocus.focus === "function") {
      const target = panelReturnFocus;
      panelReturnFocus = null;
      window.setTimeout(() => target.focus(), 80);
    } else {
      panelReturnFocus = null;
    }
  }

  function toggleExportMenu(force) {
    if (!dom.exportMenu) return;
    const shouldOpen = typeof force === "boolean" ? force : dom.exportMenu.hidden;
    if (shouldOpen) {
      closeSettings({ restoreFocus: false });
      dom.exportMenu.hidden = false;
      dom.exportBtn.setAttribute("aria-expanded", "true");
    } else {
      dom.exportMenu.hidden = true;
      dom.exportBtn.setAttribute("aria-expanded", "false");
    }
  }

  function closeExportMenu() {
    if (!dom.exportMenu || dom.exportMenu.hidden) return;
    dom.exportMenu.hidden = true;
    dom.exportBtn.setAttribute("aria-expanded", "false");
  }

  function openGuide() {
    if (!dom.guideDialog || dom.guideDialog.open) return;
    closeExportMenu();
    if (panelOpen) closeSettings({ restoreFocus: false });
    document.body.classList.add("dialog-open");
    dom.guideDialog.showModal();
  }

  function closeGuide() {
    if (dom.guideDialog && dom.guideDialog.open) dom.guideDialog.close();
  }

  function showToast(
    message,
    { actionLabel = "", onAction = null, duration = 3000 } = {}
  ) {
    if (!dom.toast) return;
    window.clearTimeout(toastTimer);
    dom.toastText.textContent = message;
    dom.toastText.title = message;
    toastActionHandler = typeof onAction === "function" ? onAction : null;

    if (actionLabel && toastActionHandler) {
      dom.toastAction.textContent = actionLabel;
      dom.toastAction.hidden = false;
    } else {
      dom.toastAction.hidden = true;
    }

    dom.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(hideToast, duration);
  }

  function hideToast() {
    if (!dom.toast) return;
    window.clearTimeout(toastTimer);
    dom.toast.classList.remove("is-visible");
    dom.toastAction.hidden = true;
    toastActionHandler = null;
  }

  /* =========================================================
     Global input / keyboard / pointer
     ========================================================= */

  function handleGlobalKeydown(event) {
    if (!hasBoundEvents) return;

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      const data = persistNow({ quiet: true });
      showToast(
        data.notes.length
          ? "作品已保存在本机 · 也可以从「下载」带走一份"
          : "作品已保存在本机",
        { duration: 2600 }
      );
      return;
    }

    if (event.key === "Escape") {
      if (dom.guideDialog?.open) return;
      if (panelOpen) {
        event.preventDefault();
        closeSettings();
        return;
      }
      if (!dom.exportMenu.hidden) {
        event.preventDefault();
        closeExportMenu();
        return;
      }
      const active = document.activeElement;
      if (active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))) {
        active.blur();
        return;
      }
      return;
    }

    if (dom.guideDialog?.open || panelOpen) return;

    const active = document.activeElement;
    if (active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;

    if (event.key.toLowerCase() === "e") {
      event.preventDefault();
      setEditing(!editing);
      return;
    }

    if (event.key.toLowerCase() === "t") {
      event.preventDefault();
      cycleTheme();
      return;
    }

    if (event.key === "?") {
      event.preventDefault();
      openGuide();
    }
  }

  function updateClock() {
    const now = new Date();
    try {
      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(now);
      if (dom.clock) dom.clock.textContent = time;

      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Shanghai",
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).formatToParts(now);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      if (dom.topDate) {
        dom.topDate.textContent = `${(values.month || "").toUpperCase()} ${values.day || ""} / ${
          values.year || ""
        }`;
      }
    } catch (error) {
      if (dom.clock) dom.clock.textContent = now.toTimeString().slice(0, 8);
    }
  }

  function handlePointerMove(event) {
    starfield?.setPointer(event.clientX, event.clientY, true);
    lastPointer = { x: event.clientX, y: event.clientY };

    if (!settings.pointerLight || !finePointerQuery.matches) return;
    if (!pointerRaf) {
      pointerRaf = requestAnimationFrame(() => {
        pointerRaf = 0;
        if (!dom.pointerLight) return;
        dom.pointerLight.style.transform = `translate3d(${lastPointer.x - 280}px, ${
          lastPointer.y - 280
        }px, 0)`;
        dom.pointerLight.classList.add("is-visible");
      });
    }
  }

  function handlePointerLeave() {
    starfield?.setPointer(0, 0, false);
    dom.pointerLight?.classList.remove("is-visible");
  }

  /* =========================================================
     Theme buttons, toggles and panel controls
     ========================================================= */

  function handleThemeButtonClick(event) {
    const button = event.target.closest("[data-theme-choice]");
    if (!button) return;
    const themeId = button.dataset.themeChoice;
    if (!THEME_ORDER.includes(themeId)) return;
    chooseTheme(themeId);
  }

  function handleCustomColorInput(event) {
    const accent = normalizeHex(event.target.value);
    if (!accent) return;
    chooseTheme("custom", { accent });
  }

  function handleMotionInput(event) {
    settings.motion = clamp(toFiniteNumber(event.target.value, 1), 0.2, 2);
    applyMotion({ silent: false });
  }

  function handleToggleClick(event) {
    const button = event.target.closest("[data-toggle]");
    if (!button) return;
    const key = button.dataset.toggle;
    if (!["dust", "grain", "pointerLight"].includes(key)) return;
    settings[key] = !settings[key];
    applyAtmosphere({ silent: false });
  }

  function armResetButton() {
    if (!resetArmed) {
      resetArmed = true;
      dom.resetButton.classList.add("is-armed");
      const label = $(".reset-label", dom.resetButton);
      if (label) label.textContent = "再点一次确认";
      window.clearTimeout(resetArmedTimer);
      resetArmedTimer = window.setTimeout(disarmResetButton, 4200);
      showToast("再点一次「确认恢复」，画布会回到最初的样子", { duration: 3800 });
      return;
    }
    disarmResetButton();
    resetCanvas();
  }

  function disarmResetButton() {
    resetArmed = false;
    window.clearTimeout(resetArmedTimer);
    dom.resetButton?.classList.remove("is-armed");
    const label = $(".reset-label", dom.resetButton);
    if (label) label.textContent = "恢复初始";
  }

  function resetCanvas() {
    hideToast();
    closeSettings({ restoreFocus: false });
    persistNow({ quiet: true }); // settle any pending edit before the reset
    applyData(makeDefaultData(), { persist: true });
    setEditing(false, { quiet: true, skipSave: true });
    const centerX = window.innerWidth * 0.64;
    const centerY = window.innerHeight * 0.47;
    starfield?.burst(centerX, centerY, 42);
    showToast("画布回到了最初的样子", { duration: 2600 });
    queueLinks(true);
  }

  /* =========================================================
     Import / export
     ========================================================= */

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function exportJSON() {
    const data = persistNow({ quiet: true });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    downloadBlob(blob, `luma-canvas-${fileTimestamp()}.json`);
    showToast("作品源文件已保存 · 随时可以再带回来", { duration: 3000 });
  }

  async function exportPoster() {
    if (posterBusy) return;
    posterBusy = true;
    showToast("正在把这一刻装进海报…", { duration: 1500 });
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      const data = collectState();
      const canvas = drawPoster(data);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("The poster could not be encoded."));
        }, "image/png");
      });
      downloadBlob(blob, `luma-poster-${fileTimestamp()}.png`);
      showToast("海报已下载 · 它现在可以离开这座岛了", { duration: 3300 });
    } catch (error) {
      console.error("LUMA: poster export failed.", error);
      showToast("海报没能画出来，再试一次？", { duration: 3000 });
    } finally {
      posterBusy = false;
    }
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawTrackedText(ctx, text, x, y, tracking, align = "left") {
    const previousAlign = ctx.textAlign;
    ctx.textAlign = "left";
    const characters = Array.from(String(text));
    const widths = characters.map((character) => ctx.measureText(character).width);
    const total = widths.reduce((sum, value) => sum + value, 0) + tracking * Math.max(0, characters.length - 1);
    let cursor = align === "right" ? x - total : align === "center" ? x - total / 2 : x;
    characters.forEach((character, index) => {
      ctx.fillText(character, cursor, y);
      cursor += widths[index] + tracking;
    });
    ctx.textAlign = previousAlign;
    return total;
  }

  const CANVAS_CLOSING_PUNCTUATION = new Set(Array.from("，。！？；：、）］｝》」』】…—,.!?;:%)]}"));
  const CANVAS_OPENING_PUNCTUATION = new Set(Array.from("（［｛《「『【([{"));

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
    const source = String(text || "");
    const paragraphs = source.split("\n");
    const lines = [];

    for (const paragraph of paragraphs) {
      if (paragraph.length === 0) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const character of Array.from(paragraph)) {
        const candidate = line + character;
        if (line && ctx.measureText(candidate).width > maxWidth) {
          if (CANVAS_CLOSING_PUNCTUATION.has(character)) {
            // Keep Chinese closing punctuation with the line it belongs to.
            lines.push((line + character).trimEnd());
            line = "";
          } else if (CANVAS_OPENING_PUNCTUATION.has(line[line.length - 1])) {
            // Never strand an opening bracket at the end of a line.
            const carry = line[line.length - 1];
            lines.push(line.slice(0, -1).trimEnd());
            line = carry + character;
          } else {
            lines.push(line.trimEnd());
            line = character;
          }
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line.trimEnd());
    }

    if (!lines.length) return 0;
    let visible = lines;
    if (lines.length > maxLines) {
      visible = lines.slice(0, maxLines);
      let last = visible[visible.length - 1];
      while (last.length && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      visible[visible.length - 1] = `${last}…`;
    }

    visible.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });
    return visible.length;
  }

  function fitTitle(ctx, title1, title2, maxWidth, initial = 134, minimum = 56) {
    let size = initial;
    while (size > minimum) {
      ctx.font = `600 ${size}px ${CANVAS_SANS}`;
      const width1 = ctx.measureText(title1).width;
      ctx.font = `italic 400 ${size * 1.015}px ${CANVAS_SERIF}`;
      const width2 = ctx.measureText(title2).width;
      if (Math.max(width1, width2) <= maxWidth) break;
      size -= 3;
    }
    return size;
  }

  function drawPoster(data) {
    const theme = resolveTheme(data.settings.theme, data.settings.customAccent);
    const accent = theme.accent;
    const accent2 = theme.accent2;
    const bg = theme.bg;
    const ink = theme.ink;
    const notes = data.notes;
    const W = 1600;
    const PAD = 108;
    const cardGap = 26;
    const noteColumns = notes.length === 4 ? 2 : 3;
    const cardWidth = (W - PAD * 2 - cardGap * (noteColumns - 1)) / noteColumns;
    const cardHeight = 252;
    const cardsTop = 824;
    const noteRows = Math.ceil(notes.length / noteColumns);
    const H = notes.length ? cardsTop + noteRows * (cardHeight + 28) + 152 : 990;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable.");

    const title1 = (normalizeInlineText(data.hero.line1) || "把灵感，").replace(/\s+/g, " ");
    const title2 = (normalizeInlineText(data.hero.line2) || "揉进夜色。").replace(/\s+/g, " ");
    const lede =
      normalizeBlockText(data.hero.lede) ||
      "这不是一张看完就走的页面。改一句话，拖动一枚星屑，换一束光。";

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const upperGlow = ctx.createRadialGradient(W * 0.76, 110, 0, W * 0.76, 110, W * 0.72);
    upperGlow.addColorStop(0, rgba(accent, 0.12));
    upperGlow.addColorStop(0.4, rgba(accent, 0.035));
    upperGlow.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = upperGlow;
    ctx.fillRect(0, 0, W, H);

    const lowerGlow = ctx.createRadialGradient(120, H - 120, 0, 120, H - 120, 620);
    lowerGlow.addColorStop(0, rgba(accent2, 0.08));
    lowerGlow.addColorStop(1, rgba(accent2, 0));
    ctx.fillStyle = lowerGlow;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.save();
    ctx.strokeStyle = rgba(ink, 0.045);
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();

    // Deterministic stardust.
    const random = mulberry32(102114);
    ctx.globalCompositeOperation = "screen";
    for (let index = 0; index < 190; index += 1) {
      const x = random() * W;
      const y = random() * H;
      const radius = random() * 1.5 + 0.3;
      const color = random() > 0.72 ? accent : ink;
      const alpha = 0.08 + random() * 0.38;
      ctx.fillStyle = rgba(color, alpha);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    // Fine top rule and brand mark.
    ctx.strokeStyle = rgba(ink, 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, 150.5);
    ctx.lineTo(W - PAD, 150.5);
    ctx.stroke();

    ctx.save();
    ctx.translate(PAD + 17, 91);
    ctx.strokeStyle = rgba(ink, 0.46);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 7, -Math.PI / 6, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 0, 4.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15.5, -7.2, 1.7, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = ink;
    ctx.font = `600 24px ${CANVAS_SANS}`;
    ctx.fillText("光屿", PAD + 48, 99);
    ctx.fillStyle = rgba(ink, 0.4);
    ctx.font = `10px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "LUMA · MICRO UNIVERSE", PAD + 109, 98, 1.7);

    ctx.fillStyle = rgba(ink, 0.38);
    ctx.font = `10px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "AN EDITABLE MICRO-UNIVERSE", W - PAD, 92, 1.8, "right");
    ctx.fillStyle = rgba(ink, 0.26);
    ctx.font = `9px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "PRINTED FROM A SMALL LIVING CANVAS", W - PAD, 111, 1.2, "right");

    // Eyebrow.
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(PAD, 211);
    ctx.lineTo(PAD + 34, 211);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgba(ink, 0.55);
    ctx.font = `10px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "A SMALL UNIVERSE, BUILT BY YOU", PAD + 49, 214, 2);
    ctx.fillStyle = rgba(ink, 0.27);
    ctx.font = `10px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "一块会长大的画布", PAD + 408, 214, 1.3);

    // Title.
    const titleSize = fitTitle(ctx, title1, title2, 735);
    ctx.fillStyle = ink;
    ctx.font = `600 ${titleSize}px ${CANVAS_SANS}`;
    const title1Display = truncateCanvasText(ctx, title1, 735);
    ctx.fillText(title1Display, PAD, 346);
    const titleWidth = ctx.measureText(title1Display).width;
    ctx.fillStyle = accent2;
    ctx.font = `400 ${Math.max(18, titleSize * 0.18)}px ${CANVAS_SANS}`;
    ctx.fillText("✦", PAD + titleWidth + 18, 346 - titleSize * 0.7);

    ctx.fillStyle = accent;
    ctx.font = `italic 400 ${titleSize * 1.015}px ${CANVAS_SERIF}`;
    const title2Display = truncateCanvasText(ctx, title2, 710);
    ctx.fillText(title2Display, PAD + titleSize * 0.2, 346 + titleSize * 1.03);

    // Lede.
    ctx.fillStyle = rgba(ink, 0.62);
    ctx.font = `400 19px ${CANVAS_SANS}`;
    const ledeLines = drawWrappedText(ctx, lede, PAD, 573, 620, 34, 4);

    const microY = 573 + Math.max(1, ledeLines) * 34 + 34;
    ctx.strokeStyle = rgba(accent, 0.55);
    ctx.beginPath();
    ctx.moveTo(PAD, microY - 5.5);
    ctx.lineTo(PAD + 27, microY - 5.5);
    ctx.stroke();
    ctx.fillStyle = rgba(ink, 0.42);
    ctx.font = `9px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "DRAG · TYPE · MAKE IT YOURS", PAD + 41, microY - 2, 1.5);

    // Orb.
    drawPosterOrb(ctx, 1228, 380, 231, accent, accent2, ink, MOODS[data.settings.mood].label);

    // Notes divider.
    const notesHeadingY = notes.length ? cardsTop - 62 : 748;
    ctx.strokeStyle = rgba(ink, 0.13);
    ctx.beginPath();
    ctx.moveTo(PAD, notesHeadingY);
    ctx.lineTo(W - PAD, notesHeadingY);
    ctx.stroke();
    ctx.fillStyle = rgba(ink, 0.45);
    ctx.font = `10px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "FIELD NOTES / 灵感星屑", PAD, notesHeadingY + 30, 1.7);
    ctx.fillStyle = accent;
    ctx.font = `10px ${CANVAS_MONO}`;
    drawTrackedText(ctx, pad2(notes.length), W - PAD, notesHeadingY + 30, 1.5, "right");

    // Note cards.
    notes.forEach((note, index) => {
      const column = index % noteColumns;
      const row = Math.floor(index / noteColumns);
      const x = PAD + column * (cardWidth + cardGap);
      const y = cardsTop + row * (cardHeight + 28);
      drawPosterNote(ctx, {
        note,
        index,
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        accent,
        accent2,
        ink,
      });
    });

    if (!notes.length) {
      ctx.fillStyle = rgba(ink, 0.35);
      ctx.font = `15px ${CANVAS_SANS}`;
      ctx.fillText("星图上还没有星屑。打开画布，放一枚进来吧。", PAD, notesHeadingY + 83);
    }

    // Footer.
    const footerY = H - 62;
    ctx.strokeStyle = rgba(ink, 0.1);
    ctx.beginPath();
    ctx.moveTo(PAD, footerY - 28);
    ctx.lineTo(W - PAD, footerY - 28);
    ctx.stroke();
    ctx.fillStyle = rgba(ink, 0.3);
    ctx.font = `9px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "光屿 / LUMA", PAD, footerY, 1.5);
    drawTrackedText(ctx, "A THOUGHT CAN HAVE A PLACE TO STAY", W / 2 - 145, footerY, 1.3);
    drawTrackedText(
      ctx,
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
      W - PAD,
      footerY,
      1.2,
      "right"
    );

    // A whisper of paper grain.
    const paperRandom = mulberry32(4081);
    ctx.globalCompositeOperation = "soft-light";
    for (let index = 0; index < 1600; index += 1) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.015 + paperRandom() * 0.028})`;
      ctx.fillRect(paperRandom() * W, paperRandom() * H, 1, 1);
    }
    ctx.globalCompositeOperation = "source-over";

    return canvas;
  }

  function drawPosterOrb(ctx, cx, cy, radius, accent, accent2, ink, moodLabel) {
    ctx.save();

    const halo = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.7);
    halo.addColorStop(0, rgba(accent, 0.16));
    halo.addColorStop(0.5, rgba(accent, 0.04));
    halo.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.7, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(ink, 0.13);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 36, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([2, 9]);
    ctx.strokeStyle = rgba(ink, 0.16);
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 66, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.42);
    ctx.strokeStyle = rgba(accent2, 0.22);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius + 76, (radius + 76) * 0.34, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = accent2;
    ctx.beginPath();
    ctx.arc(radius + 72, 0, 3.4, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.clip();

    const base = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.35, 2, cx, cy, radius);
    base.addColorStop(0, "rgba(255,255,255,0.19)");
    base.addColorStop(0.28, "rgba(28,35,28,0.42)");
    base.addColorStop(0.7, "rgba(7,11,8,0.95)");
    base.addColorStop(1, "#080b09");
    ctx.fillStyle = base;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    const cloudA = ctx.createRadialGradient(
      cx + radius * 0.12,
      cy + radius * 0.25,
      0,
      cx + radius * 0.12,
      cy + radius * 0.25,
      radius * 0.95
    );
    cloudA.addColorStop(0, rgba(accent, 0.74));
    cloudA.addColorStop(0.42, rgba(accent, 0.18));
    cloudA.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = cloudA;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    const cloudB = ctx.createRadialGradient(
      cx - radius * 0.45,
      cy - radius * 0.32,
      0,
      cx - radius * 0.45,
      cy - radius * 0.32,
      radius * 0.7
    );
    cloudB.addColorStop(0, rgba(accent2, 0.32));
    cloudB.addColorStop(1, rgba(accent2, 0));
    ctx.fillStyle = cloudB;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    const sheen = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    sheen.addColorStop(0, "rgba(255,255,255,0.15)");
    sheen.addColorStop(0.38, "rgba(255,255,255,0)");
    sheen.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = sheen;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    ctx.restore();

    ctx.strokeStyle = rgba(accent, 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.11)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 10, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = rgba(ink, 0.5);
    ctx.font = `9px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "TODAY'S WEATHER", cx, cy - 38, 1.7, "center");

    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.font = `400 68px ${CANVAS_SERIF}`;
    ctx.fillText(moodLabel, cx, cy + 37);
    ctx.textAlign = "left";
    ctx.fillStyle = rgba(ink, 0.46);
    ctx.font = `8.5px ${CANVAS_MONO}`;
    drawTrackedText(ctx, "A SMALL WEATHER REPORT", cx, cy + 72, 1.2, "center");

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(-0.7) * (radius + 36), cy + Math.sin(-0.7) * (radius + 36), 2.7, 0, TAU);
    ctx.fill();
  }

  function drawPosterNote(ctx, { note, index, x, y, width, height, accent, accent2, ink }) {
    ctx.save();

    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 18;
    roundedRect(ctx, x, y, width, height, 17);
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = rgba(ink, 0.12);
    ctx.lineWidth = 1;
    roundedRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, 17);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = `9px ${CANVAS_MONO}`;
    ctx.fillText(pad2(index + 1), x + 21, y + 31);

    ctx.fillStyle = rgba(ink, 0.32);
    ctx.font = `7px ${CANVAS_MONO}`;
    const kicker = truncateCanvasText(ctx, note.kicker, width - 92);
    drawTrackedText(ctx, kicker, x + 47, y + 31, 1.1);

    ctx.strokeStyle = rgba(ink, 0.08);
    ctx.beginPath();
    ctx.moveTo(x + 21, y + 46);
    ctx.lineTo(x + width - 21, y + 46);
    ctx.stroke();

    const title = (note.title || "一枚未命名的星屑").replace(/\s+/g, " ");
    ctx.fillStyle = ink;
    ctx.font = `600 23px ${CANVAS_SANS}`;
    const titleLines = drawWrappedText(ctx, title, x + 21, y + 78, width - 42, 31, 2);

    const bodyTop = y + 78 + titleLines * 31 + 11;
    ctx.fillStyle = rgba(ink, 0.55);
    ctx.font = `14px ${CANVAS_SANS}`;
    const body = note.body || "这一枚星屑还没有写字。";
    const bodyLines = drawWrappedText(ctx, body, x + 21, bodyTop, width - 42, 24, 3);

    const footerY = y + height - 27;
    ctx.strokeStyle = rgba(ink, 0.08);
    ctx.beginPath();
    ctx.moveTo(x + 21, footerY - 24);
    ctx.lineTo(x + width - 21, footerY - 24);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = `10px ${CANVAS_SANS}`;
    ctx.fillText("✦", x + 21, footerY);
    ctx.fillStyle = rgba(ink, 0.32);
    ctx.font = `7px ${CANVAS_MONO}`;
    drawTrackedText(ctx, truncateCanvasText(ctx, note.tag, width - 70), x + 36, footerY, 1.1);

    // A small orbital echo in the lower-right corner.
    ctx.strokeStyle = rgba(accent2, 0.15);
    ctx.beginPath();
    ctx.arc(x + width - 27, y + 27, 20, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = rgba(accent2, 0.55);
    ctx.beginPath();
    ctx.arc(x + width - 27 + 20 * Math.cos(-0.4), y + 27 + 20 * Math.sin(-0.4), 1.9, 0, TAU);
    ctx.fill();

    ctx.restore();
    return { titleLines, bodyLines };
  }

  function truncateCanvasText(ctx, value, maxWidth) {
    const text = String(value || "");
    if (ctx.measureText(text).width <= maxWidth) return text;
    let cut = text;
    while (cut.length && ctx.measureText(`${cut}…`).width > maxWidth) {
      cut = cut.slice(0, -1);
    }
    return `${cut}…`;
  }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function openFilePicker() {
    if (!dom.fileInput) return;
    dom.fileInput.value = "";
    dom.fileInput.click();
  }

  async function handleFileInput(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("That file is too large.");
      const text = await file.text();
      const raw = JSON.parse(text);
      if (raw?.app !== "luma" || !Array.isArray(raw.notes)) {
        throw new Error("This is not a LUMA canvas file.");
      }
      const data = sanitizeData(raw);
      if (!data) throw new Error("The canvas could not be restored.");

      hideToast();
      closeSettings({ restoreFocus: false });
      applyData(data, { persist: true });
      setEditing(false, { quiet: true, skipSave: true });
      queueLinks(true);
      const centerX = window.innerWidth * (mobileQuery.matches ? 0.5 : 0.64);
      const centerY = window.innerHeight * 0.47;
      starfield?.burst(centerX, centerY, 36);
      showToast("你的星图已经回到画布上", { duration: 3000 });
    } catch (error) {
      console.warn("LUMA: import failed.", error);
      showToast("这份文件没能回到星图上，请选择 LUMA 保存的 JSON", { duration: 3600 });
    } finally {
      event.target.value = "";
    }
  }

  /* =========================================================
     Event wiring
     ========================================================= */

  function bindEvents() {
    if (hasBoundEvents) return;
    hasBoundEvents = true;

    $$("[data-mode-toggle]").forEach((button) => {
      button.addEventListener("click", () => setEditing(!editing));
    });

    dom.themeShuffle?.addEventListener("click", () => {
      cycleTheme();
      const rect = dom.orb?.getBoundingClientRect();
      if (rect) {
        starfield?.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 24);
      }
      showToast("换了一阵新的光", { duration: 1500 });
    });

    dom.orb?.addEventListener("click", cycleMood);

    dom.guideBtn?.addEventListener("click", openGuide);
    dom.guideClose?.addEventListener("click", closeGuide);
    dom.guideStart?.addEventListener("click", () => {
      closeGuide();
      setEditing(true);
    });
    dom.guideDialog?.addEventListener("click", (event) => {
      if (event.target === dom.guideDialog) closeGuide();
    });
    dom.guideDialog?.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
    });

    dom.settingsBtn?.addEventListener("click", openSettings);
    dom.settingsClose?.addEventListener("click", () => closeSettings());
    dom.panelScrim?.addEventListener("click", () => closeSettings());

    dom.exportBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleExportMenu();
    });
    dom.exportMenu?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-export]");
      if (!button) return;
      const action = button.dataset.export;
      closeExportMenu();
      if (action === "png") exportPoster();
      if (action === "json") exportJSON();
      if (action === "import") openFilePicker();
    });

    document.addEventListener("pointerdown", (event) => {
      if (!dom.exportMenu || dom.exportMenu.hidden) return;
      if (!event.target.closest(".export-wrap")) closeExportMenu();
    }, true);

    document.addEventListener("click", handleThemeButtonClick);
    [dom.customColor, dom.panelColor].forEach((input) => {
      input?.addEventListener("input", handleCustomColorInput);
    });

    dom.motionRange?.addEventListener("input", handleMotionInput);
    $$("[data-toggle]").forEach((button) => {
      button.addEventListener("click", handleToggleClick);
    });

    dom.panelExportPng?.addEventListener("click", () => {
      closeSettings({ restoreFocus: false });
      exportPoster();
    });
    dom.panelExportJson?.addEventListener("click", () => {
      closeSettings({ restoreFocus: false });
      exportJSON();
    });
    dom.panelImport?.addEventListener("click", () => {
      closeSettings({ restoreFocus: false });
      openFilePicker();
    });
    dom.resetButton?.addEventListener("click", armResetButton);
    dom.fileInput?.addEventListener("change", handleFileInput);

    $$("[data-edit-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.editAction;
        if (action === "add") addNote();
        if (action === "shuffle") shuffleNotes();
        if (action === "tidy") tidyNotes();
      });
    });

    dom.notes?.addEventListener("click", handleNotesClick);
    dom.notes?.addEventListener("pointerdown", handleDragStart);
    dom.notes?.addEventListener("keydown", handleNotesKeydown);

    document.addEventListener("input", handleEditableInput);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleEditableKeydown, true);
    document.addEventListener("dblclick", handleDoubleClick);

    dom.stage?.addEventListener("dblclick", (event) => {
      if (event.target.closest(".note, button, a, input, label, [data-editable]")) return;
      starfield?.burst(event.clientX, event.clientY, 18);
    });

    dom.toastAction?.addEventListener("click", () => {
      const action = toastActionHandler;
      hideToast();
      if (action) action();
    });

    document.addEventListener("keydown", handleGlobalKeydown);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    document.documentElement.addEventListener("mouseleave", handlePointerLeave);

    window.addEventListener("resize", () => {
      if (mobileQuery.matches) queueLinks(true);
    }, { passive: true });

    window.addEventListener("beforeunload", () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState()));
      } catch (error) {
        /* local storage can be unavailable on file:// in some browsers */
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && !localStorageBroken) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState()));
        } catch (error) {
          /* ignore */
        }
      }
    });

    window.matchMedia?.("(pointer: fine)").addEventListener?.("change", () => {
      if (!finePointerQuery.matches) dom.pointerLight?.classList.remove("is-visible");
    });

    // Ensure basic state UI is in sync even if a browser restored a form control.
    applyAtmosphere({ silent: true });
  }

  /* =========================================================
     Start
     ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
