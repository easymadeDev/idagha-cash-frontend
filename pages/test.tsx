import { useState } from 'react';

export default function TestPage() {
  const [clicked, setClicked] = useState(false);

  return (
    <div style={{ background: '#000', color: '#fff', padding: 20, minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#22c55e' }}>iOS Debug Test</h1>
      <p>If you can read this, HTML works.</p>
      <p style={{ color: clicked ? '#22c55e' : '#fff' }}>
        {clicked ? 'REACT WORKS! Hydration is fine.' : 'React state not yet triggered.'}
      </p>
      <button
        onClick={() => setClicked(true)}
        style={{
          background: '#22c55e', color: '#000',
          padding: '16px 32px', border: 'none',
          borderRadius: 8, fontSize: 18,
          marginTop: 16, display: 'block',
          cursor: 'pointer', width: '100%',
        }}
      >
        TAP HERE
      </button>
      {clicked && (
        <div style={{ marginTop: 20, padding: 16, background: '#0d2010', border: '1px solid #22c55e', borderRadius: 8 }}>
          React hydration is working on your iPhone!
        </div>
      )}
    </div>
  );
}
