'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const TagsContext = createContext({
  tags: [],
  refetchTrigger: 0,
  triggerRefetch: () => {},
});

export function TagsProvider({ children }) {
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const triggerRefetch = useCallback(() => {
    setRefetchTrigger((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({ tags: [], refetchTrigger, triggerRefetch }),
    [refetchTrigger, triggerRefetch]
  );

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
}

export function useTagsContext() {
  return useContext(TagsContext);
}
