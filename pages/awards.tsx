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
            <span className="badge badge-yellow"><span className="badge-dot" />Class Awards</span>
          </div>
          <h1>Class Awards</h1>
          <p>Nominate a classmate, back the one you think deserves it, and watch the board move. One support per category; you can switch until it closes.</p>
        </div>

        {isLoading ? (
          <div className="grid-auto">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}</div>
        ) : categories.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--text-3)' }}>No award categories yet. The Secretary will open them soon.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {categories.map((cat: any) => {
              const open = cat.status === 'open';
              const top = cat.nominees?.[0]?.supports || 0;
              return (
                <div key={cat._id} className="card award-card">
                  <div className="award-head">
                    <div className="award-emoji" aria-hidden="true">{cat.emoji || '🏆'}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{cat.title}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>
                        {cat.season ? `${cat.season} · ` : ''}{cat.totalSupports} support{cat.totalSupports === 1 ? '' : 's'}
                      </div>
                    </div>
                    <span className={`badge ${open ? 'badge-green' : 'badge-red'}`}>{open ? 'Open' : 'Closed'}</span>
                  </div>
                  {cat.description && <p style={{ fontSize: '0.84rem', color: 'var(--text-3)' }}>{cat.description}</p>}

                  {(cat.winner || cat.nominees?.[0]) && (() => {
                    const lead = cat.winner || cat.nominees[0];
                    return (
                      <Poster data={{
                        photo: lead.memberPhoto, name: lead.memberName,
                        band: cat.winner ? 'WINNER' : 'NOMINATED', role: cat.title, slogan: lead.reason,
                        footer: cat.season || 'Class Awards',
                        badge: cat.winner ? undefined : lead.supports ? `LEADING · ${lead.supports}` : 'NOMINEE',
                      }} />
                    );
                  })()}

                  {cat.winner && (
                    <div className="winner-banner">
                      <div className="avatar avatar-shield" style={{ width: 48, height: 54 }}>{cat.winner.memberPhoto ? <img src={cat.winner.memberPhoto} alt="" /> : initials(cat.winner.memberName)}</div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--yellow)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Winner</div>
                        <div style={{ fontWeight: 800 }}>{cat.winner.memberName}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>{cat.winner.supports} supports</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(cat.nominees || []).length === 0 && <p style={{ fontSize: '0.84rem', color: 'var(--text-3)' }}>No nominations yet. Be the first.</p>}
                    {(cat.nominees || []).map((n: any, i: number) => {
                      const isMine = myPick[cat._id] === n._id;
                      const isSelf = member?._id === n.memberId;
                      return (
                        <div key={n._id} className={`nominee-row${isMine ? ' mine' : ''}`} style={{ flexWrap: 'wrap' }}>
                          <span style={{ width: 18, fontWeight: 800, color: i === 0 && n.supports > 0 ? 'var(--yellow)' : 'var(--text-3)', fontSize: '0.8rem' }}>{i + 1}</span>
                          <button type="button" className="avatar" title="View poster" onClick={() => setPosterFor({ cat, n })}
                            style={{ cursor: 'zoom-in', padding: 0, font: 'inherit' }}>
                            {n.memberPhoto ? <img src={n.memberPhoto} alt="" /> : initials(n.memberName)}
                          </button>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{n.memberName}</div>
                            {n.reason && <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis' }} title={n.reason}>“{n.reason}”</div>}
                            <div className="vote-bar" style={{ marginTop: 6 }}><i style={{ width: `${top ? (n.supports / top) * 100 : 0}%` }} /></div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--green-400)' }}>{n.supports}</div>
                            {open && !isMine && (
                              <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} disabled={busy === n._id} onClick={() => requireLogin(() => support(cat, n))}>
                                {isSelf ? 'Back yourself' : 'Support'}
                              </button>
                            )}
                            {open && isMine && (
                              <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} disabled={busy === cat._id} onClick={() => withdraw(cat)}>Withdraw</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {open && (
                    <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={() => requireLogin(() => setNominating(cat))}>
                      {cleared ? '+ Nominate a classmate' : 'Sign in to nominate'}
                    </button>
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
              footer: posterFor.cat.season || 'Class Awards', badge: `${posterFor.n.supports} SUPPORTS`,
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
