import React, { useState, useEffect, useCallback } from 'react';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { BrandProvider } from './context/BrandContext';
import type { DashboardTab } from './types';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<DashboardTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as DashboardTab | null;
    const validTabs: DashboardTab[] = ['overview', 'review', 'guidelines', 'history', 'insights', 'settings'];
    if (tabParam && validTabs.includes(tabParam)) {
      return tabParam;
    }
    // Also check if path is /app/review or similar
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 1 && validTabs.includes(pathParts[1] as DashboardTab)) {
      return pathParts[1] as DashboardTab;
    }
    // Check sessionStorage
    try {
      const stored = sessionStorage.getItem('brandguard_active_tab') as DashboardTab | null;
      if (stored && validTabs.includes(stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'overview';
  });

  // Global URL change synchronization
  const syncRouteFromLocation = useCallback(() => {
    const path = window.location.pathname || '/';
    setCurrentPath(path);

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as DashboardTab | null;
    const validTabs: DashboardTab[] = ['overview', 'review', 'guidelines', 'history', 'insights', 'settings'];

    if (tabParam && validTabs.includes(tabParam)) {
      setActiveWorkspaceTab(tabParam);
      try { sessionStorage.setItem('brandguard_active_tab', tabParam); } catch { /* ignore */ }
    } else {
      const pathParts = path.split('/').filter(Boolean);
      if (pathParts[0] === 'app' && pathParts[1] && validTabs.includes(pathParts[1] as DashboardTab)) {
        setActiveWorkspaceTab(pathParts[1] as DashboardTab);
        try { sessionStorage.setItem('brandguard_active_tab', pathParts[1]); } catch { /* ignore */ }
      } else if (path === '/app' || path === '/app/') {
        try {
          const stored = sessionStorage.getItem('brandguard_active_tab') as DashboardTab | null;
          if (stored && validTabs.includes(stored)) {
            setActiveWorkspaceTab(stored);
            return;
          }
        } catch { /* ignore */ }
        setActiveWorkspaceTab('overview');
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', syncRouteFromLocation);
    return () => window.removeEventListener('popstate', syncRouteFromLocation);
  }, [syncRouteFromLocation]);

  const navigateTo = useCallback((path: string, tab?: DashboardTab) => {
    let targetUrl = path;
    if (path === '/app' && tab) {
      targetUrl = `/app?tab=${tab}`;
    }

    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }

    setCurrentPath(path);
    if (tab) {
      setActiveWorkspaceTab(tab);
      try { sessionStorage.setItem('brandguard_active_tab', tab); } catch { /* ignore */ }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTabChangeInWorkspace = useCallback((tab: DashboardTab) => {
    setActiveWorkspaceTab(tab);
    try { sessionStorage.setItem('brandguard_active_tab', tab); } catch { /* ignore */ }
    const targetUrl = `/app?tab=${tab}`;
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.pushState({ tab }, '', targetUrl);
    }
  }, []);

  // Determine if active route is the application workspace
  const isAppRoute = currentPath === '/app' || currentPath.startsWith('/app');

  return (
    <BrandProvider>
      {isAppRoute ? (
        <WorkspacePage
          currentTab={activeWorkspaceTab}
          onSelectTab={handleTabChangeInWorkspace}
          onReturnToLanding={() => navigateTo('/')}
        />
      ) : (
        <LandingPage
          onNavigateToApp={(initialTab) =>
            navigateTo('/app', (initialTab as DashboardTab) || 'overview')
          }
        />
      )}
    </BrandProvider>
  );
};

export default App;
