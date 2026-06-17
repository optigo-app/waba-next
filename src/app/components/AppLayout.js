'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { TagsProvider } from '../contexts/TagsContexts';
import { ArchieveProvider } from '../contexts/ArchieveContext';
import { DashboardFiltersProvider, useDashboardFilters } from '../contexts/DashboardFiltersContext';
import { WalletProvider } from '../contexts/WalletContext';
import Sidebar from './Siderbar/Sidebar';
import AuthGuard from './AuthGuard';

function SidebarWrapper({ isCollapsed, onCollapsedChange }) {
  const { selectedStatus, selectedTag, setSelectedStatus, setSelectedTag } = useDashboardFilters();
  return (
    <Sidebar
      onStatusSelect={setSelectedStatus}
      selectedStatus={selectedStatus}
      onTagSelect={setSelectedTag}
      selectedTag={selectedTag}
      isCollapsed={isCollapsed}
      onCollapsedChange={onCollapsedChange}
    />
  );
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'optigo_sidebar_collapsed';

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [isBreakpointSidebarCollapsed, setIsBreakpointSidebarCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      setIsBreakpointSidebarCollapsed(window.innerWidth <= 1440);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed));
    } catch {
      // ignore
    }
  }, [isSidebarCollapsed]);

  const isPublicRoute = pathname === '/login' || pathname === '/session-check' || pathname === '/test';

  if (isPublicRoute) {
    return <>{children}</>;
  }

  const isSidebarCollapsedEffective = isSidebarCollapsed || isBreakpointSidebarCollapsed;
  const sidebarWidth = isSidebarCollapsedEffective ? '76px' : '260px';

  return (
    <TagsProvider>
      <ArchieveProvider>
        <DashboardFiltersProvider>
          <WalletProvider>
            <AuthGuard>
              <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
                <SidebarWrapper
                  isCollapsed={isSidebarCollapsedEffective}
                  onCollapsedChange={setIsSidebarCollapsed}
                />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    marginLeft: sidebarWidth,
                    width: `calc(100% - ${sidebarWidth})`,
                    minHeight: '100vh',
                    transition: 'margin-left 0.2s ease, width 0.2s ease',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  {children}
                </Box>
              </Box>
            </AuthGuard>
          </WalletProvider>
        </DashboardFiltersProvider>
      </ArchieveProvider>
    </TagsProvider>
  );
}
