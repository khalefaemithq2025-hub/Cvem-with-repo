import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

export default function Toast() {
  const { showToast, toastMessage, toastType, toastKey } = useStore();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!showToast) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    error:   <XCircle    className="w-5 h-5 flex-shrink-0" />,
    info:    <Info       className="w-5 h-5 flex-shrink-0" />,
  };

  const styles: Record<string, React.CSSProperties> = {
    success: {
      background: isLight ? '#ffffff' : '#0d2a4a',
      border: `1.5px solid ${isLight ? '#22c55e' : '#16a34a'}`,
      color: isLight ? '#15803d' : '#4ade80',
      boxShadow: isLight ? '0 8px 32px rgba(34,197,94,0.18)' : '0 8px 32px rgba(34,197,94,0.25)',
    },
    error: {
      background: isLight ? '#ffffff' : '#0d2a4a',
      border: `1.5px solid ${isLight ? '#ef4444' : '#dc2626'}`,
      color: isLight ? '#b91c1c' : '#f87171',
      boxShadow: isLight ? '0 8px 32px rgba(239,68,68,0.18)' : '0 8px 32px rgba(239,68,68,0.25)',
    },
    info: {
      background: isLight ? '#ffffff' : '#0d2a4a',
      border: `1.5px solid ${isLight ? '#3b82f6' : '#2563eb'}`,
      color: isLight ? '#1d4ed8' : '#93c5fd',
      boxShadow: isLight ? '0 8px 32px rgba(59,130,246,0.18)' : '0 8px 32px rgba(59,130,246,0.25)',
    },
  };

  return (
    <>
      {/* Outer: centering only — never animated so translateX(-50%) is never overridden */}
      <div style={{
        position: 'fixed', top: '5.5rem', left: '50%',
        transform: 'translateX(-50%)', zIndex: 9999,
        minWidth: 260, maxWidth: 420,
      }}>
        {/* Inner: key changes → forces remount → animation replays on every toast */}
        <div key={toastKey} style={{ animation: 'toastSlideIn 0.3s ease forwards' }}>
          <div
            dir="rtl"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.85rem 1.25rem', borderRadius: 14,
              fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: '0.95rem',
              backdropFilter: 'blur(12px)',
              ...styles[toastType],
            }}
          >
            {icons[toastType]}
            <span>{toastMessage}</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
