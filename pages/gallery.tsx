import { useState } from 'react';
import useSWR from 'swr';
import Layout from '../components/Layout';
import { useToast } from '../components/Toast';
import { fetcher, memberApi, errorMessage } from '../lib/member';
import { fileToDataUrl } from '../lib/image';

function SubmitModal({ albums, onClose }: { albums: string[]; onClose: () => void }) {
  const { toast } = useToast();
  const [image, setImage] = useState('');
  const [album, setAlbum] = useState(albums[0] || 'Memories');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return toast('Choose a photo first', 'error');
    setBusy(true);
    try {
      await memberApi.post('/gallery/submit', { image, album, caption });
      toast('Thanks! Your photo will appear once the Secretary approves it.', 'success');
      onClose();
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">Share a memory</p>
        <form onSubmit={submit}>
          <label className="upload-drop" style={{ marginBottom: 16 }}>
            <input type="file" accept="image/*" hidden onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) try { setImage(await fileToDataUrl(f)); } catch (er: any) { toast(er.message, 'error'); }
            }} />
            {image ? <img src={image} alt="Preview" /> : <><strong style={{ color: 'var(--text-2)' }}>Tap to choose a photo</strong><span>School days, reunions, hangouts</span></>}
          </label>
          <div className="form-group">
            <label className="form-label">Album</label>
            <input className="form-input" list="album-list" value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="e.g. School Days" />
            <datalist id="album-list">{albums.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Caption</label>
            <input className="form-input" value={caption} maxLength={140} onChange={(e) => setCaption(e.target.value)} placeholder="Who, where, when?" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Submit photo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const SCHOOL = '__school_days__';

export async function getStaticProps() {
  const { getClassPhotos } = await import('../lib/classPhotos');
  return { props: { classPhotos: getClassPhotos() } };
}

export default function GalleryPage({ classPhotos = [] }: { classPhotos?: { src: string; caption: string; focus: string }[] }) {
  const [album, setAlbum] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<any>(null);
  const [sharing, setSharing] = useState(false);
  const { data: albums } = useSWR('/api/gallery/albums', fetcher);
  const { data, isLoading } = useSWR(album === SCHOOL ? null : `/api/gallery?page=${page}${album ? `&album=${encodeURIComponent(album)}` : ''}`, fetcher);

  const albumList = Array.isArray(albums) ? albums : [];
  // Our own class photographs form a built-in "School days" album, shown with the uploads
  const school = classPhotos.map((p, i) => ({ _id: `class-${i}`, image: p.src, caption: p.caption, album: 'School days', focus: p.focus }));
  const uploads = album === SCHOOL ? [] : data?.items || [];
  const items = album === SCHOOL ? school : !album && page === 1 ? [...uploads, ...school] : uploads;

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ marginBottom: 14 }}>
            <span className="badge badge-green"><span className="badge-dot" />Memories</span>
          </div>
          <h1>Gallery</h1>
          <p>Our photographs, from school days to every reunion since. Add yours.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          <div className="pill-tabs" style={{ marginBottom: 0 }}>
            <button className={!album ? 'active' : ''} onClick={() => { setAlbum(''); setPage(1); }}>All</button>
            {school.length > 0 && (
              <button className={album === SCHOOL ? 'active' : ''} onClick={() => { setAlbum(SCHOOL); setPage(1); }}>School days ({school.length})</button>
            )}
            {albumList.map((a: any) => (
              <button key={a.name} className={album === a.name ? 'active' : ''} onClick={() => { setAlbum(a.name); setPage(1); }}>
                {a.name} ({a.count})
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setSharing(true)}>+ Share a photo</button>
        </div>

        {isLoading && items.length === 0 ? (
          <div className="masonry">{[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160 + (i % 3) * 60, marginBottom: 12 }} />)}</div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-3)' }}>No photos yet. Be the first to share a memory.</div>
        ) : (
          <div className="masonry">
            {items.map((p: any) => (
              <figure key={p._id} onClick={() => setOpen(p)}>
                <img src={p.image} alt={p.caption || p.album} loading="lazy" />
                {(p.caption || p.uploadedBy) && <figcaption>{p.caption || p.album}{p.uploadedBy ? ` · ${p.uploadedBy}` : ''}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        {data?.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Newer</button>
            <span style={{ color: 'var(--text-3)', fontSize: '0.84rem' }}>Page {page} of {data.pages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Older →</button>
          </div>
        )}
      </div>

      {open && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-label="Photo">
          <img src={open.image} alt={open.caption || open.album} />
          <p>{open.caption}{open.caption ? ' — ' : ''}{open.album}{open.uploadedBy ? ` · shared by ${open.uploadedBy}` : ''}</p>
        </div>
      )}
      {sharing && <SubmitModal albums={albumList.map((a: any) => a.name)} onClose={() => setSharing(false)} />}
    </Layout>
  );
}
