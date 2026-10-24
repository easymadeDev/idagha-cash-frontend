import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AdminLayout from '../../components/AdminLayout';
import AdminHeader from '../../components/AdminHeader';
import api, { formatDate } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { adminFetcher, errorMessage } from '../../lib/member';
import { fileToDataUrl } from '../../lib/image';

const KEY = '/api/gallery/admin/all';

export default function AdminGallery() {
  const { toast } = useToast();
  const { data, isLoading } = useSWR(KEY, adminFetcher);
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const [album, setAlbum] = useState('Memories');
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [editing, setEditing] = useState<any>(null);

  const all = Array.isArray(data) ? data : [];
  const pending = all.filter((p: any) => p.status === 'pending');
  const shown = tab === 'pending' ? pending : all.filter((p: any) => p.status === 'approved');
  const albums = Array.from(new Set(all.map((p: any) => p.album))) as string[];

  const refresh = () => { mutate(KEY); mutate('/api/gallery/albums'); };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading({ done: 0, total: list.length });
    let ok = 0;
    for (const [i, f] of list.entries()) {
      try {
        await api.post('/gallery', { image: await fileToDataUrl(f), album: album.trim() || 'Memories' });
        ok++;
      } catch (err) { toast(`${f.name}: ${errorMessage(err)}`, 'error'); }
      setUploading({ done: i + 1, total: list.length });
    }
    setUploading(null);
    refresh();
    toast(`${ok} photo${ok === 1 ? '' : 's'} added to “${album}”`, 'success');
    setTab('approved');
  };

  const update = async (p: any, patch: any) => {
    try { await api.put(`/gallery/${p._id}`, patch); refresh(); } catch (err) { toast(errorMessage(err), 'error'); }
  };
  const remove = async (p: any) => {
    if (!confirm('Delete this photo?')) return;
    try { await api.delete(`/gallery/${p._id}`); refresh(); } catch (err) { toast(errorMessage(err), 'error'); }
  };

  return (
    <AdminLayout>
      <AdminHeader title="Gallery" sub="Upload class photos and approve the ones members share." />

      <div className="card" style={{ padding: 18, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <label className="form-label">Album</label>
          <input className="form-input" list="admin-albums" value={album} onChange={(e) => setAlbum(e.target.value)} />
          <datalist id="admin-albums">{albums.map((a) => <option key={a} value={a} />)}</datalist>
        </div>
        <label className="btn btn-primary" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
          <input type="file" accept="image/*" multiple hidden disabled={!!uploading} onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
          {uploading ? `Uploading ${uploading.done}/${uploading.total}…` : 'Upload photos'}
        </label>
      </div>

      <div className="pill-tabs">
        <button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>Awaiting approval ({pending.length})</button>
        <button className={tab === 'approved' ? 'active' : ''} onClick={() => setTab('approved')}>Published ({all.length - pending.length})</button>
      </div>

      {isLoading ? <p style={{ color: 'var(--text-3)' }}>Loading…</p> : shown.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>{tab === 'pending' ? 'No photos waiting for approval.' : 'No published photos yet.'}</div>
      ) : (
        <div className="grid-auto-sm">
          {shown.map((p: any) => (
            <div key={p._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <img src={p.image} alt={p.caption || p.album} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} loading="lazy" />
              <div style={{ padding: 10, display: 'grid', gap: 6 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{p.album}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{p.caption || 'No caption'} · {p.uploadedBy} · {formatDate(p.createdAt)}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.status === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => update(p, { status: 'approved' })}>Approve</button>}
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ ...p })}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Edit photo</p>
            <div className="form-group"><label className="form-label">Album</label>
              <input className="form-input" list="admin-albums" value={editing.album} onChange={(e) => setEditing({ ...editing, album: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Caption</label>
              <input className="form-input" value={editing.caption} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} /></div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => { await update(editing, { album: editing.album, caption: editing.caption }); setEditing(null); }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
