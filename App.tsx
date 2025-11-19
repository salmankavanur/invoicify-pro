
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { InvoiceList } from './pages/InvoiceList';
import { InvoiceEditor } from './pages/InvoiceEditor';
import { ExpenseTracker } from './pages/ExpenseTracker';
import { ClientList } from './pages/ClientList';
import { ProjectList } from './pages/ProjectList';
import { ReminderList } from './pages/ReminderList';
import { Settings } from './pages/Settings';
import { StaffList } from './pages/StaffList';
import { BackendCode } from './pages/BackendCode';
import { getSettings } from './services/dataService';
import { ToastProvider } from './context/ToastContext';
import { SyncProvider } from './context/SyncContext';
import { LoadingOverlay } from './components/LoadingOverlay';

const App = () => {
  // Initialize theme
  useEffect(() => {
    const s = getSettings();
    if (s.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <SyncProvider>
      <ToastProvider>
        <Router>
          <LoadingOverlay />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
            <Routes>
              <Route path="/backend-script" element={<BackendCode />} />
              <Route path="*" element={
                 <>
                    <Sidebar />
                    <main className="flex-1 md:ml-72 transition-all duration-200 w-full">
                      <div className="p-4 md:p-10 max-w-7xl mx-auto w-full">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/invoices" element={<InvoiceList />} />
                          <Route path="/estimates" element={<InvoiceList />} />
                          <Route path="/expenses" element={<ExpenseTracker />} />
                          <Route path="/clients" element={<ClientList />} />
                          <Route path="/projects" element={<ProjectList />} />
                          <Route path="/reminders" element={<ReminderList />} />
                          <Route path="/staff" element={<StaffList />} />
                          <Route path="/create" element={<InvoiceEditor />} />
                          <Route path="/edit/:id" element={<InvoiceEditor />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                      </div>
                    </main>
                 </>
              } />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </SyncProvider>
  );
};

export default App;
