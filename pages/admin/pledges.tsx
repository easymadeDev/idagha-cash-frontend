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

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#92400e', bg: 'rgba(251,191,36,0.15)' },
  fulfilled: { label: 'Fulfilled', color: '#15803d', bg: 'rgba(34,197,94,0.15)' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
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

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

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
    if (m) {
      setForm((f) => ({
        ...f,
        memberId: m._id,
        memberName: m.name,
        memberEmail: m.email || '',
        memberPhone: m.whatsapp || m.phone || '',
      }));
    }
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
      setModal(false);
      mutate();
      mutateStats();
    } catch {
      toast('Failed to save reunion support', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFulfill = async () => {
    if (!fulfillId) return;
    setFulfilling(true);
    try {
      await pledgeApi.fulfill(fulfillId);
      toast('Reunion support fulfilled — automatically added to Reunion Fund Wallet', 'success');
      setFulfillId(null);
      mutate();
      mutateStats();
    } catch {
      toast('Failed to fulfill reunion support', 'error');
    } finally {
      setFulfilling(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await pledgeApi.remove(deleteId);
      toast('Reunion support deleted', 'success');
      setDeleteId(null);
      mutate();
      mutateStats();
    } catch {
      toast('Failed to delete reunion support', 'error');
    }
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
    } catch {
      toast('Failed to send reminders', 'error');
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '24px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>Reunion Support</h1>
            <p style={{ color: 'var(--text-3)', margin: '4px 0 0', fontSize: '.9rem' }}>Track and manage member support for the 2026 Reunion Fund</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => openReminderModal()} style={btnOutline}>Send Reminders</button>
            <button onClick={openAdd} style={btnPrimary}>+ Add Support</button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard label="Total Support" value={formatNaira(stats.totalPledged)} color="#a855f7" />
            <StatCard label="Fulfilled" value={formatNaira(stats.totalFulfilled)} color="#22c55e" />
            <StatCard label="Pending" value={formatNaira(stats.totalPending)} color="#fbbf24" />
            <StatCard label="Total Count" value={String(stats.count)} color="#60a5fa" />
            <StatCard label="Fulfilled Count" value={String(stats.fulfilledCount)} color="#22c55e" />
            <StatCard label="Pending Count" value={String(stats.pendingCount)} color="#fbbf24" />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {(['pending', 'fulfilled', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '8px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? '#a855f7' : 'var(--text-3)',
                borderBottom: activeTab === t ? '2px solid #a855f7' : '2px solid transparent',
                fontSize: '.92rem',
                textTransform: 'capitalize',
              }}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              {t !== 'all' && (
                <span style={{ marginLeft: 6, background: t === 'pending' ? 'rgba(251,191,36,0.2)' : 'rgba(34,197,94,0.2)', color: t === 'pending' ? '#92400e' : '#15803d', borderRadius: 99, padding: '1px 8px', fontSize: '.78rem', fontWeight: 700 }}>
                  {list.filter((p) => p.status === t).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>No reunion support records found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  {['Member', 'Amount', 'Status', 'Due Date', 'Added By', 'Note', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((pledge: any) => {
                  const sm = STATUS_META[pledge.status] || STATUS_META.pending;
                  return (
                    <tr key={pledge._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{pledge.memberName}</div>
                        {pledge.memberEmail && <div style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>{pledge.memberEmail}</div>}
                        {pledge.memberPhone && <div style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>{pledge.memberPhone}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#a855f7' }}>{formatNaira(pledge.amount)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: sm.bg, color: sm.color, borderRadius: 99, padding: '4px 12px', fontSize: '.8rem', fontWeight: 700 }}>{sm.label}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2)', fontSize: '.87rem' }}>
                        {pledge.dueDate ? formatDate(pledge.dueDate) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: pledge.addedBy === 'admin' ? 'rgba(96,165,250,0.12)' : 'rgba(168,85,247,0.12)', color: pledge.addedBy === 'admin' ? '#2563eb' : '#7c3aed', borderRadius: 99, padding: '3px 10px', fontSize: '.78rem', fontWeight: 600 }}>
                          {pledge.addedBy === 'admin' ? 'Admin' : 'Self'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-3)', fontSize: '.85rem', maxWidth: 160 }}>{pledge.note || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {pledge.status === 'pending' && (
                            <>
                              <button onClick={() => setFulfillId(pledge._id)} style={btnSmGreen}>Fulfill</button>
                              <button onClick={() => openReminderModal(pledge._id)} style={btnSmOutline}>Remind</button>
                            </>
                          )}
                          <button onClick={() => openEdit(pledge)} style={btnSmOutline}>Edit</button>
                          <button onClick={() => setDeleteId(pledge._id)} style={btnSmRed}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div style={overlay} onClick={() => setModal(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{editing ? 'Edit Reunion Support' : 'Add Reunion Support for Member'}</h2>
              <button onClick={() => setModal(false)} style={closeBtn}>✕</button>
            </div>

            {/* Member selector */}
            {!editing && (
              <div style={fieldWrap}>
                <label style={labelStyle}>Select Member (optional)</label>
                <select style={inputStyle} onChange={handleMemberSelect} defaultValue="">
                  <option value="">— type manually or select —</option>
                  {memberList.map((m: any) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={fieldWrap}>
              <label style={labelStyle}>Member Name *</label>
              <input style={inputStyle} value={form.memberName} onChange={(e) => setForm((f) => ({ ...f, memberName: e.target.value }))} placeholder="Full name" />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={form.memberEmail} onChange={(e) => setForm((f) => ({ ...f, memberEmail: e.target.value }))} placeholder="Email address" />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>WhatsApp / Phone</label>
              <input style={inputStyle} value={form.memberPhone} onChange={(e) => setForm((f) => ({ ...f, memberPhone: e.target.value }))} placeholder="+234..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Support Amount (₦) *</label>
                <input style={inputStyle} type="number" min={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 10000" />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Due Date</label>
                <input style={inputStyle} type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Note</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional note..." />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setModal(false)} style={btnOutline}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Support'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Confirm */}
      {fulfillId && (
        <div style={overlay} onClick={() => setFulfillId(null)}>
          <div style={{ ...modalBox, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Mark as Fulfilled?</h2>
            <p style={{ color: 'var(--text-2)', margin: '0 0 20px' }}>
              This will mark the reunion support as fulfilled and <strong>automatically add the amount as a contribution to the Reunion Fund Wallet</strong>. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setFulfillId(null)} style={btnOutline}>Cancel</button>
              <button onClick={handleFulfill} disabled={fulfilling} style={btnPrimary}>{fulfilling ? 'Marking…' : 'Confirm Fulfill'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={overlay} onClick={() => setDeleteId(null)}>
          <div style={{ ...modalBox, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Delete Reunion Support?</h2>
            <p style={{ color: 'var(--text-2)', margin: '0 0 20px' }}>This reunion support record will be permanently removed.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={btnOutline}>Cancel</button>
              <button onClick={handleDelete} style={{ ...btnPrimary, background: '#dc2626' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {reminderModal && (
        <div style={overlay} onClick={() => setReminderModal(false)}>
          <div style={{ ...modalBox, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Send Reunion Support Reminders</h2>
            <p style={{ color: 'var(--text-2)', margin: '0 0 20px' }}>
              {reminderTargets.length > 0
                ? 'Send a reminder to this member about their pending reunion support via email and WhatsApp.'
                : `Send reminders to all ${pendingList.length} members with pending reunion support via email and WhatsApp.`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setReminderModal(false)} style={btnOutline}>Cancel</button>
              <button onClick={handleSendReminder} disabled={sendingReminder} style={btnPrimary}>
                {sendingReminder ? 'Sending…' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: '.8rem', color: 'var(--text-3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

// ── shared styles ─────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '9px 20px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '.9rem',
};

const btnOutline: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '9px 20px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '.9rem',
};

const btnSmGreen: React.CSSProperties = {
  background: 'rgba(34,197,94,0.12)',
  color: '#15803d',
  border: 'none',
  borderRadius: 6,
  padding: '5px 12px',
  cursor: 'pointer',
  fontSize: '.8rem',
  fontWeight: 600,
};

const btnSmOutline: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '5px 12px',
  cursor: 'pointer',
  fontSize: '.8rem',
  fontWeight: 600,
};

const btnSmRed: React.CSSProperties = {
  background: 'rgba(220,38,38,0.1)',
  color: '#dc2626',
  border: 'none',
  borderRadius: 6,
  padding: '5px 12px',
  cursor: 'pointer',
  fontSize: '.8rem',
  fontWeight: 600,
};

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
};

const modalBox: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(168,85,247,0.2)',
  borderRadius: 14,
  padding: 28,
  width: '100%',
  maxWidth: 560,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
};

const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.1rem',
  cursor: 'pointer',
  color: 'var(--text-3)',
  padding: 4,
};

const fieldWrap: React.CSSProperties = { marginBottom: 14 };

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.82rem',
  fontWeight: 600,
  color: 'var(--text-2)',
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--surface-2)',
  color: 'var(--text-1)',
  fontSize: '.9rem',
  boxSizing: 'border-box',
};
