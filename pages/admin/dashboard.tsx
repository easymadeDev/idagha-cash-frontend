import AdminLayout from '../../components/AdminLayout';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { formatNaira, formatDate } from '../../lib/api';
import { useState } from 'react';

const authedFetcher = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : ''}` } }).then((r) => r.json());

function QuickAction({ label, desc, color, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--bg-card2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '18px 20px',
      cursor: 'pointer', transition: 'all 0.2s var(--ease)',
      textAlign: 'left', fontFamily: 'var(--font)',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{desc}</div>
    </button>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: stats } = useSWR('/api/stats/summary', authedFetcher);
  const { data: contributions } = useSWR('/api/contributions', authedFetcher);
  const { data: expenses } = useSWR('/api/expenses', authedFetcher);
  const [testingBirthday, setTestingBirthday] = useState(false);
  const [birthdayResult, setBirthdayResult] = useState('');
  const [testingReunion, setTestingReunion] = useState(false);
  const [reunionResult, setReunionResult] = useState('');

  const recentContribs = Array.isArray(contributions) ? contributions.slice(0, 6) : [];
  const recentExpenses = Array.isArray(expenses) ? expenses.slice(0, 5) : [];

  const testBirthday = async () => {
    setTestingBirthday(true);
    try {
      const res = await fetch('/api/members/birthday/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('idagha_token') || ''}` },
      });
      const data = await res.json();
      setBirthdayResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setBirthdayResult(`Error: ${err.message}`);
    }
    setTestingBirthday(false);
  };

  const testReunionReminder = async () => {
    setTestingReunion(true);
    try {
      const res = await fetch('/api/reunion-fund/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('idagha_token') || ''}`
        },
        body: JSON.stringify({ memberNames: ['udoh'] }),
      });
      const data = await res.json();
      setReunionResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setReunionResult(`Error: ${err.message}`);
    }
    setTestingReunion(false);
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>
            Welcome back. Here&apos;s a complete overview of the group&apos;s finances.
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {[
            { label: 'Wallet Balance', val: stats ? formatNaira(stats.walletBalance) : '—', color: 'green', sub: 'Available funds' },
            { label: 'Total Contributions', val: stats ? formatNaira(stats.totalContributions) : '—', color: '', sub: 'All time' },
            { label: 'Total Expenses', val: stats ? formatNaira(stats.totalExpenses) : '—', color: 'red', sub: 'All time' },
            { label: 'Reunion Fund', val: stats ? `${stats.reunionFund?.percentage ?? 0}%` : '—', color: 'yellow', sub: stats ? formatNaira(stats.reunionFund?.raisedAmount ?? 0) + ' raised' : '' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.color}`}>{s.val}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: 32 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <QuickAction label="Add Contribution" desc="Record a new payment" color="var(--green-400)" onClick={() => router.push('/admin/contributions')} />
            <QuickAction label="Add Expense" desc="Log a group expense" color="var(--red)" onClick={() => router.push('/admin/expenses')} />
            <QuickAction label="Add Member" desc="Register a new member" color="var(--blue)" onClick={() => router.push('/admin/members')} />
            <QuickAction label="Update Reunion Fund" desc="Edit fund target/amount" color="var(--yellow)" onClick={() => router.push('/admin/reunion-fund')} />
            <QuickAction label="Post Announcement" desc="Notify group members" color="var(--blue)" onClick={() => router.push('/admin/announcements')} />
            <QuickAction label="Test Birthday" desc={testingBirthday ? "Testing..." : "Send birthday wishes now"} color="var(--purple)" onClick={testBirthday} />
            <QuickAction label="Test Reunion Reminder" desc={testingReunion ? "Testing..." : "Send reminder to udoh"} color="var(--yellow)" onClick={testReunionReminder} />
          </div>
        </div>

        {birthdayResult && (
          <div style={{ marginBottom: 32, padding: 16, background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>Birthday Test Result:</div>
            <pre style={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px', color: 'var(--text-3)' }}>{birthdayResult}</pre>
          </div>
        )}

        {reunionResult && (
          <div style={{ marginBottom: 32, padding: 16, background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>Reunion Reminder Test Result:</div>
            <pre style={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px', color: 'var(--text-3)' }}>{reunionResult}</pre>
          </div>
        )}

        {/* Recent activity */}
        <div className="admin-dash-grid">
          {/* Recent contributions */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="section-title">Recent Contributions</div>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/admin/contributions')}>Manage</button>
            </div>
            {recentContribs.length === 0
              ? <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', padding: '20px 0', textAlign: 'center' }}>No contributions yet.</p>
              : recentContribs.map((c: any, i: number) => (
                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < recentContribs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{c.contributorName}</p>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 2 }}>{formatDate(c.date)}</p>
                  </div>
                  <span style={{ color: 'var(--green-400)', fontWeight: 800, fontFamily: 'var(--font-d)', fontSize: '0.95rem' }}>{formatNaira(c.amount)}</span>
                </div>
              ))
            }
          </div>

          {/* Recent expenses */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="section-title">Recent Expenses</div>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/admin/expenses')}>Manage</button>
            </div>
            {recentExpenses.length === 0
              ? <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', padding: '20px 0', textAlign: 'center' }}>No expenses yet.</p>
              : recentExpenses.map((e: any, i: number) => (
                <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < recentExpenses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{e.title}</p>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 2 }}>{formatDate(e.date)}</p>
                  </div>
                  <span style={{ color: 'var(--red)', fontWeight: 800, fontFamily: 'var(--font-d)', fontSize: '0.95rem' }}>{formatNaira(e.amount)}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
