// Draws a campaign / nomination poster onto a canvas and returns a PNG data URL.
// The text is written onto the image itself, so the same picture shows on the
// site and can be downloaded and shared on WhatsApp.

export type PosterData = {
  photo?: string;      // data URL or same-origin URL
  name: string;
  band: string;        // e.g. "VOTE" or "NOMINATED"
  role: string;        // e.g. "for Chairman" / "Best Online"
  slogan?: string;
  footer: string;      // e.g. "2026 Executive Elections"
  badge?: string;      // e.g. "CANDIDATE", "ASPIRANT", "WINNER"
};

const W = 1080;
const H = 1350;
const GREEN = '#0f3d22';
const GREEN_DEEP = '#082715';
const GOLD = '#d9a520';
const CREAM = '#f5efdd';
const DISPLAY = '"League Spartan", "Figtree", Arial, sans-serif';
const TEXT = '"Figtree", Arial, sans-serif';

const cache = new Map<string, Promise<string>>();

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// The crest's shield, matching the CSS clip path used across the site
function shieldPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h * 0.56);
  ctx.bezierCurveTo(x + w, y + h * 0.79, x + w * 0.76, y + h * 0.92, x + w * 0.5, y + h);
  ctx.bezierCurveTo(x + w * 0.24, y + h * 0.92, x, y + h * 0.79, x, y + h * 0.56);
  ctx.closePath();
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, weight: number, max: number, min: number, width: number) {
  let size = max;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > min && ctx.measureText(text).width > width) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > width && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lines;
}

function stripe(ctx: CanvasRenderingContext2D, y: number, h: number) {
  for (let x = 0, i = 0; x < W; x += 54, i++) {
    ctx.fillStyle = i % 2 ? GOLD : GREEN_DEEP;
    ctx.fillRect(x, y, 54, h);
  }
}

async function draw(d: PosterData): Promise<string> {
  if (typeof document !== 'undefined' && (document as any).fonts?.load) {
    await Promise.all([
      (document as any).fonts.load(`700 80px "League Spartan"`),
      (document as any).fonts.load(`400 30px "Figtree"`),
      (document as any).fonts.load(`italic 400 30px "Figtree"`),
    ]).catch(() => {});
  }
  const [photo, crest] = await Promise.all([
    d.photo ? loadImage(d.photo) : Promise.resolve(null),
    loadImage('/logo.png'),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, H);
  stripe(ctx, 0, 30);

  // Header: crest + set name + occasion
  if (crest) ctx.drawImage(crest, 60, 66, 116, 116);
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 40px ${DISPLAY}`;
  ctx.fillText('IDAGHA CLASS OF 2018', 200, 118);
  ctx.fillStyle = GOLD;
  fitFont(ctx, d.footer, TEXT, 600, 30, 20, W - 260);
  ctx.fillText(d.footer, 200, 160);

  // Photo inside the shield
  const sx = 250, sy = 222, sw = 580, sh = 650;
  ctx.save();
  shieldPath(ctx, sx, sy, sw, sh);
  ctx.fillStyle = GREEN_DEEP;
  ctx.fill();
  ctx.clip();
  if (photo) {
    const scale = Math.max(sw / photo.width, sh / photo.height);
    const pw = photo.width * scale, ph = photo.height * scale;
    ctx.drawImage(photo, sx + (sw - pw) / 2, sy + (sh - ph) / 2.4, pw, ph);
  } else {
    const ini = d.name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center';
    ctx.font = `700 220px ${DISPLAY}`;
    ctx.fillText(ini, sx + sw / 2, sy + sh * 0.58);
  }
  ctx.restore();
  ctx.lineWidth = 10;
  ctx.strokeStyle = GOLD;
  shieldPath(ctx, sx, sy, sw, sh);
  ctx.stroke();

  // Status badge
  if (d.badge) {
    ctx.font = `700 26px ${TEXT}`;
    const bw = ctx.measureText(d.badge).width + 44;
    ctx.fillStyle = GOLD;
    ctx.fillRect(W - 60 - bw, 236, bw, 52);
    ctx.fillStyle = GREEN_DEEP;
    ctx.textAlign = 'center';
    ctx.fillText(d.badge, W - 60 - bw / 2, 271);
  }

  // Gold band with the call
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 900, W, 104);
  ctx.fillStyle = GREEN_DEEP;
  ctx.textAlign = 'center';
  ctx.font = `700 76px ${DISPLAY}`;
  ctx.fillText(d.band.toUpperCase(), W / 2, 980);

  // Name, role, slogan
  ctx.fillStyle = CREAM;
  fitFont(ctx, d.name.toUpperCase(), DISPLAY, 700, 84, 44, W - 120);
  ctx.fillText(d.name.toUpperCase(), W / 2, 1098);

  ctx.fillStyle = GOLD;
  fitFont(ctx, d.role.toUpperCase(), DISPLAY, 700, 50, 30, W - 120);
  ctx.fillText(d.role.toUpperCase(), W / 2, 1162);

  if (d.slogan) {
    ctx.fillStyle = CREAM;
    ctx.font = `italic 400 34px ${TEXT}`;
    wrap(ctx, `“${d.slogan}”`, W - 160, 2).forEach((l, i) => ctx.fillText(l, W / 2, 1222 + i * 44));
  }

  stripe(ctx, H - 22, 22);
  return canvas.toDataURL('image/png');
}

export function renderPoster(d: PosterData): Promise<string> {
  const key = JSON.stringify({ ...d, photo: d.photo ? `${d.photo.length}:${d.photo.slice(-64)}` : '' });
  if (!cache.has(key)) {
    const p = draw(d);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
    if (cache.size > 80) cache.delete(cache.keys().next().value as string);
  }
  return cache.get(key)!;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
