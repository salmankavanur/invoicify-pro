import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getInvoices, deleteInvoice, saveInvoice, getSettings } from '../services/dataService';
import { Invoice, AppSettings } from '../types';
import { Edit, Trash2, Copy, Search, Plus, Eye, Download, Receipt, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { InvoicePreview } from '../components/InvoicePreview';

export const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const isEstimate = location.pathname.includes('estimates');
  const type = isEstimate ? 'estimate' : 'invoice';

  useEffect(() => {
    const load = async () => {
      setInvoices(await getInvoices());
      setSettings(getSettings());
    };
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      const updated = await deleteInvoice(id);
      setInvoices(updated);
    }
  };

  const handleDuplicate = async (inv: Invoice) => {
    const newInv: Invoice = {
      ...inv,
      id: crypto.randomUUID(),
      number: `${inv.number}-CPY`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveInvoice(newInv);
    setInvoices(await getInvoices());
  };

  const handleDownload = (inv: Invoice) => {
    setPreviewInvoice(inv);
    setTimeout(() => {
       window.print();
    }, 500);
  };

  const handleCreateNew = () => {
      navigate(`/create?type=${type}`);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
      accepted: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
      pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20',
      rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
      expired: 'bg-gray-100 text-gray-600 ring-gray-500/20',
      draft: 'bg-slate-50 text-slate-600 ring-slate-500/20',
    };
    const style = styles[status.toLowerCase()] || styles.draft;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style} ring-1 ring-inset uppercase tracking-wide`}>
        {status}
      </span>
    );
  };

  const filtered = invoices
    .filter(i => i.type === type)
    .filter(i => 
      i.clientName.toLowerCase().includes(search.toLowerCase()) || 
      i.number.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!settings) return null;

  // If previewing, show the preview component full screen (inside the tab)
  if (previewInvoice) {
      return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <button onClick={() => setPreviewInvoice(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 no-print">
                  <ArrowLeft size={20} /> Back to List
              </button>
              <InvoicePreview 
                invoice={previewInvoice} 
                settings={settings} 
                onClose={() => setPreviewInvoice(null)} 
              />
          </div>
      );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-1 capitalize">{type}s</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your {type}s</p>
        </div>
        <button onClick={handleCreateNew} className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-900/20 font-medium">
          <Plus size={20} /> Create {type === 'invoice' ? 'Invoice' : 'Estimate'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${type}s by number or client...`}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white focus:ring-2 focus:ring-primary-500 outline-none shadow-sm transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Number</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500">
                    No {type}s found. Create one to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/edit/${inv.id}`} className="font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {inv.date ? format(new Date(inv.date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{inv.clientName}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {settings.currencySymbol}{inv.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-6 py-4 flex justify-end items-center gap-1">
                      <button onClick={() => setPreviewInvoice(inv)} title="View Invoice" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleDownload(inv)} title="Download/Print" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-all">
                        <Download size={18} />
                      </button>
                      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1"></div>
                      <button onClick={() => handleDuplicate(inv)} title="Duplicate" className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-all">
                        <Copy size={18} />
                      </button>
                      <Link to={`/edit/${inv.id}`} title="Edit" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-all">
                        <Edit size={18} />
                      </Link>
                      <button onClick={() => handleDelete(inv.id)} title="Delete" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};