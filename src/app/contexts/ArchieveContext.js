'use client';

import { createContext, useContext, useState, useMemo } from 'react';

const ArchieveContext = createContext({
  archive: [],
});

export function ArchieveProvider({ children }) {
  const [archive] = useState([]);
  const value = useMemo(() => ({ archive }), [archive]);
  return <ArchieveContext.Provider value={value}>{children}</ArchieveContext.Provider>;
}

export function useArchieveContext() {
  return useContext(ArchieveContext);
}
