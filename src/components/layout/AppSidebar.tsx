import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  BookOpen,
  History,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import type { DashboardTab } from '../../types';

interface AppSidebarProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onReturnToLanding: () => void;
}

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onReturnToLanding
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />
    },
    {
      id: 'review',
      label: 'Check Content',
      icon: <FileCheck2 size={18} />,
      badge: 'Action'
    },
    {
      id: 'guidelines',
      label: 'Brand Rules',
      icon: <BookOpen size={18} />
    },
    {
      id: 'history',
      label: 'Past Reviews',
      icon: <History size={18} />
    },
    {
      id: 'insights',
      label: 'Trends & Insights',
      icon: <BarChart3 size={18} />
    },
    {
      id: 'settings',
      label: 'Workspace Settings',
      icon: <Settings size={18} />
    }
  ];

  return (
    <aside
      aria-label="Sidebar Navigation"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        minWidth: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'rgba(12, 14, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width var(--transition-normal), min-width var(--transition-normal)',
        zIndex: 50,
        overflowX: 'hidden'
      }}
    >
      {/* Top Header / Logo */}
      <div>
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '0 12px' : '0 20px',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div
            onClick={onReturnToLanding}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
            title="Return to Landing Page"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1C2230 0%, #0D1017 100%)',
                border: '1px solid var(--accent-lime-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={18} color="var(--accent-lime)" />
            </div>

            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                  BrandGuard
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '10px',
                    color: 'var(--accent-lime)',
                    background: 'var(--accent-lime-dim)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    border: '1px solid var(--accent-lime-border)'
                  }}
                >
                  AI
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="sidebar-collapse-btn"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Collapsed expander button if collapsed */}
        {collapsed && (
          <div style={{ padding: '8px 12px', textAlign: 'center' }}>
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              style={{
                width: '100%',
                padding: '6px 0',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Navigation Section */}
        <div style={{ padding: collapsed ? '16px 8px' : '20px 14px' }}>
          {!collapsed && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0 12px 10px 12px'
              }}
            >
              Workspace Navigation
            </div>
          )}

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    width: '100%',
                    padding: collapsed ? '10px' : '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'rgba(214, 255, 112, 0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-lime-border)' : 'transparent',
                    color: isActive ? 'var(--accent-lime)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '14px',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer'
                  }}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: isActive ? 'var(--accent-lime)' : 'inherit' }}>
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isActive ? 'var(--accent-lime)' : 'rgba(255, 255, 255, 0.08)',
                        color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Area: Return to Landing & User Card */}
      <div
        style={{
          padding: collapsed ? '12px 8px' : '16px 14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <button
          onClick={onReturnToLanding}
          title="Return to Product Showcase Landing"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            transition: 'color var(--transition-fast)'
          }}
          className="sidebar-return-btn"
        >
          <ExternalLink size={15} />
          {!collapsed && <span>Exit to Showcase</span>}
        </button>

        {!collapsed && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2A3143 0%, #171B26 100%)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}
            >
              SC
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Sarah Chen
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Head of Brand Governance
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .sidebar-nav-btn:not(.active):hover {
          background: rgba(255, 255, 255, 0.04) !important;
          color: var(--text-primary) !important;
        }
        .sidebar-collapse-btn:hover {
          color: var(--text-primary) !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .sidebar-return-btn:hover {
          color: var(--text-secondary) !important;
          background: rgba(255, 255, 255, 0.04) !important;
        }
      `}</style>
    </aside>
  );
};
