import { useState, useEffect } from 'react';
import { useGate } from '../lib/gate';

const WA_SANDBOX = 'https://wa.me/14155238886?text=join%20write-personal';
const DISMISSED_KEY = 'idagha_wa_prompt_dismissed';

export default function WhatsAppPrompt() {
  const { member, cleared, ready } = useGate();
  const [visible, setVisible] = useState(false);
  const [animOut, setAnimOut] = useState(false);

  useEffect(() => {
    if (!ready || !cleared || !member) return;
    if (member.whatsappSubscribed) return;
    // Only show once per session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    // Small delay so it appears after the login popup fully closes
    const t = setTimeout(() => setVisible(true), 2200);
    return () => clearTimeout(t);
  }, [ready, cleared, member]);

  const dismiss = () => {
    setAnimOut(true);
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setTimeout(() => { setVisible(false); setAnimOut(false); }, 300);
  };

  if (!visible) return null;

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)', zIndex: 8000,
        animation: animOut ? 'fadeOut 0.3s ease forwards' : 'fadeIn 0.3s ease forwards',
      }} onClick={dismiss} />

      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        width: 'min(420px, calc(100vw - 32px))',
        background: 'linear-gradient(160deg,#0a1f0e,#061008)',
        border: '1px solid rgba(37,211,102,0.3)',
        borderRadius: 20, padding: '24px 24px 20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(37,211,102,0.1)',
        zIndex: 8001,
        animation: animOut ? 'slideDown 0.3s ease forwards' : 'slideUp 0.35s ease forwards',
      }}>
        {/* Close */}
        <button onClick={dismiss} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.06)', border: 'none',
          borderRadius: '50%', width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#25d366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#f9fafb' }}>
              Get WhatsApp Notifications
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
              Hi {member?.name?.split(' ')[0]}! You're not connected yet
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.7, margin: '0 0 16px' }}>
          Stay updated with announcements, reminders and group news directly on WhatsApp. Just tap the button, then hit <strong style={{ color: '#f9fafb' }}>Send</strong> in WhatsApp — that's it!
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {['Tap button below', 'WhatsApp opens', 'Tap Send ▶', 'Done!'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%', background: '#25d366',
                color: '#fff', fontSize: '0.62rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{step}</span>
              {i < 3 && <span style={{ color: '#374151', fontSize: '0.7rem' }}>→</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={WA_SANDBOX}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 16px', borderRadius: 10,
              background: '#25d366', color: '#fff',
              fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Join WhatsApp Now
          </a>
          <button onClick={dismiss} style={{
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#6b7280', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            Later
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp   { from { opacity: 0; transform: translateX(-50%) translateY(30px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes slideDown { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(30px); } }
      `}</style>
    </>
  );
}
