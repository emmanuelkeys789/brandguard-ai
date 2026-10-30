import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  HelpCircle,
  Building2,
  ChevronDown,
  PlusCircle,
  ShieldAlert,
  Check,
  X,
  Database,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useBrand } from '../../context/useBrand';
import { useAuth } from '../../context/useAuth';
import { getRoleBadgeColors } from '../../services/rbac';

interface AppHeaderProps {
  onToggleMobileSidebar: () => void;
  onNewReviewClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleMobileSidebar,
  onNewReviewClick
}) => {
  const { brandProfile, dbState } = useBrand();
  const { currentRole, currentUser, switchRole, availableUsers } = useAuth();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleMenuOpen && !workspaceMenuOpen && !notificationOpen) return;
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (roleMenuRef.current && !roleMenuRef.current.contains(target)) {
        setRoleMenuOpen(false);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(target)) {
        setWorkspaceMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRoleMenuOpen(false);
        setWorkspaceMenuOpen(false);
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [roleMenuOpen, workspaceMenuOpen, notificationOpen]);

  const [userSelectedOrg, setUserSelectedOrg] = useState<string | null>(null);
  
  const currentBrandName = brandProfile?.name || 'Axiom Global Enterprise';
  const selectedOrg = userSelectedOrg ?? currentBrandName;
  const roleColors = getRoleBadgeColors(currentRole);

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
          zIndex: 50
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
          <div ref={workspaceMenuRef} style={{ position: 'relative' }}>
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

        {/* Right: Storage Transparency, Demo Role Selector, Quick Action, Notifications, Help */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Storage Backend Transparency Indicator */}
          {(() => {
            let indicatorBg = 'rgba(255, 255, 255, 0.03)';
            let indicatorBorder = 'var(--border-subtle)';
            let indicatorColor = 'var(--text-tertiary)';
            let indicatorText = 'Local Storage (Demo)';
            let indicatorTitle = 'Operating in offline LocalStorage demo mode. Cloud database not configured.';
            let icon = <Database size={13} color="var(--text-tertiary)" />;

            if (dbState.status === 'connected') {
              if (dbState.hasSyncFailure) {
                indicatorBg = 'rgba(245, 158, 11, 0.12)';
                indicatorBorder = 'rgba(245, 158, 11, 0.35)';
                indicatorColor = '#F59E0B';
                indicatorText = 'Cloud Sync Warning';
                indicatorTitle = `Supabase connected, but sync issues reported: ${dbState.errorMessage || 'Review sync failures'}`;
                icon = <AlertTriangle size={13} color="#F59E0B" />;
              } else {
                indicatorBg = 'rgba(52, 211, 153, 0.08)';
                indicatorBorder = 'rgba(52, 211, 153, 0.3)';
                indicatorColor = '#34D399';
                indicatorText = 'Cloud PostgreSQL';
                indicatorTitle = 'Connected to Supabase PostgreSQL (Cloud Active)';
                icon = <Database size={13} color="#34D399" />;
              }
            } else if (dbState.status === 'error') {
              indicatorBg = 'rgba(239, 68, 68, 0.12)';
              indicatorBorder = 'rgba(239, 68, 68, 0.35)';
              indicatorColor = '#EF4444';
              indicatorText = 'Cloud Offline (Fallback)';
              indicatorTitle = `Cloud connection failed: ${dbState.errorMessage || 'Falling back to Local Storage'}`;
              icon = <AlertTriangle size={13} color="#EF4444" />;
            }

            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: indicatorBg,
                  border: '1px solid',
                  borderColor: indicatorBorder,
                  fontSize: '11px',
                  color: indicatorColor
                }}
                title={indicatorTitle}
              >
                {icon}
                <span style={{ fontWeight: 500 }}>{indicatorText}</span>
              </div>
            );
          })()}

          {/* Demo Role / Simulated User Selector */}
          <div ref={roleMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setRoleMenuOpen(!roleMenuOpen);
                if (workspaceMenuOpen) setWorkspaceMenuOpen(false);
                if (notificationOpen) setNotificationOpen(false);
              }}
              aria-label="DEMO MODE — SIMULATED ROLES"
              aria-expanded={roleMenuOpen}
              aria-haspopup="true"
              id="header-role-selector-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${roleColors.border}`,
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: roleColors.bg,
                  border: `1px solid ${roleColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: roleColors.color,
                  fontSize: '11px',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {currentUser.avatarInitials}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className="header-role-prefix"
                    style={{
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--text-tertiary)',
                      letterSpacing: '0.04em'
                    }}
                  >
                    DEMO MODE — SIMULATED ROLES:
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: roleColors.color,
                      background: roleColors.bg,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {currentRole}
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {currentUser.name}
                </span>
              </div>

              <ChevronDown
                size={14}
                color="var(--text-tertiary)"
                style={{
                  transform: roleMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--transition-fast)'
                }}
              />
            </button>

            {roleMenuOpen && (
              <div
                id="header-role-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '380px',
                  maxWidth: 'min(380px, calc(100vw - 32px))',
                  padding: '16px',
                  zIndex: 1000,
                  background: '#0D111A',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 24px 50px -4px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} color="var(--accent-lime)" />
                      <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                        DEMO MODE — SIMULATED ROLES
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#CBD5E1',
                        letterSpacing: '0.04em'
                      }}
                    >
                      FOR EVALUATION
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: 0, lineHeight: 1.45 }}>
                    These simulated personas allow judges to test governance workflows and role-based permissions immediately without an authentication wall. They do not represent real authentication or enterprise identity management.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableUsers.map((user) => {
                    const colors = getRoleBadgeColors(user.role);
                    const isSelected = user.role === currentRole;
                    return (
                      <button
                        key={user.role}
                        onClick={() => {
                          switchRole(user.role);
                          setRoleMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'rgba(255, 255, 255, 0.08)' : '#141A26',
                          border: isSelected ? `1.5px solid ${colors.border}` : '1px solid rgba(255, 255, 255, 0.08)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          position: 'relative',
                          width: '100%'
                        }}
                        className="role-selector-option-btn"
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#1A2234';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#141A26';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          }
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: colors.bg,
                            border: `1.5px solid ${colors.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.color,
                            fontSize: '12px',
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {user.avatarInitials}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                              {user.name}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                color: colors.color,
                                letterSpacing: '0.03em'
                              }}
                            >
                              {user.role}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', fontWeight: 500 }}>
                            {user.title}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#CBD5E1', lineHeight: 1.4 }}>
                            {user.description}
                          </div>
                        </div>

                        {isSelected && (
                          <div
                            style={{
                              marginTop: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'rgba(214, 255, 112, 0.15)',
                              border: '1px solid var(--accent-lime)',
                              flexShrink: 0
                            }}
                          >
                            <Check size={12} color="var(--accent-lime)" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10.5px',
                    color: '#64748B',
                    lineHeight: 1.4
                  }}
                >
                  <Info size={13} style={{ flexShrink: 0, color: 'var(--accent-lime)' }} />
                  <span>Simulated in-browser session • Direct judge access with zero authentication walls</span>
                </div>
              </div>
            )}
          </div>

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
          <div ref={notificationRef} style={{ position: 'relative' }}>
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
        @media (max-width: 640px) {
          .header-role-prefix {
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
