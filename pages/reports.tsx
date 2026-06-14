import Layout from '../components/Layout';
import useSWR from 'swr';
import { formatNaira } from '../lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)',
      borderRadius: 10, padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: 'var(--text-3)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>{p.name}:</span>
          <span style={{ color: p.color, fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-d)' }}>{formatNaira(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { data: monthly } = useSWR('/api/stats/monthly', fetcher);
  const { data: stats } = useSWR('/api/stats/summary', fetcher);
  const monthlyList = Array.isArray(monthly) ? monthly : [];

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-');
    return new Date(Number(y), Number(mo) - 1).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
  };

  const chartData = monthlyList.map((m: any) => ({
    month: formatMonth(m.month),
    Contributions: m.contributions,
    Expenses: m.expenses,
    Net: m.net,
  }));

  return (
    <Layout>
      <div className="container">
        <div className="page-header">
          <div style={{ marginBottom: 14 }}>
            <span className="badge badge-blue"><span className="badge-dot" />Live Analytics</span>
          </div>
          <h1>Financial Reports</h1>
          <p>Monthly summaries, trends and financial statistics generated from live data.</p>
        </div>

        {/* Summary */}
        <div className="stats-grid" style={{ marginBottom: 40 }}>
          <div className="stat-card">
            <div className="stat-card-label">Total Contributions</div>
            <div className="stat-card-value green">{stats ? formatNaira(stats.totalContributions) : '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Total Expenses</div>
            <div className="stat-card-value red">{stats ? formatNaira(stats.totalExpenses) : '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Net Balance</div>
            <div className={`stat-card-value ${(stats?.walletBalance ?? 0) >= 0 ? 'green' : 'red'}`}>
              {stats ? formatNaira(stats.walletBalance) : '—'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Reunion Progress</div>
            <div className="stat-card-value yellow">{stats?.reunionFund?.percentage ?? 0}%</div>
            <div className="stat-card-sub">of ₦3M target</div>
          </div>
        </div>

        {/* Area chart */}
        <div className="card" style={{ marginBottom: 24, padding: '28px 28px 20px' }}>
          <div className="section-header" style={{ marginBottom: 28 }}>
            <div>
              <div className="section-title">Income vs Expenses Over Time</div>
              <div className="section-sub">Monthly financial flow</div>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.9rem' }}>
              No data yet — add contributions and expenses to see charts.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 20, fontSize: '0.82rem', color: '#64748b' }}/>
                <Area type="monotone" dataKey="Contributions" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradGreen)" dot={false} activeDot={{ r: 5, fill: '#22c55e', strokeWidth: 0 }}/>
                <Area type="monotone" dataKey="Expenses" stroke="#f87171" strokeWidth={2.5} fill="url(#gradRed)" dot={false} activeDot={{ r: 5, fill: '#f87171', strokeWidth: 0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ marginBottom: 24, padding: '28px 28px 20px' }}>
            <div className="section-header" style={{ marginBottom: 28 }}>
              <div>
                <div className="section-title">Monthly Net Balance</div>
                <div className="section-sub">Contributions minus expenses per month</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="Net" fill="#16a34a" radius={[6, 6, 0, 0]}
                  label={false}
                  // negative bars red
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly table */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 20 }}>Monthly Breakdown</div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
            <table>
              <thead>
                <tr><th>Month</th><th>Contributions</th><th>Expenses</th><th>Net</th></tr>
              </thead>
              <tbody>
                {monthlyList.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No data yet.</td></tr>
                ) : (
                  [...monthlyList].reverse().map((m: any) => (
                    <tr key={m.month}>
                      <td style={{ fontWeight: 700 }}>{formatMonth(m.month)}</td>
                      <td><span style={{ color: 'var(--green-400)', fontWeight: 800, fontFamily: 'var(--font-d)' }}>{formatNaira(m.contributions)}</span></td>
                      <td><span style={{ color: 'var(--red)', fontWeight: 800, fontFamily: 'var(--font-d)' }}>{formatNaira(m.expenses)}</span></td>
                      <td><span style={{ color: m.net >= 0 ? 'var(--green-400)' : 'var(--red)', fontWeight: 800, fontFamily: 'var(--font-d)' }}>{m.net >= 0 ? '+' : ''}{formatNaira(m.net)}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
