
import React, { createContext, useContext, useState, useEffect } from 'react';
import { setSyncListener } from '../services/dataService';

interface SyncContextType {
  isSyncing: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Connect the non-React data service to the React Context
    setSyncListener((loading) => {
      setIsSyncing(loading);
    });
    return () => setSyncListener(() => {});
  }, []);

  return (
    <SyncContext.Provider value={{ isSyncing }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within a SyncProvider');
  return context;
};
