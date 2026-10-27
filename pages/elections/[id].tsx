import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR, { mutate } from 'swr';
import Layout from '../../components/Layout';
import { useToast } from '../../components/Toast';
import { useGate } from '../../lib/gate';
import { fetcher, memberFetcher, memberApi, errorMessage, initials } from '../../lib/member';
import { fileToDataUrl } from '../../lib/image';
import { formatNaira, formatDate } from '../../lib/api';
import { STATUS_INFO, ELECTION_STAGES } from '../../lib/elections';
import Poster from '../../components/Poster';
import { useRequireLogin } from '../../lib/requireLogin';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE } from '../../components/motion';

const PAY_BADGE: Record<string, [string, string]> = {
  pending: ['badge-yellow', 'Payment pending'],
  approved: ['badge-green', 'Payment confirmed'],
  rejected: ['badge-red', 'Payment rejected'],
};
const APP_BADGE: Record<string, [string, string]> = {
  none: ['badge-yellow', 'Application not submitted'],
  submitted: ['badge-blue', 'Awaiting screening'],
  cleared: ['badge-green', 'Cleared to contest'],
  disqualified: ['badge-red', 'Disqualified'],
};

function Stages({ status }: { status: string }) {
  const at = ELECTION_STAGES.indexOf(status);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, margin: '18px 0 28px' }}>
      {ELECTION_STAGES.map((s, i) => (
        <div key={s} style={{ textAlign: 'center' }}>
          <div style={{ height: 6, borderRadius: 99, background: i <= at ? 'var(--green-500)' : 'rgba(255,255,255,0.08)' }} />
          <div style={{ fontSize: '0.72rem', marginTop: 6, color: i === at ? 'var(--green-400)' : 'var(--text-3)', fontWeight: i === at ? 700 : 500 }}>
            {STATUS_INFO[s].label}
          </div>
        </div>
      ))}
    </div>
  );
}

// The admin writes guidelines as plain text: the first paragraph is the lead, the rest is
// paragraphs with optional ALL-CAPS headings, "•"/"-" bullets and "1." numbered steps
const splitDescription = (text = '') => {
  const blocks = text.trim().split(/\n\s*\n/).filter(Boolean);
  return { lead: blocks[0] || '', rest: blocks.slice(1) };
};
const isHeading = (line: string) => line.length < 48 && /[A-Z]/.test(line) && line === line.toUpperCase();
const BULLET = /^[•\-*]\s+/;
const STEP = /^\d+[.)]\s+/;

function Guidelines({ blocks }: { blocks: string[] }) {
  return (
    <div className="el-guide-body">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const out: JSX.Element[] = [];
        let i = 0;
        if (lines[0] && isHeading(lines[0])) { out.push(<h3 key="h">{lines[0].toLowerCase()}</h3>); i = 1; }
        while (i < lines.length) {
          const kind = BULLET.test(lines[i]) ? 'ul' : STEP.test(lines[i]) ? 'ol' : 'p';
          const group: string[] = [];
          while (i < lines.length && (kind === 'ul' ? BULLET.test(lines[i]) : kind === 'ol' ? STEP.test(lines[i]) : !BULLET.test(lines[i]) && !STEP.test(lines[i]))) {
            group.push(lines[i].replace(kind === 'ul' ? BULLET : kind === 'ol' ? STEP : /^/, ''));
            i++;
          }
          out.push(kind === 'p'
            ? <p key={i}>{group.join(' ')}</p>
            : kind === 'ul' ? <ul key={i}>{group.map((g, gi) => <li key={gi}>{g}</li>)}</ul>
            : <ol key={i}>{group.map((g, gi) => <li key={gi}>{g}</li>)}</ol>);
        }
        return <section key={bi}>{out}</section>;
      })}
    </div>
  );
}

