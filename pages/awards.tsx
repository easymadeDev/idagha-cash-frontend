import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Layout from '../components/Layout';
import { useToast } from '../components/Toast';
import { useGate } from '../lib/gate';
import { fetcher, memberFetcher, memberApi, errorMessage, initials } from '../lib/member';
import Poster from '../components/Poster';
import { useRequireLogin } from '../lib/requireLogin';

function NominateModal({ category, onClose, onDone }: { category: any; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const { data: members } = useSWR('/api/members', fetcher);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const nominated = new Set((category.nominees || []).map((n: any) => n.memberId));
  const results = useMemo(() => {
    const list = Array.isArray(members) ? members : [];
    const s = q.trim().toLowerCase();
    return list.filter((m: any) => !s || m.name.toLowerCase().includes(s) || (m.nickname || '').toLowerCase().includes(s)).slice(0, 30);
  }, [members, q]);

  const submit = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      await memberApi.post(`/awards/${category._id}/nominate`, { memberId: picked._id, reason });
      toast(`${picked.name} nominated for ${category.title}`, 'success');
      onDone();
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">Nominate for {category.title}</p>
        {!picked ? (
          <>
            <input className="form-input" placeholder="Search classmates by name…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <div style={{ maxHeight: 340, overflowY: 'auto', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {!members && <p style={{ color: 'var(--text-3)' }}>Loading members…</p>}
              {results.map((m: any) => {
                const already = nominated.has(m._id);
                return (
                  <button key={m._id} type="button" disabled={already} onClick={() => setPicked(m)} className="nominee-row"
                    style={{ cursor: already ? 'not-allowed' : 'pointer', opacity: already ? 0.5 : 1, textAlign: 'left', color: 'inherit', font: 'inherit' }}>
                    <div className="avatar">{m.photo ? <img src={m.photo} alt="" /> : initials(m.name)}</div>
                    <span style={{ fontWeight: 600 }}>{m.name}{m.nickname ? <span style={{ color: 'var(--text-3)', fontWeight: 400 }}> “{m.nickname}”</span> : null}</span>
                    {already && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-3)' }}>already nominated</span>}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="nominee-row mine">
              <div className="avatar">{picked.photo ? <img src={picked.photo} alt="" /> : initials(picked.name)}</div>
              <span style={{ fontWeight: 700 }}>{picked.name}</span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setPicked(null)}>Change</button>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Why do they deserve it? (optional)</label>
              <textarea className="form-textarea" maxLength={280} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Never misses a single WhatsApp gist" />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Nominating someone also counts as your support for them in this category.</p>
          </>
        )}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!picked || busy} onClick={submit}>{busy ? 'Nominating…' : 'Nominate'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AwardsPage() {
  const { toast } = useToast();
  const { member, cleared } = useGate();
  const requireLogin = useRequireLogin();
  const { data: board, isLoading } = useSWR('/api/awards', fetcher, { refreshInterval: 15000 });
  // the board is public; your own supports load once signed in
  const { data: mine } = useSWR(cleared ? '/api/awards/me' : null, memberFetcher);
  const [nominating, setNominating] = useState<any>(null);
  const [busy, setBusy] = useState('');
  const [posterFor, setPosterFor] = useState<{ cat: any; n: any } | null>(null);

  const categories = Array.isArray(board) ? board : [];
  const myPick: Record<string, string> = Object.fromEntries((mine?.supports || []).map((s: any) => [s.categoryId, s.nomineeId]));
  const refresh = () => { mutate('/api/awards'); mutate('/api/awards/me'); };

  const support = async (cat: any, nominee: any) => {
    setBusy(nominee._id);
    try {
      await memberApi.post(`/awards/${cat._id}/support`, { nomineeId: nominee._id });
      toast(`You’re backing ${nominee.memberName}`, 'success');
      refresh();
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(''); }
  };

  const withdraw = async (cat: any) => {
    setBusy(cat._id);
    try { await memberApi.delete(`/awards/${cat._id}/support`); refresh(); }
    catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(''); }
  };

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ marginBottom: 14 }}>
            <span className="badge badge-yellow"><span className="badge-dot" />Alumni Awards</span>
          </div>
          <h1>Alumni Awards</h1>
          <p>Nominate a classmate, back the one you think deserves it, and watch the board move. One support per category; you can switch until it closes.</p>
        </div>

        {isLoading ? (
          <div className="grid-auto">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}</div>
        ) : categories.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-3)' }}>No award categories yet. The General Secretary will open them soon.</div>
        ) : (
          <div className="aw-grid">
            {categories.map((cat: any) => {
              const open = cat.status === 'open';
              const top = cat.nominees?.[0]?.supports || 0;
              const nominees: any[] = cat.nominees || [];
              return (
                <div key={cat._id} className={`card aw-card${open ? '' : ' is-closed'}`}>
                  {/* head: emoji, title and count, with Nominate at the side */}
                  <div className="aw-head">
                    <div className="aw-emoji" aria-hidden="true">{cat.emoji || '🏆'}</div>
                    <div className="aw-title">
                      <h2>{cat.title}</h2>
                      <span>{open ? `${cat.totalSupports} support${cat.totalSupports === 1 ? '' : 's'}` : 'Closed'}</span>
                    </div>
                    {open && (
                      <button type="button" className="aw-nominate" onClick={() => requireLogin(() => setNominating(cat))}
                        aria-label={`Nominate someone for ${cat.title}`}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                        Nominate
                      </button>
                    )}
                  </div>
                  {cat.description && <p className="aw-desc">{cat.description}</p>}

                  {cat.winner && (
                    <button type="button" className="aw-winner" onClick={() => setPosterFor({ cat, n: cat.winner })}>
                      <span className="avatar">{cat.winner.memberPhoto ? <img src={cat.winner.memberPhoto} alt="" /> : initials(cat.winner.memberName)}</span>
                      <span><small>Winner</small><b>{cat.winner.memberName}</b></span>
                      <em>{cat.winner.supports}</em>
                    </button>
                  )}

                  {/* every nominee gets their own poster: a swipeable strip, tap one to open it full size */}
                  {nominees.length > 0 && (
                    <div className="aw-posters">
                      {nominees.map((n: any, i: number) => (
                        <Poster key={n._id} download={false} onClick={() => setPosterFor({ cat, n })}
                          data={{
                            photo: n.memberPhoto, name: n.memberName,
                            band: cat.winner?._id === n._id ? 'WINNER' : 'NOMINATED', role: cat.title, slogan: n.reason,
                            footer: cat.season || 'Alumni Awards',
                            badge: cat.winner?._id === n._id ? undefined : i === 0 && n.supports > 0 ? `LEADING · ${n.supports}` : `${n.supports} SUPPORTS`,
                          }} />
                      ))}
                    </div>
                  )}

                  {/* nominees: one row each, Support at the side */}
                  {nominees.length === 0 ? (
                    <p className="aw-empty">No nominations yet.</p>
                  ) : (
                    <ol className="aw-list">
                      {nominees.map((n: any, i: number) => {
                        const isMine = myPick[cat._id] === n._id;
                        const isSelf = member?._id === n.memberId;
                        const leading = i === 0 && n.supports > 0;
                        return (
                          <li key={n._id} className={`aw-row${isMine ? ' mine' : ''}${leading ? ' lead' : ''}`}>
                            <button type="button" className="avatar aw-face" title="View poster" onClick={() => setPosterFor({ cat, n })}>
                              {n.memberPhoto ? <img src={n.memberPhoto} alt="" /> : initials(n.memberName)}
                              {leading && <i className="aw-crown" aria-hidden="true">★</i>}
                            </button>
                            <div className="aw-who">
                              <b>{n.memberName}</b>
                              {n.reason && <span title={n.reason}>“{n.reason}”</span>}
                              <div className="vote-bar"><i style={{ width: `${top ? (n.supports / top) * 100 : 0}%` }} /></div>
                            </div>
                            {open ? (
                              <button type="button" className={`aw-support${isMine ? ' on' : ''}`}
                                disabled={busy === n._id || busy === cat._id}
                                aria-pressed={isMine}
                                aria-label={isMine ? `Withdraw support from ${n.memberName}` : `Support ${n.memberName}`}
                                onClick={() => (isMine ? withdraw(cat) : requireLogin(() => support(cat, n)))}>
                                <b>{n.supports}</b>
                                <span>{isMine ? 'Backing' : isSelf ? 'Back me' : 'Support'}</span>
                              </button>
                            ) : (
                              <span className="aw-support is-static"><b>{n.supports}</b><span>supports</span></span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {posterFor && (
        <div className="modal-overlay" onClick={() => setPosterFor(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <Poster data={{
              photo: posterFor.n.memberPhoto, name: posterFor.n.memberName,
              band: posterFor.cat.winner?._id === posterFor.n._id ? 'WINNER' : 'NOMINATED',
              role: posterFor.cat.title, slogan: posterFor.n.reason,
              footer: posterFor.cat.season || 'Alumni Awards',
              badge: posterFor.cat.winner?._id === posterFor.n._id ? undefined
                : posterFor.cat.nominees?.[0]?._id === posterFor.n._id && posterFor.n.supports > 0 ? `LEADING · ${posterFor.n.supports}` : `${posterFor.n.supports} SUPPORTS`,
            }} />
            <div className="modal-actions" style={{ marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => setPosterFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {nominating && (
        <NominateModal category={nominating} onClose={() => setNominating(null)} onDone={() => { setNominating(null); refresh(); }} />
      )}
    </Layout>
  );
}
