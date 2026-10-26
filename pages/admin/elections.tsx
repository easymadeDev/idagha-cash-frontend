import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AdminLayout from '../../components/AdminLayout';
import AdminHeader from '../../components/AdminHeader';
import api, { formatNaira, formatDate } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { adminFetcher, errorMessage, initials } from '../../lib/member';
import { STATUS_INFO } from '../../lib/elections';
import { OFFICIAL_POSITIONS } from '../../lib/positions';

const LIST_KEY = '/api/elections/admin/all';
const EMPTY = {
  title: '', description: '', status: 'draft', bankName: '', accountName: '', accountNumber: '',
  formSaleEnds: '', votingStarts: '', votingEnds: '',
  // every official position, with the form price left for the Secretary to set
  positions: OFFICIAL_POSITIONS.map((title) => ({ title, description: '', requirements: '', formPrice: '' as any })),
};
const toDay = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const NEXT_STATUS: Record<string, string> = { draft: 'forms', forms: 'screening', screening: 'voting', voting: 'closed' };

function ElectionForm({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: (e: any) => void }) {
  const { toast } = useToast();
  const [f, setF] = useState<any>(initial);
  const [saving, setSaving] = useState(false);

  const setPos = (i: number, patch: any) => setF({ ...f, positions: f.positions.map((p: any, j: number) => (j === i ? { ...p, ...patch } : p)) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const body: any = {
      title: f.title, description: f.description, status: f.status,
      bankName: f.bankName, accountName: f.accountName, accountNumber: f.accountNumber,
      positions: f.positions.map((p: any) => ({
        ...(p._id ? { _id: p._id } : {}), title: p.title, description: p.description || '',
        requirements: p.requirements || '', formPrice: Number(p.formPrice) || 0,
      })),
    };
    for (const k of ['formSaleEnds', 'votingStarts', 'votingEnds']) if (f[k]) body[k] = new Date(f[k]).toISOString();
    try {
      const { data } = f._id ? await api.put(`/elections/${f._id}`, body) : await api.post('/elections', body);
      onSaved(data);
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{f._id ? 'Edit election' : 'New election'}</p>
        <form onSubmit={save}>
          <div className="form-group"><label className="form-label">Title *</label>
            <input className="form-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required placeholder="e.g. 2026 Executive Elections" /></div>
          <div className="form-group"><label className="form-label">Description / guidelines</label>
            <textarea className="form-textarea" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>

          <div className="section-title" style={{ margin: '8px 0 10px', fontSize: '0.95rem' }}>Positions & form prices</div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
            {f.positions.map((p: any, i: number) => (
              <div key={p._id || i} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', display: 'grid', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 8 }}>
                  <input className="form-input" list="official-positions" value={p.title} placeholder="Position" onChange={(e) => setPos(i, { title: e.target.value })} required />
                  <input className="form-input" type="number" min={0} value={p.formPrice} placeholder="Form ₦" onChange={(e) => setPos(i, { formPrice: e.target.value })} required />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setF({ ...f, positions: f.positions.filter((_: any, j: number) => j !== i) })}>✕</button>
                </div>
                <input className="form-input" value={p.description} placeholder="What the role does (optional)" onChange={(e) => setPos(i, { description: e.target.value })} />
                <input className="form-input" value={p.requirements} placeholder="Requirements, e.g. must be up to date on dues (optional)" onChange={(e) => setPos(i, { requirements: e.target.value })} />
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }}
            onClick={() => setF({ ...f, positions: [...f.positions, { title: '', description: '', requirements: '', formPrice: '' }] })}>+ Add position</button>
          <datalist id="official-positions">{OFFICIAL_POSITIONS.map((p) => <option key={p} value={p} />)}</datalist>

          <div className="section-title" style={{ margin: '8px 0 10px', fontSize: '0.95rem' }}>Bank account for form payments</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <div className="form-group"><label className="form-label">Bank</label><input className="form-input" value={f.bankName} onChange={(e) => setF({ ...f, bankName: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Account name</label><input className="form-input" value={f.accountName} onChange={(e) => setF({ ...f, accountName: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Account number</label><input className="form-input" value={f.accountNumber} onChange={(e) => setF({ ...f, accountNumber: e.target.value })} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <div className="form-group"><label className="form-label">Form sales end</label><input className="form-input" type="date" value={f.formSaleEnds} onChange={(e) => setF({ ...f, formSaleEnds: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Voting starts</label><input className="form-input" type="date" value={f.votingStarts} onChange={(e) => setF({ ...f, votingStarts: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Voting ends</label><input className="form-input" type="date" value={f.votingEnds} onChange={(e) => setF({ ...f, votingEnds: e.target.value })} /></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving || f.positions.length === 0}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormsPanel({ election }: { election: any }) {
  const { toast } = useToast();
  const key = `/api/elections/${election._id}/forms`;
  const { data } = useSWR(key, adminFetcher, { refreshInterval: 20000 });
  const [view, setView] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [proof, setProof] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  const forms = Array.isArray(data) ? data : [];
  const shown = forms.filter((f: any) => f.paymentStatus === view);
  const confirmed = forms.filter((f: any) => f.paymentStatus === 'approved').reduce((s: number, f: any) => s + f.amount, 0);

  const setPayment = async (f: any, status: string, why?: string) => {
    setBusy(f._id);
    try {
      await api.put(`/elections/forms/${f._id}/payment`, { status, reason: why });
      mutate(key); mutate(`/api/elections/${election._id}`);
      toast(status === 'approved' ? `Payment confirmed — ${formatNaira(f.amount)} added to the Group Wallet` : 'Payment rejected', status === 'approved' ? 'success' : 'info');
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(''); setRejecting(null); setReason(''); }
  };

  const removeForm = async (f: any) => {
    const paidNote = f.paymentStatus === 'approved' ? ` Its ${formatNaira(f.amount)} payment will be removed from the Group Wallet, and any votes for this candidate deleted.` : '';
    if (!window.confirm(`Delete ${f.memberName}'s ${f.positionTitle} form (${f.reference})?${paidNote} This cannot be undone.`)) return;
    setBusy(f._id);
    try {
      await api.delete(`/elections/forms/${f._id}`);
      mutate(key); mutate(`/api/elections/${election._id}`); mutate('/api/contributions'); mutate('/api/stats/summary');
      toast('Form deleted', 'success');
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(''); }
  };

  const setScreening = async (f: any, status: string) => {
    setBusy(f._id);
    try {
      await api.put(`/elections/forms/${f._id}/screening`, { status });
      mutate(key); mutate(`/api/elections/${election._id}`);
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(''); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <div className="pill-tabs" style={{ marginBottom: 0 }}>
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <button key={s} className={view === s ? 'active' : ''} onClick={() => setView(s)}>
              {s[0].toUpperCase() + s.slice(1)} ({forms.filter((f: any) => f.paymentStatus === s).length})
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-3)' }}>Confirmed form sales: <strong style={{ color: 'var(--green-400)' }}>{formatNaira(confirmed)}</strong></span>
      </div>

      {shown.length === 0 ? <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)' }}>Nothing here.</div> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {shown.map((f: any) => (
            <div key={f._id} className="card" style={{ padding: 14, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700 }}>{f.memberName} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>· {f.positionTitle}</span></div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                    Ref <strong>{f.reference}</strong> · {formatNaira(f.amount)} · paid by “{f.payerName}” · {formatDate(f.createdAt)}{f.phone ? ` · ${f.phone}` : ''}
                  </div>
                </div>
                {f.proofImage && <button className="btn btn-ghost btn-sm" onClick={() => setProof(f.proofImage)}>View receipt</button>}
                {view === 'pending' && <>
                  <button className="btn btn-primary btn-sm" disabled={busy === f._id} onClick={() => setPayment(f, 'approved')}>Confirm payment</button>
                  <button className="btn btn-danger btn-sm" disabled={busy === f._id} onClick={() => setRejecting(f)}>Reject</button>
                </>}
                {view === 'rejected' && <button className="btn btn-ghost btn-sm" disabled={busy === f._id} onClick={() => setPayment(f, 'pending')}>Move to pending</button>}
                <button className="btn btn-danger btn-sm" disabled={busy === f._id} onClick={() => removeForm(f)}>Delete</button>
              </div>
              {view === 'approved' && (
                <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Screening:</span>
                    <span className={`badge ${f.applicationStatus === 'cleared' ? 'badge-green' : f.applicationStatus === 'disqualified' ? 'badge-red' : f.applicationStatus === 'submitted' ? 'badge-blue' : 'badge-yellow'}`}>
                      {f.applicationStatus === 'none' ? 'Application not submitted' : f.applicationStatus}
                    </span>
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      {f.applicationStatus !== 'cleared' && f.applicationStatus !== 'none' && <button className="btn btn-primary btn-sm" disabled={busy === f._id} onClick={() => setScreening(f, 'cleared')}>Clear to contest</button>}
                      {f.applicationStatus !== 'disqualified' && f.applicationStatus !== 'none' && <button className="btn btn-danger btn-sm" disabled={busy === f._id} onClick={() => setScreening(f, 'disqualified')}>Disqualify</button>}
                    </span>
                  </div>
                  {f.applicationStatus !== 'none' && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                      {f.photo && <div className="avatar avatar-shield" style={{ width: 56, height: 62 }}><img src={f.photo} alt="" /></div>}
                      <div style={{ minWidth: 0 }}>
                        {f.slogan && <div style={{ color: 'var(--green-400)', fontStyle: 'italic', fontSize: '0.84rem' }}>“{f.slogan}”</div>}
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-2)', whiteSpace: 'pre-wrap', marginTop: 4 }}>{f.manifesto}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {view === 'rejected' && f.rejectReason && <div style={{ fontSize: '0.8rem', color: 'var(--red)' }}>Reason: {f.rejectReason}</div>}
            </div>
          ))}
        </div>
      )}

      {proof && (
        <div className="lightbox" onClick={() => setProof(null)}>
          {proof.startsWith('data:application/pdf')
            ? <a className="btn btn-primary" href={proof} download="receipt.pdf" onClick={(e) => e.stopPropagation()}>Download PDF receipt</a>
            : <img src={proof} alt="Payment receipt" />}
          <p>Tap anywhere to close</p>
        </div>
      )}

      {rejecting && (
        <div className="modal-overlay" onClick={() => setRejecting(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Reject payment?</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.86rem', marginBottom: 12 }}>{rejecting.memberName} will be told by WhatsApp and can buy the form again.</p>
            <div className="form-group"><label className="form-label">Reason</label>
              <input className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Amount not received in account" autoFocus /></div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setRejecting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => setPayment(rejecting, 'rejected', reason)}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsPanel({ election }: { election: any }) {
  const { data } = useSWR(`/api/elections/${election._id}/results`, adminFetcher, { refreshInterval: 15000 });
  if (!data?.positions) return <p style={{ color: 'var(--text-3)' }}>Loading results…</p>;
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <p style={{ fontSize: '0.84rem', color: 'var(--text-3)' }}>{data.totalVoters} members have voted. Members see results once the election is concluded.</p>
      {data.positions.map((p: any) => {
        const max = Math.max(1, ...p.candidates.map((c: any) => c.votes));
        return (
          <div key={p._id} className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>{p.title}</div>
            {p.candidates.length === 0 ? <p style={{ color: 'var(--text-3)', fontSize: '0.84rem' }}>No cleared candidates.</p> :
              p.candidates.map((c: any, i: number) => (
                <div key={c._id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ fontWeight: i === 0 && c.votes > 0 ? 800 : 500 }}>{c.memberName}</span><strong>{c.votes}</strong>
                  </div>
                  <div className="vote-bar"><i style={{ width: `${(c.votes / max) * 100}%` }} /></div>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminElections() {
  const { toast } = useToast();
  const { data, isLoading } = useSWR(LIST_KEY, adminFetcher);
  const [editing, setEditing] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'forms' | 'results'>('forms');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const list = Array.isArray(data) ? data : [];
  const selected = list.find((e: any) => e._id === selectedId) || list[0];

  const refresh = () => { mutate(LIST_KEY); mutate('/api/elections'); };

  const advance = async (el: any, status: string) => {
    try { await api.put(`/elections/${el._id}`, { status }); refresh(); mutate(`/api/elections/${el._id}`); toast(`Election moved to “${STATUS_INFO[status].label}”`, 'success'); }
    catch (err) { toast(errorMessage(err), 'error'); }
  };

  // Paid forms make the first attempt fail with a count; the dialog then asks to remove them too
  const [paidWarning, setPaidWarning] = useState('');
  const remove = async (id: string, force = false) => {
    try {
      const { data: r } = await api.delete(`/elections/${id}${force ? '?force=true' : ''}`);
      refresh(); mutate('/api/contributions'); mutate('/api/stats/summary'); setSelectedId(null);
      toast(r?.paymentsReversed ? `Election deleted, with ${r.paymentsReversed} form payment(s) removed from the books` : 'Election deleted', 'success');
      setDeleteId(null); setPaidWarning('');
    } catch (err: any) {
      if (!force && err?.response?.status === 400 && /paid form/.test(errorMessage(err))) { setPaidWarning(errorMessage(err)); return; }
      toast(errorMessage(err), 'error'); setDeleteId(null); setPaidWarning('');
    }
  };

  return (
    <AdminLayout>
      <AdminHeader title="Elections" sub="Positions, form sales, screening, voting and results."
        action={<button className="btn btn-primary btn-sm" onClick={() => setEditing(EMPTY)}>+ New election</button>} />

      {isLoading ? <p style={{ color: 'var(--text-3)' }}>Loading…</p> : list.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>No elections yet. Create one to start selling nomination forms.</div>
      ) : (
        <>
          {list.length > 1 && (
            <div className="pill-tabs">
              {list.map((e: any) => <button key={e._id} className={selected?._id === e._id ? 'active' : ''} onClick={() => setSelectedId(e._id)}>{e.title}</button>)}
            </div>
          )}
          {selected && (
            <>
              <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <span className={`badge ${STATUS_INFO[selected.status]?.badge}`}>{STATUS_INFO[selected.status]?.label}</span>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: 8 }}>{selected.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 4 }}>
                      {selected.positions.map((p: any) => `${p.title} (${formatNaira(p.formPrice)})`).join(' · ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {NEXT_STATUS[selected.status] && (
                      <button className="btn btn-primary btn-sm" onClick={() => advance(selected, NEXT_STATUS[selected.status])}>
                        {selected.status === 'draft' ? 'Publish & open form sales' : selected.status === 'forms' ? 'Close sales → Screening' : selected.status === 'screening' ? 'Open voting' : 'Close voting & publish results'}
                      </button>
                    )}
                    <select className="form-select" style={{ width: 150, padding: '6px 10px', fontSize: '0.8rem' }} value={selected.status}
                      onChange={(e) => advance(selected, e.target.value)} aria-label="Set status">
                      {Object.keys(STATUS_INFO).map((s) => <option key={s} value={s}>{STATUS_INFO[s].label}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing({
                      ...selected, formSaleEnds: toDay(selected.formSaleEnds), votingStarts: toDay(selected.votingStarts), votingEnds: toDay(selected.votingEnds),
                    })}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(selected._id)}>Del</button>
                  </div>
                </div>
                {!selected.accountNumber && <div className="alert" style={{ marginTop: 14, marginBottom: 0, borderColor: 'var(--yellow-border)', background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>Add the bank account details so members know where to pay for forms.</div>}
              </div>

              <div className="pill-tabs">
                <button className={tab === 'forms' ? 'active' : ''} onClick={() => setTab('forms')}>Forms & screening</button>
                <button className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}>Live results</button>
              </div>
              {tab === 'forms' ? <FormsPanel election={selected} /> : <ResultsPanel election={selected} />}
            </>
          )}
        </>
      )}

      {editing && <ElectionForm initial={editing} onClose={() => setEditing(null)} onSaved={(e) => { setEditing(null); refresh(); setSelectedId(e._id); }} />}

      {deleteId && (
        <div className="modal-overlay" onClick={() => { setDeleteId(null); setPaidWarning(''); }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Delete election?</p>
            {paidWarning ? (
              <p style={{ color: 'var(--red)', marginBottom: 20, fontSize: '0.9rem' }}>
                {paidWarning} Their nomination-fee entries will be removed from the Group Wallet, and all votes deleted. This cannot be undone.
              </p>
            ) : (
              <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>All its nomination forms and votes will be removed. This cannot be undone.</p>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setDeleteId(null); setPaidWarning(''); }}>Cancel</button>
              <button className="btn btn-danger" onClick={() => remove(deleteId, !!paidWarning)}>{paidWarning ? 'Delete everything' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
