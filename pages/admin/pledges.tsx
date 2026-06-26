import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR from 'swr';
import api, { pledgeApi, formatNaira, formatDate } from '../../lib/api';
import { useToast } from '../../components/Toast';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const authFetcher = (url: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : ''}`,
    },
  }).then((r) => r.json());

const EMPTY_FORM = {
  memberName: '',
  memberEmail: '',
  memberPhone: '',
  memberId: '',
  amount: '',
  note: '',
  dueDate: '',
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: 'Pending',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)' },
  fulfilled: { label: 'Fulfilled', color: 'var(--green-400)', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)' },
  cancelled: { label: 'Cancelled', color: 'var(--red)',  bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
};

export default function AdminPledges() {
  const { toast } = useToast();
  const { data: pledges, isLoading, mutate } = useSWR(`${BACKEND}/pledges`, authFetcher);
  const { data: stats, mutate: mutateStats } = useSWR(`${BACKEND}/pledges/stats`, authFetcher);
  const { data: members } = useSWR(`${BACKEND}/members/admin/all`, authFetcher);

  const [activeTab, setActiveTab] = useState<'pending' | 'fulfilled' | 'all'>('pending');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fulfillId, setFulfillId] = useState<string | null>(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderTargets, setReminderTargets] = useState<string[]>([]);
  const [sendingReminder, setSendingReminder] = useState(false);

  const list: any[] = Array.isArray(pledges) ? pledges : [];
  const memberList: any[] = Array.isArray(members)
    ? members.filter((m: any) => m.status === 'active').sort((a: any, b: any) => a.name.localeCompare(b.name))
    : [];

  const filtered = activeTab === 'all' ? list : list.filter((p) => p.status === activeTab);
  const pendingList = list.filter((p) => p.status === 'pending');

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };

  const openEdit = (pledge: any) => {
    setEditing(pledge);
    setForm({
      memberName: pledge.memberName,
      memberEmail: pledge.memberEmail || '',
      memberPhone: pledge.memberPhone || '',
      memberId: pledge.memberId || '',
      amount: String(pledge.amount),
      note: pledge.note || '',
      dueDate: pledge.dueDate ? pledge.dueDate.slice(0, 10) : '',
    });
    setModal(true);
  };

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = memberList.find((m: any) => m._id === e.target.value);
    if (m) setForm((f) => ({ ...f, memberId: m._id, memberName: m.name, memberEmail: m.email || '', memberPhone: m.whatsapp || m.phone || '' }));
  };

  const handleSave = async () => {
    if (!form.memberName.trim()) return toast('Member name is required', 'error');
    if (!form.amount || Number(form.amount) < 1) return toast('Enter a valid amount', 'error');
    setSaving(true);
    try {
      const payload = {
        memberName: form.memberName.trim(),
        memberEmail: form.memberEmail.trim(),
        memberPhone: form.memberPhone.trim(),
        memberId: form.memberId || undefined,
        amount: Number(form.amount),
        note: form.note.trim(),
        dueDate: form.dueDate || undefined,
      };
      if (editing) {
        await pledgeApi.update(editing._id, payload);
        toast('Reunion support updated', 'success');
      } else {
        await pledgeApi.adminCreate(payload);
        toast('Reunion support added — member notified', 'success');
      }
      setModal(false); mutate(); mutateStats();
    } catch { toast('Failed to save reunion support', 'error'); }
    finally { setSaving(false); }
  };

  const handleFulfill = async () => {
    if (!fulfillId) return;
    setFulfilling(true);
    try {
      await pledgeApi.fulfill(fulfillId);
      toast('Marked fulfilled — added to Reunion Fund Wallet', 'success');
      setFulfillId(null); mutate(); mutateStats();
    } catch { toast('Failed to fulfill reunion support', 'error'); }
    finally { setFulfilling(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await pledgeApi.remove(deleteId);
      toast('Reunion support deleted', 'success');
      setDeleteId(null); mutate(); mutateStats();
    } catch { toast('Failed to delete reunion support', 'error'); }
  };

  const openReminderModal = (pledgeId?: string) => {
    setReminderTargets(pledgeId ? [pledgeId] : []);
    setReminderModal(true);
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const res = await pledgeApi.sendReminders(reminderTargets.length > 0 ? reminderTargets : undefined);
      const { sent, failed, noContact } = res.data;
      toast(`Reminders sent: ${sent}${failed.length ? `, failed: ${failed.length}` : ''}${noContact.length ? `, no contact: ${noContact.length}` : ''}`, 'success');
      setReminderModal(false);
    } catch { toast('Failed to send reminders', 'error'); }
    finally { setSendingReminder(false); }
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(1.3rem,4vw,1.6rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Reunion Support</h1>
            <p style={{ color: 'var(--text-3)', margin: '4px 0 0', fontSize: '0.82rem' }}>Track member support for the 2026 Reunion Fund</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openReminderModal()}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Reminders
            </button>
            <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none' }} onClick={openAdd}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round"/></svg>
              Add Support
            </button>
          </div>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="pledges-stats-grid">
            <StatCard label="Total Support" value={formatNaira(stats.totalPledged)} color="#a855f7" />
            <StatCard label="Fulfilled" value={formatNaira(stats.totalFulfilled)} color="var(--green-400)" />
            <StatCard label="Pending" value={formatNaira(stats.totalPending)} color="#fbbf24" />
            <StatCard label="Count" value={String(stats.count)} color="var(--blue)" />
            <StatCard label="Fulfilled" value={String(stats.fulfilledCount)} color="var(--green-400)" sub="records" />
            <StatCard label="Pending" value={String(stats.pendingCount)} color="#fbbf24" sub="records" />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
          {(['pending', 'fulfilled', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="pledge-tab"
              style={{ color: activeTab === t ? '#a855f7' : 'var(--text-3)', borderBottom: activeTab === t ? '2px solid #a855f7' : '2px solid transparent', fontWeight: activeTab === t ? 700 : 400 }}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              {t !== 'all' && (
                <span style={{ marginLeft: 5, background: t === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(34,197,94,0.15)', color: t === 'pending' ? '#fbbf24' : 'var(--green-400)', borderRadius: 99, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {list.filter((p) => p.status === t).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Cards list */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-3)' }}>
            No reunion support records found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((pledge: any) => {
              const sm = STATUS_META[pledge.status] || STATUS_META.pending;
              return (
                <div key={pledge._id} className="pledge-card">
                  {/* Top row: name + amount + status */}
                  <div className="pledge-card-top">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pledge.memberName}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {pledge.memberPhone && <span>{pledge.memberPhone}</span>}
                        {pledge.memberEmail && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{pledge.memberEmail}</span>}
                        {pledge.dueDate && <span>Due: {formatDate(pledge.dueDate)}</span>}
                      </div>
                      {pledge.note && (
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Note: {pledge.note}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#a855f7' }}>{formatNaira(pledge.amount)}</div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                          {sm.label}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: pledge.addedBy === 'admin' ? 'rgba(96,165,250,0.1)' : 'rgba(168,85,247,0.1)', color: pledge.addedBy === 'admin' ? 'var(--blue)' : '#c084fc', border: '1px solid var(--border)' }}>
                          {pledge.addedBy === 'admin' ? 'Admin' : 'Self'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pledge-card-actions">
                    {pledge.status === 'pending' && (
                      <>
                        <button className="pa-btn pa-green" onClick={() => setFulfillId(pledge._id)}>
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Fulfill
                        </button>
                        <button className="pa-btn pa-ghost" onClick={() => openReminderModal(pledge._id)}>
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Remind
                        </button>
                      </>
                    )}
                    <button className="pa-btn pa-ghost" onClick={() => openEdit(pledge)}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Edit
                    </button>
                    <button className="pa-btn pa-red" onClick={() => setDeleteId(pledge._id)}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'right' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{editing ? 'Edit Reunion Support' : 'Add Reunion Support'}</p>

            {!editing && (
              <div className="form-group">
                <label className="form-label">Select Member (optional)</label>
                <select className="form-select" onChange={handleMemberSelect} defaultValue="">
                  <option value="">— type manually or select —</option>
                  {memberList.map((m: any) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Member Name *</label>
              <input className="form-input" value={form.memberName} onChange={(e) => setForm((f) => ({ ...f, memberName: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.memberEmail} onChange={(e) => setForm((f) => ({ ...f, memberEmail: e.target.value }))} placeholder="Email address" />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp / Phone</label>
              <input className="form-input" value={form.memberPhone} onChange={(e) => setForm((f) => ({ ...f, memberPhone: e.target.value }))} placeholder="+234..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Amount (₦) *</label>
                <input className="form-input" type="number" min={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 10000" />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea className="form-textarea" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional note…" rows={3} />
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Support'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Confirm */}
      {fulfillId && (
        <div className="modal-overlay" onClick={() => setFulfillId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Mark as Fulfilled?</p>
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>
              This will mark the support as fulfilled and <strong style={{ color: 'var(--text-1)' }}>automatically add the amount to the Reunion Fund Wallet</strong>. Cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setFulfillId(null)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none' }} onClick={handleFulfill} disabled={fulfilling}>
                {fulfilling ? 'Marking…' : 'Confirm Fulfill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Delete Support Record?</p>
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>This reunion support record will be permanently removed.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {reminderModal && (
        <div className="modal-overlay" onClick={() => setReminderModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Send Reminders</p>
            <p style={{ color: 'var(--text-3)', marginBottom: 20, fontSize: '0.9rem' }}>
              {reminderTargets.length > 0
                ? 'Send a reminder to this member about their pending reunion support via email and WhatsApp.'
                : `Send reminders to all ${pendingList.length} members with pending reunion support via email and WhatsApp.`}
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setReminderModal(false)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none' }} onClick={handleSendReminder} disabled={sendingReminder}>
                {sendingReminder ? 'Sending…' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pledges-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }
        .pledge-tab {
          padding: 8px 16px; border: none; background: none;
          cursor: pointer; font-size: 0.88rem;
          font-family: var(--font); transition: color 0.15s;
          white-space: nowrap;
        }
        .pledge-card {
          background: var(--grad-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .pledge-card:hover { border-color: var(--border-mid); }
        .pledge-card-top {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 14px 14px 10px;
        }
        .pledge-card-actions {
          display: flex; gap: 5px; align-items: center;
          padding: 9px 12px;
          border-top: 1px solid var(--border);
          background: rgba(6,13,8,0.4);
        }
        .pa-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 5px 10px; border-radius: 6px; font-size: 0.73rem; font-weight: 600;
          cursor: pointer; border: 1px solid transparent; transition: all 0.15s;
          font-family: var(--font); white-space: nowrap;
        }
        .pa-btn:last-child { margin-left: auto; }
        .pa-green  { background: rgba(34,197,94,0.1); color: var(--green-400); border-color: rgba(34,197,94,0.25); }
        .pa-green:hover { background: rgba(34,197,94,0.18); }
        .pa-ghost  { background: rgba(255,255,255,0.04); color: var(--text-2); border-color: var(--border); }
        .pa-ghost:hover { background: rgba(255,255,255,0.08); color: var(--text-1); }
        .pa-red    { width: 28px; padding: 5px; background: rgba(248,113,113,0.08); color: var(--red); border-color: rgba(248,113,113,0.2); border-radius: 6px; justify-content: center; }
        .pa-red:hover { background: rgba(248,113,113,0.18); }

        @media (max-width: 640px) {
          .pledges-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .pledge-tab { padding: 7px 12px; font-size: 0.82rem; }
        }
        @media (max-width: 380px) {
          .pledges-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
          .pledge-card-top { padding: 11px 11px 8px; gap: 9px; }
          .pledge-card-actions { padding: 7px 9px; gap: 4px; }
          .pa-btn { font-size: 0.68rem; padding: 4px 8px; }
        }
      `}</style>
    </AdminLayout>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--grad-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 3, display: 'flex', gap: 4, alignItems: 'baseline' }}>
        {label} {sub && <span style={{ fontSize: '0.65rem' }}>{sub}</span>}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color, fontFamily: 'var(--font-d)', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}
