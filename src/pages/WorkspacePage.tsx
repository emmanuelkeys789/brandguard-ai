import React, { useState } from 'react';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AppHeader } from '../components/layout/AppHeader';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { ReviewTab } from '../components/dashboard/ReviewTab';
import { GuidelinesTab } from '../components/dashboard/GuidelinesTab';
import { HistoryTab } from '../components/dashboard/HistoryTab';
import { InsightsTab } from '../components/dashboard/InsightsTab';
import { SettingsTab } from '../components/dashboard/SettingsTab';
import type { DashboardTab } from '../types';
import { ChevronRight, Home } from 'lucide-react';

interface WorkspacePageProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onReturnToLanding: () => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  currentTab,
  onSelectTab,
  onReturnToLanding
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const getTabTitle = (tab: DashboardTab): string => {
    switch (tab) {
      case 'overview':
        return 'Dashboard';
      case 'review':
        return 'Check Content';
      case 'guidelines':
        return 'Brand Rules';
      case 'history':
        return 'Past Reviews';
      case 'insights':
        return 'Trends & Insights';
      case 'settings':
        return 'Workspace Settings';
      default:
        return 'Dashboard';
    }
  };

  const handleSelectTab = (tab: DashboardTab) => {
    onSelectTab(tab);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Desktop Persistent Sidebar */}
      <div className="desktop-sidebar-container">
        <AppSidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onReturnToLanding={onReturnToLanding}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex'
          }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AppSidebar
              currentTab={currentTab}
              onSelectTab={handleSelectTab}
              collapsed={false}
              onToggleCollapse={() => setMobileDrawerOpen(false)}
              onReturnToLanding={onReturnToLanding}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <AppHeader
          onToggleMobileSidebar={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          onNewReviewClick={() => handleSelectTab('review')}
        />

        {/* Content Viewport */}
        <main
          style={{
            flex: 1,
            padding: 'clamp(18px, 3vw, 36px) clamp(16px, 3.5vw, 40px)',
            maxWidth: '1360px',
            width: '100%',
            margin: '0 auto',
            minHeight: 'calc(100vh - var(--header-height))'
          }}
        >
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumbs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              marginBottom: '20px'
            }}
          >
            <button
              onClick={() => handleSelectTab('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-tertiary)',
                cursor: 'pointer'
              }}
            >
              <Home size={13} />
              <span>Workspace</span>
            </button>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--accent-lime)', fontWeight: 600 }}>
              {getTabTitle(currentTab)}
            </span>
          </nav>

          {/* Active Tab View */}
          {currentTab === 'overview' && <OverviewTab onNavigateTab={handleSelectTab} />}
          {currentTab === 'review' && <ReviewTab onNavigateTab={handleSelectTab} />}
          {currentTab === 'guidelines' && <GuidelinesTab />}
          {currentTab === 'history' && <HistoryTab onNavigateTab={handleSelectTab} />}
          {currentTab === 'insights' && <InsightsTab onNavigateTab={handleSelectTab} />}
          {currentTab === 'settings' && <SettingsTab />}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar-container {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
