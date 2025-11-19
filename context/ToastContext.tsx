
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-10 fade-in duration-300 max-w-sm w-full
            ${toast.type === 'success' ? 'bg-white dark:bg-gray-800 border-green-100 dark:border-green-900/30' : 
              toast.type === 'error' ? 'bg-white dark:bg-gray-800 border-red-100 dark:border-red-900/30' : 
              'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-900/30'}`}
          >
             {toast.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
             {toast.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
             {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
             
             <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{toast.message}</p>
             <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
               <X size={16} />
             </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
