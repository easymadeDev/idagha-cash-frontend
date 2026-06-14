import Layout from '../components/Layout';
import useSWR from 'swr';
import { formatNaira, formatDate } from '../lib/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function MemberPaymentCard({ member, memberTarget, index }: { member: any; memberTarget: number; index: number }) {
  const pct = member.percentage;
  const colors = [
    'var(--green-400)', 'var(--blue)', 'var(--yellow)',
    '#c4b5fd', '#fb923c', '#22d3ee', '#f472b6',
  ];
  const color = colors[index % colors.length];

  return (
    <div style={{
      background: 'linear-gradient(160deg, #0a1a0d, #060d08)',
      border: `1px solid ${member.completed ? 'rgba(34,197,94,0.35)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)', padding: '18px 20px',
      transition: 'all 0.25s var(--ease)',
      animation: 'fadeUp 0.5s var(--ease) both',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-mid)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = member.completed ? 'rgba(34,197,94,0.35)' : 'var(--border)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `${color}22`, color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 800,
          }}>
            {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{member.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
              {member.payments.length} payment{member.payments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {member.completed ? (
            <span className="badge badge-green">
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Complete
            </span>
          ) : (
            <span className="badge badge-yellow">
              ₦{(memberTarget - member.paid).toLocaleString()} left
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${pct}%`,
            background: member.completed
              ? 'linear-gradient(90deg, var(--green-600), var(--green-400))'
              : `linear-gradient(90deg, ${color}88, ${color})`,
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 8px ${color}55`,
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-3)' }}>
        <span style={{ color: member.completed ? 'var(--green-400)' : color, fontWeight: 700 }}>
          {formatNaira(member.paid)} paid
        </span>
        <span>{pct}% of {formatNaira(memberTarget)}</span>
      </div>
    </div>
  );
}

export default function ReunionFundPage() {
  const { data: fund } = useSWR('/api/reunion-fund', fetcher);
  const { data: stats } = useSWR('/api/stats/summary', fetcher);
  const { data: breakdown } = useSWR('/api/reunion-fund/members', fetcher);

  const rf = stats?.reunionFund;
  const pct = rf?.percentage ?? 0;
  const memberTarget = fund?.memberTarget ?? 10000;
  const totalExpected = fund?.totalMembers ?? 0;
  const members = breakdown?.members ?? [];
  const completedCount = breakdown?.completedCount ?? 0;
  const paidCount = breakdown?.totalMembers ?? 0;

  const milestones = [
    { pct: 25, label: '25%' },
    { pct: 50, label: '50%' },
    { pct: 75, label: '75%' },
    { pct: 100, label: '100%' },
  ];

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <span className="badge badge-yellow"><span className="badge-dot" />Active Campaign</span>
            <span className="badge badge-green">2026</span>
          </div>
          <h1>{fund?.title || 'Idagha 2026 Reunion Fund'}</h1>
          <p>{fund?.description || 'Each member contributes ₦10,000. Part-payment is allowed — pay any amount at any time until your ₦10,000 is complete.'}</p>
        </div>

        {/* Main progress card */}
        <div className="rf-progress-card">
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12), transparent)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 32, position: 'relative' }}>
            <div>
              <p style={{ color: 'var(--text-3)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Total Fundraising Goal</p>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
                {rf ? formatNaira(rf.targetAmount) : '₦3,000,000'}
              </div>
              {fund?.targetDate && (
                <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 8 }}>
                  Target date: <strong style={{ color: 'var(--text-2)' }}>{formatDate(fund.targetDate)}</strong>
                </p>
              )}
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-green">₦{memberTarget.toLocaleString()} per member</span>
                <span className="badge badge-blue">Part-payment allowed</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-d)', fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                fontWeight: 900, letterSpacing: '-0.04em',
                color: pct >= 100 ? 'var(--green-400)' : pct >= 75 ? '#a3e635' : 'var(--yellow)',
                lineHeight: 1,
              }}>
                {pct}<span style={{ fontSize: '40%', opacity: 0.7 }}>%</span>
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 6 }}>funded</div>
            </div>
          </div>

          <div className="progress-track" style={{ height: 18, marginBottom: 20 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="rf-stats-grid">
            {[
              { label: 'Raised', val: rf ? formatNaira(rf.raisedAmount) : '₦0', color: 'var(--green-400)' },
              { label: 'Remaining', val: rf ? formatNaira(rf.remaining) : '₦3,000,000', color: 'var(--yellow)' },
              { label: 'Completed', val: `${completedCount} members`, color: 'var(--green-400)' },
              { label: 'Contributing', val: `${paidCount} members`, color: 'var(--blue)' },
            ].map((item) => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-member how-it-works banner */}
        <div className="rf-how-banner">
          {[
            { icon: '₦', title: '₦10,000 per member', desc: 'Each registered member is expected to contribute ₦10,000 toward the 2026 reunion.' },
            { icon: '↗', title: 'Pay any amount', desc: 'You can pay in installments — any amount at any time. Your balance updates instantly.' },
            { icon: '✓', title: 'Fully transparent', desc: 'Every payment is publicly recorded. Everyone can see who has paid and how much.' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, minWidth: 180, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--green-400)', fontWeight: 900, fontSize: '0.9rem' }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: '0.79rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Per-member payment tracker */}
        {members.length > 0 && (
          <div className="card" style={{ marginBottom: 28 }}>
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div>
                <div className="section-title">Member Payment Tracker</div>
                <div className="section-sub">
                  {completedCount} fully paid · {paidCount - completedCount} part-paid
                  {totalExpected > 0 ? ` · ${totalExpected - paidCount} yet to contribute` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-green">{completedCount} complete</span>
                <span className="badge badge-yellow">{paidCount - completedCount} ongoing</span>
              </div>
            </div>

            {/* Member completion overview bar */}
            {totalExpected > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 6 }}>
                  <span>Group completion</span>
                  <span>{Math.round((completedCount / totalExpected) * 100)}% of members fully paid</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${Math.min(100, Math.round((completedCount / totalExpected) * 100))}%`,
                    background: 'linear-gradient(90deg, var(--green-700), var(--green-400))',
                  }} />
                </div>
              </div>
            )}

            <div className="rf-member-grid">
              {members.map((m: any, i: number) => (
                <MemberPaymentCard key={m.name} member={m} memberTarget={memberTarget} index={i} />
              ))}
            </div>

            <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-3)', textAlign: 'center' }}>
              Only contributions with category <strong style={{ color: 'var(--text-2)' }}>"reunion-fund"</strong> are counted here. Contact the Secretary to make a payment.
            </p>
          </div>
        )}

        {/* Milestones */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="section-header">
            <div>
              <div className="section-title">Fund Milestones</div>
              <div className="section-sub">Overall campaign progress checkpoints</div>
            </div>
          </div>
          <div className="milestone-grid">
            {milestones.map((m) => {
              const reached = pct >= m.pct;
              return (
                <div key={m.pct} className={`milestone-card ${reached ? 'reached' : ''}`}>
                  <div className="milestone-pct">{m.label}</div>
                  <div className="milestone-amount">{rf ? formatNaira((rf.targetAmount * m.pct) / 100) : `₦${((3000000 * m.pct) / 100).toLocaleString()}`}</div>
                  {reached && (
                    <div style={{ marginTop: 10 }}>
                      <span className="badge badge-green">
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Reached
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 20 }}>How the Reunion Fund Works</div>
          <div className="rf-steps-grid">
            {[
              { num: '01', title: 'Each member: ₦10,000', desc: 'Every registered member contributes ₦10,000 total. You can spread this across multiple payments — no fixed installment size.' },
              { num: '02', title: 'Pay any amount, any time', desc: 'Pay ₦500, ₦2,000, ₦5,000 — whatever you can. Your running balance is tracked until you hit ₦10,000.' },
              { num: '03', title: 'Secretary records payments', desc: 'When you pay, inform the Secretary. Every payment is logged with category "reunion-fund" and shows on this page.' },
              { num: '04', title: 'Fully transparent', desc: 'All contributions are visible publicly. Funds are used exclusively for the 2026 reunion. Expenses are documented here.' },
            ].map((item) => (
              <div key={item.num} style={{ display: 'flex', gap: 14 }}>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--border-bright)', lineHeight: 1, flexShrink: 0 }}>{item.num}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6, color: 'var(--text-1)' }}>{item.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
