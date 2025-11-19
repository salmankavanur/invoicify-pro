
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, Receipt, Wallet, Users, Briefcase, BellRing, FileBadge, Menu, X, UserCircle, Timer } from 'lucide-react';
import { getSettings } from '../services/dataService';

export const Sidebar = () => {
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoUrlDark, setLogoUrlDark] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  
  const loadSettings = () => {
    const s = getSettings();
    setLogoUrl(s.logoUrl);
    setLogoUrlDark(s.logoUrlDark);
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('settingsChanged', loadSettings);
    return () => window.removeEventListener('settingsChanged', loadSettings);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const active = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden
        ${active 
          ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 dark:bg-white dark:text-gray-900" 
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        }`}
      >
        <Icon size={20} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="font-medium tracking-wide text-sm">{label}</span>
        {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/20 dark:bg-black/10 rounded-l-full" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40 p-4 flex justify-between items-center">
         <div className="flex items-center gap-2">
             {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 object-contain block dark:hidden" />
             ) : <Receipt className="w-6 h-6 text-gray-900 dark:text-white" />}
              {logoUrlDark ? (
                <img src={logoUrlDark} alt="Logo" className="h-8 object-contain hidden dark:block" />
             ) : null}
             {!logoUrl && <span className="font-bold text-lg dark:text-white">Invoicify</span>}
         </div>
         <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600 dark:text-gray-300">
             {isOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
        flex flex-col z-40 transition-transform duration-300 ease-in-out no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Area (Desktop) */}
        <div className="p-8 pb-4 h-24 hidden md:flex items-center">
          <Link to="/" className="block dark:hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" className="max-h-12 max-w-full object-contain" />
            ) : (
              <div className="flex items-center gap-3 text-gray-900">
                <div className="p-2 bg-gray-900 rounded-lg"><Receipt className="w-6 h-6 text-white" /></div>
                <span className="text-2xl font-bold tracking-tight">Invoicify</span>
              </div>
            )}
          </Link>
          <Link to="/" className="hidden dark:block">
            {logoUrlDark ? (
              <img src={logoUrlDark} alt="Company Logo" className="max-h-12 max-w-full object-contain" />
            ) : (logoUrl ? (
               <img src={logoUrl} alt="Company Logo" className="max-h-12 max-w-full object-contain brightness-0 invert" />
            ) : (
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-white rounded-lg"><Receipt className="w-6 h-6 text-gray-900" /></div>
                <span className="text-2xl font-bold tracking-tight">Invoicify</span>
              </div>
            ))}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6 space-y-1.5 overflow-y-auto custom-scrollbar mt-14 md:mt-0">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Menu</div>
          
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/clients" icon={Users} label="Clients" />
          <NavItem to="/projects" icon={Briefcase} label="Projects" />
          
          <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>
          
          <NavItem to="/invoices" icon={Receipt} label="Invoices" />
          <NavItem to="/estimates" icon={FileBadge} label="Estimates" />
          
          <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>
          
          <NavItem to="/expenses" icon={Wallet} label="Expense Tracker" />
          <NavItem to="/reminders" icon={BellRing} label="Reminders" />
          <NavItem to="/staff" icon={UserCircle} label="Staff & Work" />
          
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-8 mb-4 px-4">Configuration</div>
          
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              PRO
            </div>
            <div>
              <p className="text-sm font-bold dark:text-white">Premium Plan</p>
              <p className="text-xs text-gray-500">v1.6.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
