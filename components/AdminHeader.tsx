// Title row shared by the newer admin pages
export default function AdminHeader({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 2 }}>{sub}</p>
      </div>
      {action}
    </div>
  );
}
