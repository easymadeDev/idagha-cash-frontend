// Server-only (getStaticProps): lists the class's own photographs in public/img/class.
// Drop .jpg/.png/.webp files in that folder; optional captions.json maps
// file name → caption, e.g. { "window.jpg": "SS3 block, 2018" }.
import fs from 'fs';
import path from 'path';

export type ClassPhoto = { src: string; caption: string; focus: string };

export function getClassPhotos(): ClassPhoto[] {
  const dir = path.join(process.cwd(), 'public', 'img', 'class');
  if (!fs.existsSync(dir)) return [];
  let captions: Record<string, string | { caption?: string; focus?: string }> = {};
  try { captions = JSON.parse(fs.readFileSync(path.join(dir, 'captions.json'), 'utf8')); } catch {}
  return fs.readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()
    .map((f) => {
      const c = captions[f];
      const caption = typeof c === 'string' ? c : c?.caption || 'Idagha Secondary School';
      // focus = CSS object-position; faces in these photos sit in the upper third
      const focus = (typeof c === 'object' && c?.focus) || '50% 30%';
      return { src: `/img/class/${encodeURIComponent(f)}`, caption, focus };
    });
}
