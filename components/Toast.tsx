import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340,
      }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const colors = {
    success: { bg: 'rgba(21,128,61,0.95)', border: 'rgba(34,197,94,0.4)', icon: '✓' },
    error:   { bg: 'rgba(185,28,28,0.95)', border: 'rgba(239,68,68,0.4)',  icon: '✕' },
    info:    { bg: 'rgba(30,64,175,0.95)', border: 'rgba(96,165,250,0.4)', icon: 'ℹ' },
  };
  const c = colors[toast.type];

  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
      padding: '12px 16px', color: '#fff', fontSize: '0.86rem', lineHeight: 1.5,
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      animation: 'toastIn 0.25s ease',
    }}>
      <span style={{ fontWeight: 700, fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer', fontSize: '1rem', padding: 0, flexShrink: 0, marginTop: 1,
      }}>✕</button>
    </div>
  );
}