function BuyFormModal({ election, position, onClose, onDone }: { election: any; position: any; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const { member } = useGate();
  const [payerName, setPayerName] = useState(member?.name || '');
  const [phone, setPhone] = useState('');
  const [proof, setProof] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async (f?: File) => {
    if (!f) return;
    try { setProof(await fileToDataUrl(f)); } catch (e: any) { toast(e.message, 'error'); }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!proof) return toast('Please attach your payment receipt', 'error');
    setBusy(true);
    try {
      const { data } = await memberApi.post(`/elections/${election._id}/forms`, {
        positionId: position._id, payerName, phone: phone || undefined, proofImage: proof,
      });
      toast(`Receipt sent. Your form reference is ${data.reference}`, 'success');
      onDone();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <p className="modal-title">{position.title} nomination form</p>
        <p style={{ color: 'var(--text-3)', fontSize: '0.86rem', marginTop: -12, marginBottom: 16 }}>
          Transfer <strong style={{ color: 'var(--yellow)' }}>{formatNaira(position.formPrice)}</strong> to the account below, then upload your receipt.
        </p>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ width: 120, flexShrink: 0 }}>
            <Poster download={false} data={{ photo: member?.photo, name: member?.name || 'You', band: 'VOTE', role: `for ${position.title}`, footer: election.title, badge: 'ASPIRANT' }} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            Once your payment is confirmed, your poster goes up on this page for every member to see.
            Add a campaign photo and slogan in your application to finish it.
          </p>
        </div>
        {election.accountNumber ? (
          <div className="bank-box" style={{ marginBottom: 18 }}>
            <div><span>Bank</span><b>{election.bankName}</b></div>
            <div><span>Account name</span><b>{election.accountName}</b></div>
            <div><span>Account number</span><b style={{ fontSize: '1.05rem', letterSpacing: '0.04em' }}>{election.accountNumber}</b></div>
            <div><span>Amount</span><b>{formatNaira(position.formPrice)}</b></div>
          </div>
        ) : (
          <div className="alert" style={{ borderColor: 'var(--yellow-border)', background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>
            Bank details have not been published yet. Ask the General Secretary for the account to pay into.
          </div>
        )}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Name on the sending account *</label>
            <input className="form-input" value={payerName} onChange={(e) => setPayerName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone (for confirmation messages)</label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Uses your profile number if empty" />
          </div>
          <div className="form-group">
            <label className="form-label">Payment receipt *</label>
            <label className="upload-drop">
              <input type="file" accept="image/*,application/pdf" hidden onChange={(e) => pick(e.target.files?.[0])} />
              {proof
                ? (proof.startsWith('data:image') ? <img src={proof} alt="Receipt preview" /> : <span>PDF attached ✓</span>)
                : <><strong style={{ color: 'var(--text-2)' }}>Tap to upload a screenshot or PDF</strong><span>Bank app screenshot or transfer slip</span></>}
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Submit receipt'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationForm({ form, footer, onDone }: { form: any; footer: string; onDone: () => void }) {
  const { toast } = useToast();
  const [manifesto, setManifesto] = useState(form.manifesto || '');
  const [slogan, setSlogan] = useState(form.slogan || '');
  const [photo, setPhoto] = useState(form.photo || '');
  const [busy, setBusy] = useState(false);

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      await memberApi.put(`/elections/forms/${form._id}/application`, {
        manifesto, slogan, photo: photo && photo !== form.photo ? photo : undefined,
      });
      toast('Application submitted for screening', 'success');
      onDone();
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 14, alignItems: 'start' }}>
    <form onSubmit={save} style={{ display: 'grid', gap: 4 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <label className="upload-drop" style={{ width: 120, height: 134, padding: 0, overflow: 'hidden' }}>
          <input type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) try { setPhoto(await fileToDataUrl(f, 800)); } catch (er: any) { toast(er.message, 'error'); }
          }} />
          {photo ? <img src={photo} alt="Campaign photo" style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: 'none', borderRadius: 0 }} /> : <span>Campaign photo</span>}
        </label>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="form-group">
            <label className="form-label">Campaign slogan</label>
            <input className="form-input" value={slogan} onChange={(e) => setSlogan(e.target.value)} maxLength={80} placeholder="e.g. Service before self" />
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Manifesto *</label>
        <textarea className="form-textarea" style={{ minHeight: 140 }} value={manifesto} onChange={(e) => setManifesto(e.target.value)} required
          placeholder="What will you do for the set if elected?" />
      </div>
      <div><button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : form.applicationStatus === 'submitted' ? 'Update application' : 'Submit application'}</button></div>
    </form>
    <div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 8 }}>Your campaign poster — updates as you type</div>
      <Poster data={{ photo, name: form.memberName, band: 'VOTE', role: `for ${form.positionTitle}`, slogan, footer, badge: 'ASPIRANT' }} />
    </div>
    </div>
  );
}

