import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastMessage } from '../../context/brandContextDef';

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--accent-lime)" />;
      case 'error':
        return <AlertTriangle size={18} color="var(--accent-rose)" />;
      case 'info':
      default:
        return <Info size={18} color="var(--accent-blue)" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'var(--accent-lime-border)';
      case 'error':
        return 'var(--accent-rose-dim)';
      case 'info':
      default:
        return 'var(--accent-blue-dim)';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'auto',
        animation: 'toastSlideIn 240ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className="glass-panel"
        style={{
          padding: '14px 16px',
          background: 'rgba(13, 16, 24, 0.94)',
          backdropFilter: 'blur(20px)',
          borderColor: getBorderColor(),
          boxShadow: 'var(--shadow-lg), 0 0 24px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}
      >
        <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: toast.description ? '2px' : 0
            }}
          >
            {toast.title}
          </div>
          {toast.description && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {toast.description}
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            padding: '2px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <X size={14} />
        </button>
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
