import { useEffect, useState } from 'react';
import { renderPoster, downloadDataUrl, PosterData } from '../lib/poster';

// Auto-generated campaign / nomination poster: photo with the writing on it
export default function Poster({ data, download = true, onClick, style }: {
  data: PosterData;
  download?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [src, setSrc] = useState('');
  const key = JSON.stringify({ ...data, photo: data.photo?.length });

  useEffect(() => {
    let live = true;
    // Debounce so the live preview doesn't redraw on every keystroke
    const t = setTimeout(() => {
      renderPoster(data).then((url) => { if (live) setSrc(url); }).catch(() => {});
    }, 180);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, data.photo]);

  const file = `${data.name.replace(/\W+/g, '-')}-${data.role.replace(/\W+/g, '-')}.png`.toLowerCase();

  return (
    <div className="poster" style={style}>
      <div className="poster-img" onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
        {src
          ? <img src={src} alt={`${data.band} ${data.name} — ${data.role}`} />
          : <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />}
      </div>
      {download && src && (
        <button type="button" className="btn btn-ghost btn-sm poster-dl"
          onClick={(e) => { e.stopPropagation(); downloadDataUrl(src, file); }}>
          Download poster
        </button>
      )}
    </div>
  );
}