export default function ElectionDetail() {
  const router = useRouter();
  const { toast } = useToast();
  const id = router.query.id as string | undefined;
  const key = id ? `/api/elections/${id}` : null;
  const { cleared } = useGate();
  const requireLogin = useRequireLogin();
  // the member's own forms and votes load only once signed in (the page itself is public)
  const meKey = id && cleared ? `/api/elections/${id}/me` : null;
  const { data: el, error } = useSWR(key, fetcher, { refreshInterval: 20000 });
  const { data: me } = useSWR(meKey, memberFetcher);
  const [buying, setBuying] = useState<any>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{ position: any; candidate: any } | null>(null);
  const [voting, setVoting] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  // While a sheet is open: Escape closes it and the page behind stops scrolling
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.modal-overlay')) setSheet(null); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [sheet]);

  const refresh = () => { mutate(key); mutate(meKey); };

  useEffect(() => { setChoice({}); }, [id]);

  if (error || el?.statusCode) {
    return <Layout><div className="container"><div className="card" style={{ margin: '48px 0', padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>Election not found.</div></div></Layout>;
  }
  if (!el) return <Layout><div className="container" style={{ paddingTop: 48 }}><div className="skeleton" style={{ height: 320 }} /></div></Layout>;

  const s = STATUS_INFO[el.status] || STATUS_INFO.closed;
  const { lead, rest: guide } = splitDescription(el.description);
  const sheetPos = el.positions.find((p: any) => p._id === sheet);
  const myForms: any[] = me?.forms || [];
  const votedFor: Record<string, string> = Object.fromEntries((me?.votes || []).map((v: any) => [v.positionId, v.candidateId]));
  const formFor = (pid: string) => myForms.find((f) => f.positionId === pid && f.paymentStatus !== 'rejected');

  const castVote = async () => {
    if (!confirm) return;
    setVoting(true);
    try {
      await memberApi.post(`/elections/${el._id}/vote`, { positionId: confirm.position._id, candidateId: confirm.candidate._id });
      toast(`Your vote for ${confirm.position.title} is in`, 'success');
      setConfirm(null);
      refresh();
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setVoting(false); }
  };

  return (
    <Layout>
      <div className="container">
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 24 }} onClick={() => router.push('/elections')}>← All elections</button>
        <div className="page-header" style={{ paddingTop: 20, paddingBottom: 0 }}>
          <div style={{ marginBottom: 14 }}><span className={`badge ${s.badge}`}><span className="badge-dot" />{s.label}</span></div>
          <h1>{el.title}</h1>
          {lead && <p className="el-lead">{lead}</p>}
        </div>
        <Stages status={el.status} />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, fontSize: '0.82rem', color: 'var(--text-3)' }}>
          {el.formSaleEnds && <span className="badge badge-yellow">Form sales end {formatDate(el.formSaleEnds)}</span>}
          {el.votingStarts && <span className="badge badge-blue">Voting starts {formatDate(el.votingStarts)}</span>}
          {el.votingEnds && <span className="badge badge-green">Voting ends {formatDate(el.votingEnds)}</span>}
          {el.totalVoters > 0 && <span className="badge badge-green">{el.totalVoters} members have voted</span>}
        </div>

        {/* My nomination forms */}
        {myForms.length > 0 && (
          <div className="card" style={{ padding: 22, marginBottom: 28 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>My nomination forms</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {myForms.map((f) => {
                const canApply = f.paymentStatus === 'approved' && ['none', 'submitted'].includes(f.applicationStatus)
                  && ['forms', 'screening'].includes(el.status);
                return (
                  <div key={f._id} style={{ padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{f.positionTitle}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Ref {f.reference} · {formatNaira(f.amount)} · {formatDate(f.createdAt)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className={`badge ${PAY_BADGE[f.paymentStatus]?.[0]}`}>{PAY_BADGE[f.paymentStatus]?.[1]}</span>
                        {f.paymentStatus === 'approved' && <span className={`badge ${APP_BADGE[f.applicationStatus]?.[0]}`}>{APP_BADGE[f.applicationStatus]?.[1]}</span>}
                      </div>
                    </div>
                    {f.paymentStatus === 'rejected' && f.rejectReason && <p style={{ color: 'var(--red)', fontSize: '0.84rem', marginTop: 10 }}>Reason: {f.rejectReason}</p>}
                    {f.applicationStatus === 'disqualified' && f.screeningNote && <p style={{ color: 'var(--red)', fontSize: '0.84rem', marginTop: 10 }}>Screening note: {f.screeningNote}</p>}
                    {f.paymentStatus === 'pending' && <p style={{ color: 'var(--text-3)', fontSize: '0.84rem', marginTop: 10 }}>The General Secretary will confirm your payment. You will get a WhatsApp message when it’s done.</p>}
                    {canApply && <ApplicationForm form={f} footer={el.title} onDone={refresh} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {guide.length > 0 && (
          <details className="card el-guide">
            <summary>Election guidelines</summary>
            <Guidelines blocks={guide} />
          </details>
        )}

        {/* Positions */}
        <div className="section-header" style={{ marginTop: 28 }}>
          <div>
            <div className="section-title">Positions</div>
            <div className="section-sub">{el.positions.length} offices</div>
          </div>
        </div>
        <div className="el-jump" role="navigation" aria-label="Positions">
          {el.positions.map((p: any) => (
            <button key={p._id} type="button" onClick={() => setSheet(p._id)}>
              {p.title}{p.aspirantCount > 0 && <b>{p.aspirantCount}</b>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {el.positions.map((p: any) => (
            // a card is just the office and its form price (or ballot size once voting starts); tapping opens its sheet
            <button key={p._id} type="button" className="card el-pos el-pos-head" aria-haspopup="dialog" onClick={() => setSheet(p._id)}>
              <h2>{p.title}</h2>
              <span className="el-pos-price">
                {(formFor(p._id) || votedFor[p._id]) && <i className="el-pos-dot" title={votedFor[p._id] ? 'You voted' : 'You have this form'} />}
                {el.status === 'forms' || el.status === 'draft'
                  ? formatNaira(p.formPrice)
                  : `${p.candidates.length} candidate${p.candidates.length === 1 ? '' : 's'}`}
              </span>
              <span className="el-pos-chev" aria-hidden="true">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Position details: a bottom sheet on phones, a centred panel on wider screens */}
      <AnimatePresence>
        {sheetPos && (() => {
          const p = sheetPos;
          const mine = formFor(p._id);
          const voted = votedFor[p._id];
          const maxVotes = Math.max(1, ...p.candidates.map((c: any) => c.votes || 0));
          const hidden = reduce ? { opacity: 0 } : phone ? { transform: 'translateY(100%)' } : { opacity: 0, transform: 'translateY(16px) scale(0.97)' };
          const shown = reduce ? { opacity: 1 } : phone ? { transform: 'translateY(0%)' } : { opacity: 1, transform: 'translateY(0px) scale(1)' };
          return (
            <motion.div key="sheet" className="el-sheet-overlay" onClick={() => setSheet(null)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE }}>
              <motion.div className="el-sheet" role="dialog" aria-modal="true" aria-labelledby="el-sheet-title" data-lenis-prevent
                onClick={(e) => e.stopPropagation()}
                initial={hidden} animate={shown} exit={hidden}
                transition={phone ? { duration: 0.32, ease: [0.32, 0.72, 0, 1] } : { duration: 0.22, ease: EASE }}>
                <div className="el-sheet-grip" aria-hidden="true" />
                <div className="el-sheet-head">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span className="el-sheet-kicker">{el.title}</span>
                    <h2 id="el-sheet-title">{p.title}</h2>
                  </div>
                  <button type="button" className="el-sheet-close" aria-label="Close" autoFocus onClick={() => setSheet(null)}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                  </button>
                </div>
                <div className="el-pos-inner">
                <div className="el-pos-meta">
                  {p.aspirantCount} aspirant{p.aspirantCount === 1 ? '' : 's'} · {p.candidates.length} cleared
                </div>
                {p.description && <p className="el-pos-desc">{p.description}</p>}
                {p.requirements && <p className="el-pos-req"><strong>Requirements</strong>{p.requirements}</p>}
                {el.status === 'forms' && (
                  mine
                    ? <span className="badge badge-green" style={{ alignSelf: 'flex-start' }}>You have this form</span>
                    : <button className="btn btn-primary el-pos-cta" onClick={() => requireLogin(() => setBuying(p))}>
                        {cleared ? 'Buy form' : 'Sign in to buy form'} · {formatNaira(p.formPrice)}
                      </button>
                )}
                {el.status === 'voting' && voted && <span className="badge badge-green" style={{ alignSelf: 'flex-start' }}>✓ You voted</span>}

                {(() => {
                  // Before voting every paid aspirant shows; from voting on, only the ballot
                  const ballot = ['voting', 'closed'].includes(el.status);
                  const people = [...(ballot ? p.candidates : p.aspirants || [])]
                    .sort((a: any, b: any) => (el.status === 'closed' ? (b.votes || 0) - (a.votes || 0) : 0));
                  if (people.length === 0) {
                    return el.status !== 'forms' || p.aspirantCount === 0 ? (
                      <p className="el-pos-empty">
                        {ballot ? 'No candidates yet.' : 'No aspirants yet.'}
                      </p>
                    ) : null;
                  }
                  return (
                    <div className="poster-grid">
                      {people.map((c: any, idx: number) => {
                        const selected = choice[p._id] === c._id || voted === c._id;
                        const winner = el.status === 'closed' && idx === 0 && c.votes > 0;
                        const canPick = el.status === 'voting' && !voted;
                        return (
                          <div key={c._id} className={`candidate${selected ? ' selected' : ''}`}
                            style={{ flexDirection: 'column', alignItems: 'stretch', padding: 10, borderColor: winner ? 'var(--yellow)' : undefined }}>
                            <Poster
                              onClick={canPick ? () => requireLogin(() => setChoice({ ...choice, [p._id]: c._id })) : undefined}
                              data={{
                                photo: c.photo, name: c.memberName, band: winner ? 'WINNER' : 'VOTE',
                                role: `for ${p.title}`, slogan: c.slogan, footer: el.title,
                                badge: winner ? undefined : c.applicationStatus === 'cleared' ? 'CANDIDATE' : 'ASPIRANT',
                              }}
                            />
                            {c.manifesto && (
                              <details style={{ marginTop: 2 }}>
                                <summary style={{ fontSize: '0.78rem', color: 'var(--text-3)', cursor: 'pointer' }}>Read manifesto</summary>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-2)', marginTop: 6, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{c.manifesto}</p>
                              </details>
                            )}
                            {canPick && (
                              <button className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-ghost'}`} onClick={() => requireLogin(() => setChoice({ ...choice, [p._id]: c._id }))}>
                                {!cleared ? 'Sign in to vote' : selected ? '✓ Selected' : `Select ${c.memberName.split(' ')[0]}`}
                              </button>
                            )}
                            {voted === c._id && <span className="badge badge-green">Your vote</span>}
                            {el.status === 'closed' && (
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{c.votes || 0} vote{c.votes === 1 ? '' : 's'}</div>
                                <div className="vote-bar"><i style={{ width: `${((c.votes || 0) / maxVotes) * 100}%`, background: winner ? 'var(--yellow)' : undefined }} /></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {el.status === 'voting' && !voted && p.candidates.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" disabled={cleared && !choice[p._id]}
                      onClick={() => requireLogin(() => setConfirm({ position: p, candidate: p.candidates.find((c: any) => c._id === choice[p._id]) }))}>
                      {cleared ? `Cast vote for ${p.title}` : `Sign in to vote for ${p.title}`}
                    </button>
                  </div>
                )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {buying && (
        <BuyFormModal election={el} position={buying} onClose={() => setBuying(null)}
          onDone={() => { setBuying(null); refresh(); }} />
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => !voting && setConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Confirm your vote</p>
            <div className="avatar avatar-shield" style={{ width: 84, height: 94, margin: '0 auto 12px', fontSize: '1.4rem' }}>
              {confirm.candidate.photo ? <img src={confirm.candidate.photo} alt="" /> : initials(confirm.candidate.memberName)}
            </div>
            <p style={{ color: 'var(--text-2)' }}>
              <strong>{confirm.candidate.memberName}</strong> for <strong>{confirm.position.title}</strong>
            </p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 8 }}>Votes are final and cannot be changed.</p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-ghost" disabled={voting} onClick={() => setConfirm(null)}>Go back</button>
              <button className="btn btn-primary" disabled={voting} onClick={castVote}>{voting ? 'Casting…' : 'Cast my vote'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
