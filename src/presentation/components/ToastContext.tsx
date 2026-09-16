import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { generateId } from '@/shared/utils/id';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = generateId('toast');
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 1000,
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              maxWidth: 380,
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-elevated)',
              color: 'var(--color-text)',
              fontSize: 14,
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--color-success)" />}
            {toast.type === 'error' && <XCircle size={18} color="var(--color-danger)" />}
            {toast.type === 'info' && <Info size={18} color="var(--color-brand-secondary)" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return ctx;
}
