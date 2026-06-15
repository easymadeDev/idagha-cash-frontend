export default function TestPage() {
  return (
    <div style={{ background: '#000', color: '#fff', padding: 20, minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#22c55e' }}>iOS Debug Test</h1>
      <p id="status">JavaScript is working</p>
      <button
        onClick={() => alert('Button works!')}
        style={{ background: '#22c55e', color: '#000', padding: '12px 24px', border: 'none', borderRadius: 8, fontSize: 16, marginTop: 16, display: 'block' }}
      >
        Tap Me
      </button>
      <div id="results" style={{ marginTop: 20, fontSize: 13, lineHeight: 2 }}>
        <p>sessionStorage: {typeof window !== 'undefined' ? (sessionStorage ? 'OK' : 'FAIL') : 'SSR'}</p>
        <p>Intl en-NG: {(() => { try { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(1000); } catch(e) { return 'FAIL: ' + e; } })()}</p>
      </div>
    </div>
  );
}
