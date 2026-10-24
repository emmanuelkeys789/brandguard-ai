import React, { useState } from 'react';
import {
  Menu,
  Bell,
  HelpCircle,
  Building2,
  ChevronDown,
  PlusCircle,
  ShieldAlert,
  Check,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useBrand } from '../../context/useBrand';

interface AppHeaderProps {
  onToggleMobileSidebar: () => void;
  onNewReviewClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleMobileSidebar,
  onNewReviewClick
}) => {
  const { brandProfile } = useBrand();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  const [userSelectedOrg, setUserSelectedOrg] = useState<string | null>(null);
  
  const currentBrandName = brandProfile?.name || 'Axiom Global Enterprise';
  const selectedOrg = userSelectedOrg ?? currentBrandName;

  const workspaces = [currentBrandName, 'Acme Consumer Brand', 'Nova Biotech Lab'];

  return (
    <>
      <header
        style={{
          height: 'var(--header-height)',
          background: 'rgba(10, 12, 17, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        {/* Left: Mobile hamburger + Workspace Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Mobile drawer button */}
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Toggle Navigation Drawer"
            className="mobile-header-menu-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <Menu size={18} />
          </button>

          {/* Organization Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <Building2 size={15} color="var(--accent-lime)" />
              <span>{selectedOrg}</span>
              <ChevronDown size={14} color="var(--text-tertiary)" />
            </button>

            {workspaceMenuOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '220px',
                  padding: '6px',
                  zIndex: 60,
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    padding: '6px 10px',
                    letterSpacing: '0.04em'
                  }}
                >
                  SWITCH BRAND SPACE
                </div>
                {workspaces.map((org) => (
                  <button
                    key={org}
                    onClick={() => {
                      setUserSelectedOrg(org);
                      setWorkspaceMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '13px',
                      color: org === selectedOrg ? 'var(--accent-lime)' : 'var(--text-primary)',
                      background: org === selectedOrg ? 'rgba(214, 255, 112, 0.08)' : 'transparent',
                      textAlign: 'left'
                    }}
                  >
                    <span>{org}</span>
                    {org === selectedOrg && <Check size={14} color="var(--accent-lime)" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right: Quick Action, Notifications, Help */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={onNewReviewClick}
            iconLeft={<PlusCircle size={15} />}
            id="header-review-btn"
          >
            Check Content
          </Button>

          {/* Notifications Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              aria-label="Notifications"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              className="header-icon-btn"
            >
              <Bell size={16} />
              <span
                style={{
                  position: 'absolute',
                  top: '7px',
                  right: '7px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--accent-lime)'
                }}
              />
            </button>

            {notificationOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '300px',
                  padding: '16px',
                  zIndex: 60,
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '10px'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Notifications</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-lime)' }}>1 New</span>
                </div>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    lineHeight: 1.4
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Spring campaign review ready
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    3 issues flagged awaiting editorial sign-off.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help / Guide Trigger */}
          <button
            onClick={() => setHelpModalOpen(true)}
            aria-label="Documentation and Help"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="header-icon-btn"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Help & Architecture Modal */}
      {helpModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
          onClick={() => setHelpModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '540px',
              width: '100%',
              padding: '28px',
              background: 'rgba(15, 18, 25, 0.95)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="var(--accent-lime)" />
                <h3 style={{ fontSize: '17px', fontWeight: 700 }}>BrandGuard AI — Workspace Guide</h3>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                aria-label="Close dialog"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Welcome to the brand governance workspace for <strong>BrandGuard AI</strong>.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '24px' }}>
              <li>✦ <strong>Dashboard</strong>: Your brand setup, recent review activity, and next steps.</li>
              <li>✦ <strong>Check Content</strong>: Check drafts against your saved brand rules before publication.</li>
              <li>✦ <strong>Brand Rules</strong>: Manage approved facts, required terminology, prohibited claims, and brand voice.</li>
              <li>✦ <strong>Past Reviews</strong>: Find and revisit previously saved content reviews.</li>
              <li>✦ <strong>Trends & Insights</strong>: Understand recurring issues using actual review data.</li>
              <li>✦ <strong>Workspace Settings</strong>: Manage workspace preferences and application options.</li>
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" size="sm" onClick={() => setHelpModalOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .mobile-header-menu-btn {
            display: none !important;
          }
        }
        .header-icon-btn:hover {
          color: var(--text-primary) !important;
          border-color: var(--border-highlight) !important;
        }
      `}</style>
    </>
  );
};
