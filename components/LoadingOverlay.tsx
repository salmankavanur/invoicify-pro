
import React from 'react';
import { useSync } from '../context/SyncContext';
import { Loader2, Database } from 'lucide-react';

export const LoadingOverlay = () => {
  const { isSyncing } = useSync();

  if (!isSyncing) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[100] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 border border-gray-200 dark:border-gray-700">
        <div className="relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-700"></div>
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin relative z-10" />
        </div>
        <div className="text-center">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Syncing with Sheet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please wait...</p>
        </div>
      </div>
    </div>
  );
};
