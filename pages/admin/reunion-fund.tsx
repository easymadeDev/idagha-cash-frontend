import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api, { formatNaira } from '../../lib/api';
import { useToast } from '../../components/Toast';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminReunionFund() {
  const { toast } = useToast();
  const { data: fund } = useSWR('/api/reunion-fund', fetcher);
  const { data: breakdown, isLoading: loadingBreakdown } = useSWR('/api/reunion-fund/members', fetcher);
  const { data: stats } = useSWR('/api/stats/summary', fetcher);

  const [tab, setTab] = useState<'tracker' | 'settings'>('tracker');
  const [form, setForm] = useState({ title: '', targetAmount: '', memberTarget: '10000', targetDate: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState<string | null>(null); // member name or 'all'
  const [notifyResult, setNotifyResult] = useState<any>(null);
  const [waNotifying, setWaNotifying] = useState<string | null>(null);
  const [waResult, setWaResult] = useState<any>(null);
  const [waStatus, setWaStatus] = useState<{ ready: boolean; hasQr: boolean } | null>(null);

  useEffect(() => {
    const check = () => {
      fetch('/api/whatsapp/status').then(r => r.json()).then(setWaStatus).catch(() => {});
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (fund) {
      setForm({
        title: fund.title ?? '',
        targetAmount: String(fund.targetAmount ?? 3000000),
        memberTarget: String(fund.memberTarget ?? 10000),
        targetDate: fund.targetDate?.slice(0, 10) ?? '2026-12-31',
        description: fund.description ?? '',
      });
    }
  }, [fund]);

  const saveFund = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put('/reunion-fund', {
        title: form.title,
        targetAmount: Number(form.targetAmount),
        memberTarget: Number(form.memberTarget),
        targetDate: form.targetDate,
        description: form.description,
      });
      mutate('/api/reunion-fund'); mutate('/api/stats/summary');
      toast('Reunion fund settings updated!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to update.', 'error');
    } finally { setSaving(false); }
  };

  const notify = async (memberNames?: string[]) => {
    const key = memberNames ? memberNames[0] : 'all';
    setNotifying(key); setNotifyResult(null);
    try {
      const res = await api.post('/reunion-fund/notify', memberNames ? { memberNames } : {});
      setNotifyResult(res.data);
      if (res.data?.error) {
        toast(res.data.error, 'error');
      } else {
        toast(`Sent ${res.data.sent} email${res.data.sent !== 1 ? 's' : ''}.`, 'success');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to send emails.';
      setNotifyResult({ error: errMsg });
      toast(errMsg, 'error');
    } finally { setNotifying(null); }
  };

  const notifyWhatsapp = async (memberNames?: string[]) => {
    const key = memberNames ? memberNames[0] + '_wa' : 'all_wa';
    setWaNotifying(key); setWaResult(null);
    try {
      const res = await api.post('/reunion-fund/notify-whatsapp', memberNames ? { memberNames } : {});
      setWaResult(res.data);
      if (res.data?.error) {
        toast(res.data.error, 'error');
      } else {
        toast(`WhatsApp: sent ${res.data.sent} message${res.data.sent !== 1 ? 's' : ''}.`, 'success');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to send WhatsApp messages.';
      setWaResult({ error: errMsg });
      toast(errMsg, 'error');
    } finally { setWaNotifying(null); }
  };

  const rf = stats?.reunionFund;
  const members = breakdown?.members || [];
  const completed = members.filter((m: any) => m.completed);
  const incomplete = members.filter((m: any) => !m.completed);
  const memberTarget = breakdown?.memberTarget || 10000;
  const incompleteWithEmail = incomplete.filter((m: any) => m.email);

  return (
    <AdminLayout>
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Reunion Fund</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: 4 }}>Track per-member payments and send email reminders.</p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Per-Member Target', value: formatNaira(memberTarget), color: 'var(--text-1)' },
            { label: 'Total Members', value: members.length, color: 'var(--text-1)' },
            { label: 'Fully Paid', value: completed.length, color: 'var(--green-400)' },
            { label: 'Incomplete', value: incomplete.length, color: 'var(--red)' },
            { label: 'Total Raised', value: rf ? formatNaira(rf.raisedAmount) : '—', color: 'var(--green-400)' },
            { label: 'Overall Progress', value: rf ? `${rf.percentage}%` : '—', color: 'var(--yellow)' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {rf && (
          <div style={{ marginBottom: 28 }}>
            <div className="progress-track" style={{ height: 12 }}>
              <div className="progress-fill" style={{ width: `${rf.percentage}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.78rem', color: 'var(--text-3)' }}>
              <span>Raised: <strong style={{ color: 'var(--green-400)' }}>{formatNaira(rf.raisedAmount)}</strong></span>
              <span>Target: <strong style={{ color: 'var(--text-2)' }}>{formatNaira(rf.targetAmount)}</strong></span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {(['tracker', 'settings'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '9px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.875rem',
              color: tab === t ? 'var(--green-400)' : 'var(--text-3)',
              borderBottom: tab === t ? '2px solid var(--green-400)' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}>
              {t === 'tracker' ? 'Member Payment Tracker' : 'Fund Settings'}
            </button>
          ))}
        </div>

        {/* ── TRACKER TAB ── */}
        {tab === 'tracker' && (
          <div>
            {/* Notify all banner */}
            {incomplete.length > 0 && (
              <div style={{
                marginBottom: 20, padding: '16px 20px',
                background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 3 }}>
                    {incomplete.length} member{incomplete.length !== 1 ? 's' : ''} have not completed their ₦{memberTarget.toLocaleString()} payment
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                    {incompleteWithEmail.length} have email addresses on record
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={notifying === 'all' || incompleteWithEmail.length === 0}
                    onClick={() => notify()}
                  >
                    {notifying === 'all' ? (
                      <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                    ) : (
                      <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" /></svg>
                        Email All ({incompleteWithEmail.length})</>
                    )}
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#25d366', color: '#fff', border: 'none' }}
                    disabled={waNotifying === 'all_wa' || !waStatus?.ready}
                    title={!waStatus?.ready ? 'WhatsApp not connected' : 'Send WhatsApp reminders'}
                    onClick={() => notifyWhatsapp()}
                  >
                    {waNotifying === 'all_wa' ? (
                      <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L0 24l6.336-1.503A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.003-1.368l-.36-.214-3.73.885.916-3.613-.235-.373A9.79 9.79 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                        WhatsApp All
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Notify result */}
            {notifyResult && (
              <div className={`alert ${notifyResult.error ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
                {notifyResult.error
                  ? notifyResult.error
                  : `Sent ${notifyResult.sent} email${notifyResult.sent !== 1 ? 's' : ''}.${notifyResult.noEmail?.length ? ` ${notifyResult.noEmail.length} member(s) have no email: ${notifyResult.noEmail.join(', ')}.` : ''}${notifyResult.failed?.length ? ` Failed: ${notifyResult.failed.join(', ')}.` : ''}`
                }
              </div>
            )}

            {/* WhatsApp result */}
            {waResult && (
              <div className={`alert ${waResult.error ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
                {waResult.error
                  ? waResult.error
                  : `WhatsApp: sent ${waResult.sent} message${waResult.sent !== 1 ? 's' : ''}.${waResult.noWhatsapp?.length ? ` ${waResult.noWhatsapp.length} have no phone: ${waResult.noWhatsapp.join(', ')}.` : ''}${waResult.failed?.length ? ` Failed: ${waResult.failed.join(', ')}.` : ''}`
                }
              </div>
            )}

            {loadingBreakdown ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>Loading member data…</div>
            ) : members.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
                No reunion fund contributions yet. Add contributions with category "Reunion Fund" to see members here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Completed section */}
                {completed.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--green-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                      Completed ({completed.length})
                    </div>
                    {completed.map((m: any) => (
                      <MemberRow key={m.name} m={m} memberTarget={memberTarget} onNotify={notify} notifying={notifying} onNotifyWa={notifyWhatsapp} waNotifying={waNotifying} waReady={!!waStatus?.ready} />
                    ))}
                  </div>
                )}

                {/* Incomplete section */}
                {incomplete.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--red)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, marginTop: completed.length > 0 ? 12 : 0 }}>
                      Incomplete ({incomplete.length})
                    </div>
                    {incomplete.map((m: any) => (
                      <MemberRow key={m.name} m={m} memberTarget={memberTarget} onNotify={notify} notifying={notifying} onNotifyWa={notifyWhatsapp} waNotifying={waNotifying} waReady={!!waStatus?.ready} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="card" style={{ maxWidth: 560 }}>
            <form onSubmit={saveFund}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. IDAGHA 2026 Reunion Fund" />
              </div>

              <div className="rf-settings-grid">
                <div className="form-group">
                  <label className="form-label">Overall Target (₦) *</label>
                  <input className="form-input" type="number" min="0" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Per-Member Target (₦)</label>
                  <input className="form-input" type="number" min="0" value={form.memberTarget} onChange={(e) => setForm({ ...form, memberTarget: e.target.value })} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4, display: 'block' }}>Default: ₦10,000. Part-payment allowed.</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Date</label>
                <input className="form-input" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the purpose…" />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', padding: '13px' }}>
                {saving ? 'Saving…' : 'Update Settings'}
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}

function MemberRow({ m, memberTarget, onNotify, notifying, onNotifyWa, waNotifying, waReady }: any) {
  const [expanded, setExpanded] = useState(false);
  const isNotifying = notifying === m.name;
  const isWaNotifying = waNotifying === m.name + '_wa';

  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(10,26,13,0.7), rgba(6,13,8,0.5))',
      border: `1px solid ${m.completed ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)', marginBottom: 6, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: m.completed ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${m.completed ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.2)'}`,
          fontSize: '0.8rem', fontWeight: 800,
          color: m.completed ? 'var(--green-400)' : 'var(--red)',
        }}>
          {m.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
        </div>

        {/* Name + progress */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.name}</span>
            {m.completed ? (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.12)', color: 'var(--green-400)', border: '1px solid rgba(34,197,94,0.25)' }}>
                PAID IN FULL
              </span>
            ) : (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(248,113,113,0.08)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
                {m.paid > 0 ? 'PART PAID' : 'NOT PAID'}
              </span>
            )}
            {!m.email && !m.completed && (
              <span style={{ fontSize: '0.62rem', color: 'var(--text-3)', padding: '2px 7px', borderRadius: 99, border: '1px solid var(--border)' }}>no email</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${m.percentage}%`, borderRadius: 99, background: m.completed ? 'var(--green-500)' : 'linear-gradient(90deg, var(--red), #fb923c)', transition: 'width 0.6s' }} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: m.completed ? 'var(--green-400)' : 'var(--red)', minWidth: 32 }}>{m.percentage}%</span>
          </div>
        </div>

        {/* Amounts */}
        <div style={{ textAlign: 'right', minWidth: 100 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 2 }}>Paid</div>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, color: 'var(--green-400)', fontSize: '0.95rem' }}>{formatNaira(m.paid)}</div>
          {!m.completed && (
            <div style={{ fontSize: '0.72rem', color: 'var(--red)', marginTop: 2 }}>−{formatNaira(m.remaining)} left</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!m.completed && (
            <>
              <button
                className="btn btn-ghost btn-sm"
                disabled={!m.email || isNotifying}
                title={!m.email ? 'No email on record' : 'Send email reminder'}
                onClick={() => onNotify([m.name])}
                style={{ opacity: !m.email ? 0.4 : 1 }}
              >
                {isNotifying ? (
                  <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" />
                  </svg>
                )}
                Email
              </button>
              <button
                className="btn btn-sm"
                style={{ background: waReady ? '#25d366' : 'rgba(37,211,102,0.2)', color: '#fff', border: 'none', opacity: !waReady ? 0.5 : 1 }}
                disabled={!waReady || isWaNotifying}
                title={!waReady ? 'WhatsApp not connected' : 'Send WhatsApp reminder'}
                onClick={() => onNotifyWa([m.name])}
              >
                {isWaNotifying ? (
                  <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L0 24l6.336-1.503A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.003-1.368l-.36-.214-3.73.885.916-3.613-.235-.373A9.79 9.79 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                )}
                WA
              </button>
            </>
          )}
          {m.payments?.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? '▲' : '▼'} {m.payments.length} payment{m.payments.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Payment history */}
      {expanded && m.payments?.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 18px', background: 'rgba(6,13,8,0.4)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Payment History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {m.payments.map((p: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-3)' }}>
                  Instalment {i + 1} · {new Date(p.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span style={{ color: 'var(--green-400)', fontWeight: 700 }}>{formatNaira(p.amount)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span style={{ color: 'var(--text-2)', fontWeight: 700 }}>Total paid</span>
              <span style={{ color: 'var(--green-400)', fontWeight: 800 }}>{formatNaira(m.paid)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

