import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import useSWR from 'swr';
import { pledgeApi, formatNaira, formatDate } from '../lib/api';
import { useToast } from '../components/Toast';
import { useGate } from '../lib/gate';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fetcher = (url: string) => fetch(url).then((r) => r.json());

const EMPTY = {
  memberName: '',
  memberEmail: '',
  memberPhone: '',
  amount: '',
  note: '',
  dueDate: '',
};

export default function PledgesPage() {
  const { toast } = useToast();
  const { member } = useGate();
  const { data: pledges, isLoading, mutate } = useSWR(`${BACKEND}/pledges`, fetcher);
  const { data: stats, mutate: mutateStats } = useSWR(`${BACKEND}/pledges/stats`, fetcher);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Auto-fill form from member session + profile
  useEffect(() => {
    if (!member) return;
    const memberToken = typeof window !== 'undefined' ? sessionStorage.getItem('idagha_member_token') || '' : '';
    fetch(`${BACKEND}/members/${member._id}/profile`, {
      headers: { 'x-member-token': memberToken },
    })
      .then((r) => r.json())
      .then((data) => {
        setForm((f) => ({
          ...f,
          memberName: member.name || '',
          memberEmail: data.email || '',
          memberPhone: data.whatsapp || data.phone || '',
        }));
      })
      .catch(() => {
        setForm((f) => ({ ...f, memberName: member.name || '' }));
      });
  }, [member]);

  const list: any[] = Array.isArray(pledges) ? pledges : [];
  const pendingList = list.filter((p) => p.status === 'pending');
  const fulfilledList = list.filter((p) => p.status === 'fulfilled');

  const handleSubmit = async () => {
    if (!form.memberName.trim()) return toast('Please enter your name', 'error');
    if (!form.amount || Number(form.amount) < 1) return toast('Please enter a valid amount', 'error');
    if (!agreed) return toast('Please confirm your support commitment', 'error');

    setSaving(true);
    try {
      await pledgeApi.create({
        memberName: form.memberName.trim(),
        memberEmail: form.memberEmail.trim() || undefined,
        memberPhone: form.memberPhone.trim() || undefined,
        amount: Number(form.amount),
        note: form.note.trim() || undefined,
        dueDate: form.dueDate || undefined,
      });
      toast('Your support has been recorded! You will receive a confirmation.', 'success');
      setForm(EMPTY);
      setAgreed(false);
      setModal(false);
      mutate();
      mutateStats();
    } catch {
      toast('Failed to submit support. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
          borderRadius: 16,
          padding: '36px 32px',
          marginBottom: 32,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.5 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>🤝</div>
            <h1 style={{ color: '#fff', fontSize: '1.7rem', fontWeight: 800, margin: '0 0 8px' }}>Reunion Support</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 24px', fontSize: '.95rem' }}>
              Commit to supporting the 2026 Reunion Fund. Your support will be recorded and fulfilled when payment is confirmed.
            </p>
            <button onClick={() => setModal(true)} style={{
              background: '#fff',
              color: '#7c3aed',
              border: 'none',
              borderRadius: 10,
              padding: '12px 28px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}>
              Make a Support
            </button>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 32 }}>
            <PledgeStat label="Total Support" value={formatNaira(stats.totalPledged)} color="#a855f7" />
            <PledgeStat label="Fulfilled" value={formatNaira(stats.totalFulfilled)} color="#22c55e" />
            <PledgeStat label="Pending" value={formatNaira(stats.totalPending)} color="#fbbf24" />
            <PledgeStat label="Members" value={String(stats.count)} color="#60a5fa" />
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>Loading support records…</div>
        ) : (
          <>
            {/* Fulfilled pledges */}
            {fulfilledList.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Fulfilled Support ({fulfilledList.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
                  {fulfilledList.map((p: any) => <PledgeCard key={p._id} pledge={p} />)}
                </div>
              </section>
            )}

            {/* Pending pledges */}
            <section>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                Pending Support ({pendingList.length})
              </h2>
              {pendingList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-3)', fontSize: '.9rem' }}>
                  No pending support yet. Be the first to make a support!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
                  {pendingList.map((p: any) => <PledgeCard key={p._id} pledge={p} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Pledge Modal */}
      {modal && (
        <div style={overlay} onClick={() => setModal(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f9fafb' }}>Make a Reunion Support</h2>
              <button onClick={() => setModal(false)} style={closeBtn}>✕</button>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '.88rem', margin: '0 0 20px' }}>
              Your reunion support is a commitment to contribute to the 2026 Reunion Fund. Once your payment is received, the admin will mark it as fulfilled and it moves to the Reunion Fund automatically.
            </p>

            {/* Member identity — always from session, never re-entered */}
            <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
              <div style={{ fontSize: '.75rem', color: '#a855f7', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Supporting as</div>
              <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: '.95rem' }}>{form.memberName}</div>
              {form.memberEmail && <div style={{ fontSize: '.8rem', color: '#9ca3af', marginTop: 2 }}>{form.memberEmail}</div>}
              {form.memberPhone && <div style={{ fontSize: '.8rem', color: '#9ca3af' }}>{form.memberPhone}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={fw}>
                <label style={lbl}>Support Amount (₦) *</label>
                <input style={inp} type="number" min={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 10000" />
              </div>
              <div style={fw}>
                <label style={lbl}>Pay by (optional)</label>
                <input style={inp} type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div style={fw}>
              <label style={lbl}>Message (optional)</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 64 }} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Any message for the committee..." />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: '4px 0 20px' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3, accentColor: '#7c3aed' }} />
              <span style={{ fontSize: '.85rem', color: '#d1d5db', lineHeight: 1.5 }}>
                I commit to fulfil this support for the 2026 IDAGHA Reunion Fund and understand the admin will follow up for payment.
              </span>
            </label>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={btnOutline}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} style={btnPrimary}>
                {saving ? 'Submitting…' : 'Submit Support'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function PledgeCard({ pledge }: { pledge: any }) {
  const isFulfilled = pledge.status === 'fulfilled';
  return (
    <div style={{
      background: 'linear-gradient(160deg,#0a1a0d,#060d08)',
      border: `1px solid ${isFulfilled ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.2)'}`,
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: isFulfilled ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.15)',
            color: isFulfilled ? '#22c55e' : '#a855f7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.8rem', fontWeight: 800,
          }}>
            {pledge.memberName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-1)' }}>{pledge.memberName}</div>
            <div style={{ fontSize: '.73rem', color: 'var(--text-3)', marginTop: 1 }}>
              {formatDate(pledge.createdAt)}
            </div>
          </div>
        </div>
        <span style={{
          background: isFulfilled ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
          color: isFulfilled ? '#22c55e' : '#fbbf24',
          borderRadius: 99, padding: '3px 10px', fontSize: '.75rem', fontWeight: 700,
        }}>
          {isFulfilled ? 'Fulfilled' : 'Pending'}
        </span>
      </div>

      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isFulfilled ? '#22c55e' : '#a855f7', marginBottom: 6 }}>
        {formatNaira(pledge.amount)}
      </div>

      {pledge.dueDate && (
        <div style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>
          Due: {formatDate(pledge.dueDate)}
        </div>
      )}
      {pledge.note && (
        <div style={{ fontSize: '.8rem', color: 'var(--text-3)', marginTop: 6, fontStyle: 'italic' }}>
          "{pledge.note}"
        </div>
      )}
      {isFulfilled && pledge.fulfilledAt && (
        <div style={{ fontSize: '.76rem', color: '#22c55e', marginTop: 6 }}>
          Fulfilled {formatDate(pledge.fulfilledAt)}
        </div>
      )}
    </div>
  );
}

function PledgeStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg,#0a1a0d,#060d08)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 18px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '.78rem', color: 'var(--text-3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

// ── shared styles ─────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16,
  backdropFilter: 'blur(4px)',
};

const modalBox: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(168,85,247,0.25)',
  borderRadius: 14, padding: 28,
  width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
};

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--text-3)', padding: 4,
};

const fw: React.CSSProperties = { marginBottom: 14 };

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#d1d5db', marginBottom: 5,
};

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, background: '#1f2937', color: '#f9fafb',
  fontSize: '.9rem', boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff',
  border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer',
  fontWeight: 600, fontSize: '.9rem',
};

const btnOutline: React.CSSProperties = {
  background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '.9rem',
};
