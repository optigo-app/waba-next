'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const DashboardFiltersContext = createContext({
  selectedStatus: 'All',
  selectedTag: 'All',
  setSelectedStatus: () => {},
  setSelectedTag: () => {},
});

export function DashboardFiltersProvider({ children }) {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');

  const onStatusSelect = useCallback((status) => setSelectedStatus(status), []);
  const onTagSelect = useCallback((tag) => setSelectedTag(tag), []);

  const value = useMemo(
    () => ({
      selectedStatus,
      selectedTag,
      setSelectedStatus: onStatusSelect,
      setSelectedTag: onTagSelect,
    }),
    [selectedStatus, selectedTag, onStatusSelect, onTagSelect]
  );

  return (
    <DashboardFiltersContext.Provider value={value}>
      {children}
    </DashboardFiltersContext.Provider>
  );
}

export function useDashboardFilters() {
  return useContext(DashboardFiltersContext);
}
