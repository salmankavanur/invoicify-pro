
import React, { useEffect, useState } from 'react';
import { getClients, saveClient, deleteClient, getInvoices, getSettings, getProjects, getReminders } from '../services/dataService';
import { Client, Invoice, AppSettings, Project, Reminder } from '../types';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, LayoutGrid, List as ListIcon, Globe, X, Receipt, FileBadge, Briefcase, Bell, FileText, ArrowLeft, Calendar, RefreshCw } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { Link } from 'react-router-dom';

export const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'estimates' | 'projects' | 'reminders' | 'notes'>('overview');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const load = async () => {
        setClients(await getClients());
        setInvoices(await getInvoices());
        setProjects(await getProjects());
        setReminders(await getReminders());
        setSettings(getSettings());
    };
    load();
  }, []);

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) ||
    c.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      id: currentClient.id || crypto.randomUUID(),
      name: currentClient.name!,
      companyName: currentClient.companyName,
      email: currentClient.email || '',
      phone: currentClient.phone || '',
      address: currentClient.address || '',
      taxId: currentClient.taxId || '',
      website: currentClient.website || '',
      notes: currentClient.notes || '',
      createdAt: currentClient.createdAt || new Date().toISOString()
    };
    const updated = await saveClient(client);
    setClients(updated);
    setIsEditing(false);
    setCurrentClient({});
    if (selectedClient && selectedClient.id === client.id) {
        setSelectedClient(client);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this client?")) {
      setClients(await deleteClient(id));
      if (selectedClient?.id === id) setSelectedClient(null);
    }
  };

  const openEdit = (client?: Client) => {
    setCurrentClient(client || {});
    setIsEditing(true);
  };

  // --- Client Detail Helpers ---
  const clientInvoices = selectedClient ? invoices.filter(i => i.clientName === selectedClient.name && i.type === 'invoice') : [];
  const clientEstimates = selectedClient ? invoices.filter(i => i.clientName === selectedClient.name && i.type === 'estimate') : [];
  const clientProjects = selectedClient ? projects.filter(p => p.clientName === selectedClient.name) : [];
  const clientReminders = selectedClient ? reminders.filter(r => r.title.includes(selectedClient.name)) : []; // loose matching
  
  const totalBilled = clientInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = clientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingAmount = clientInvoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
  const renewalInvoices = clientInvoices.filter(i => i.enableRenewal && i.renewalDate && isAfter(new Date(i.renewalDate), new Date()));

  if (selectedClient) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedClient(null)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <ArrowLeft size={20} className="dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">{selectedClient.name}</h1>
                        {selectedClient.companyName && <p className="text-gray-500 dark:text-gray-400">{selectedClient.companyName}</p>}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => openEdit(selectedClient)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
                        <Edit size={18} /> Edit
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700">
                {[
                    { id: 'overview', label: 'Overview', icon: LayoutGrid },
                    { id: 'invoices', label: 'Invoices', icon: Receipt },
                    { id: 'estimates', label: 'Estimates', icon: FileBadge },
                    { id: 'projects', label: 'Projects', icon: Briefcase },
                    { id: 'reminders', label: 'Reminders', icon: Bell },
                    { id: 'notes', label: 'Notes', icon: FileText },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id 
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         {/* Stats */}
                         <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <p className="text-sm text-gray-500">Total Billed</p>
                                <h3 className="text-2xl font-bold dark:text-white">{settings?.currencySymbol}{totalBilled.toFixed(2)}</h3>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <p className="text-sm text-gray-500">Total Paid</p>
                                <h3 className="text-2xl font-bold text-emerald-600">{settings?.currencySymbol}{totalPaid.toFixed(2)}</h3>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <p className="text-sm text-gray-500">Outstanding</p>
                                <h3 className="text-2xl font-bold text-amber-600">{settings?.currencySymbol}{pendingAmount.toFixed(2)}</h3>
                            </div>
                         </div>

                         {/* Info */}
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4 h-fit">
                            <h3 className="font-bold dark:text-white mb-4">Contact Info</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex gap-3 text-gray-600 dark:text-gray-300">
                                    <Mail size={16} className="shrink-0 mt-0.5" /> <span className="break-all">{selectedClient.email || '—'}</span>
                                </div>
                                <div className="flex gap-3 text-gray-600 dark:text-gray-300">
                                    <Phone size={16} className="shrink-0 mt-0.5" /> <span>{selectedClient.phone || '—'}</span>
                                </div>
                                <div className="flex gap-3 text-gray-600 dark:text-gray-300">
                                    <MapPin size={16} className="shrink-0 mt-0.5" /> <span>{selectedClient.address || '—'}</span>
                                </div>
                                {selectedClient.website && (
                                    <div className="flex gap-3 text-gray-600 dark:text-gray-300">
                                        <Globe size={16} className="shrink-0 mt-0.5" /> <a href={selectedClient.website} target="_blank" className="hover:underline text-blue-500">Website</a>
                                    </div>
                                )}
                            </div>
                         </div>

                         {/* Upcoming Renewals */}
                         <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                             <div className="flex items-center gap-2 mb-4">
                                 <RefreshCw size={18} className="text-indigo-500"/>
                                 <h3 className="font-bold dark:text-white">Upcoming Renewals</h3>
                             </div>
                             {renewalInvoices.length === 0 ? (
                                 <p className="text-gray-400 text-sm">No active renewals for this client.</p>
                             ) : (
                                 <div className="space-y-3">
                                     {renewalInvoices.map(inv => (
                                         <div key={inv.id} className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                             <div>
                                                 <p className="text-sm font-bold dark:text-white">Invoice #{inv.number}</p>
                                                 <p className="text-xs text-gray-500">Renewal Date</p>
                                             </div>
                                             <div className="text-right">
                                                 <p className="font-bold text-indigo-600 dark:text-indigo-400">{format(new Date(inv.renewalDate!), 'MMM dd, yyyy')}</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                    </div>
                )}

                {activeTab === 'invoices' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                         {clientInvoices.length === 0 ? <div className="p-8 text-center text-gray-500">No invoices found.</div> : (
                             <table className="w-full text-left">
                                 <thead className="bg-gray-50 dark:bg-gray-750 text-xs uppercase text-gray-500 font-bold">
                                     <tr><th className="px-6 py-3">Number</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3 text-right">Status</th></tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                     {clientInvoices.map(i => (
                                         <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                             <td className="px-6 py-3 font-medium dark:text-white">{i.number}</td>
                                             <td className="px-6 py-3 dark:text-gray-300">{format(new Date(i.date), 'MMM dd, yyyy')}</td>
                                             <td className="px-6 py-3 font-bold dark:text-white">{settings?.currencySymbol}{i.total.toFixed(2)}</td>
                                             <td className="px-6 py-3 text-right"><span className="capitalize">{i.status}</span></td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         )}
                    </div>
                )}

                {activeTab === 'estimates' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                         {clientEstimates.length === 0 ? <div className="p-8 text-center text-gray-500">No estimates found.</div> : (
                             <table className="w-full text-left">
                                 <thead className="bg-gray-50 dark:bg-gray-750 text-xs uppercase text-gray-500 font-bold">
                                     <tr><th className="px-6 py-3">Number</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3 text-right">Status</th></tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                     {clientEstimates.map(i => (
                                         <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                             <td className="px-6 py-3 font-medium dark:text-white">{i.number}</td>
                                             <td className="px-6 py-3 dark:text-gray-300">{format(new Date(i.date), 'MMM dd, yyyy')}</td>
                                             <td className="px-6 py-3 font-bold dark:text-white">{settings?.currencySymbol}{i.total.toFixed(2)}</td>
                                             <td className="px-6 py-3 text-right"><span className="capitalize">{i.status}</span></td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         )}
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {clientProjects.length === 0 && <p className="col-span-2 text-center text-gray-400 py-10">No projects.</p>}
                         {clientProjects.map(p => (
                             <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                 <h4 className="font-bold dark:text-white">{p.name}</h4>
                                 <div className="flex justify-between mt-2 text-sm">
                                     <span className="text-gray-500">Deadline: {format(new Date(p.deadline), 'MMM dd')}</span>
                                     <span className="capitalize font-medium text-blue-600">{p.status.replace('_',' ')}</span>
                                 </div>
                             </div>
                         ))}
                    </div>
                )}

                {activeTab === 'reminders' && (
                     <div className="space-y-3">
                        {clientReminders.length === 0 && <p className="text-center text-gray-400 py-10">No reminders found.</p>}
                        {clientReminders.map(r => (
                            <div key={r.id} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                <Bell size={16} className="text-amber-500" />
                                <div className="flex-1">
                                    <p className="font-bold dark:text-white">{r.title}</p>
                                    <p className="text-xs text-gray-500">{format(new Date(r.date), 'MMM dd, yyyy')}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                            </div>
                        ))}
                     </div>
                )}

                {activeTab === 'notes' && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                        <textarea 
                            className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-0 focus:ring-0 dark:text-white"
                            value={selectedClient.notes}
                            placeholder="Internal notes about this client..."
                            readOnly // Edit via "Edit" button at top to persist properly
                        />
                        <p className="text-xs text-gray-400 mt-2 text-right">Click 'Edit' at top right to modify notes.</p>
                    </div>
                )}
            </div>
        </div>
    );
  }

  // --- Main List View ---

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Clients</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your customer base</p>
        </div>
        <button onClick={() => openEdit()} className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium shadow-lg shadow-gray-900/20">
          <Plus size={20} /> Add Client
        </button>
      </div>

      <div className="flex justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
            type="text"
            placeholder="Search by name, company, or mobile..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
            />
        </div>
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl h-fit">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400'}`}>
                <LayoutGrid size={20} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400'}`}>
                <ListIcon size={20} />
            </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(client => (
            <div key={client.id} onClick={() => setSelectedClient(client)} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-primary-500 cursor-pointer transition-all relative">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-200 font-bold text-lg">
                            {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold dark:text-white leading-tight">{client.name}</h3>
                            {client.companyName && <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{client.companyName}</p>}
                        </div>
                    </div>
                </div>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                    <div className="flex items-center gap-3">
                        <Phone size={16} className="text-gray-400" />
                        <span>{client.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-400" />
                        <span className="truncate">{client.email || '—'}</span>
                    </div>
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filtered.map(client => (
                        <tr key={client.id} onClick={() => setSelectedClient(client)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                            <td className="px-6 py-4 font-bold dark:text-white">{client.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                <div>{client.email}</div>
                                <div className="text-xs text-gray-400">{client.phone}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{client.companyName || '—'}</td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={(e) => {e.stopPropagation(); handleDelete(client.id);}} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">{currentClient.id ? 'Edit Client' : 'Add Client'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Name</label>
                     <input type="text" required className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentClient.name || ''} onChange={e => setCurrentClient({...currentClient, name: e.target.value})} />
                 </div>
                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label>
                     <input type="text" className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentClient.companyName || ''} onChange={e => setCurrentClient({...currentClient, companyName: e.target.value})} />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input type="email" className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentClient.email || ''} onChange={e => setCurrentClient({...currentClient, email: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Number</label>
                    <input type="tel" className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentClient.phone || ''} onChange={e => setCurrentClient({...currentClient, phone: e.target.value})} />
                </div>
              </div>
              
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                  <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={2} value={currentClient.address || ''} onChange={e => setCurrentClient({...currentClient, address: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tax / VAT ID</label>
                    <input type="text" className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentClient.taxId || ''} onChange={e => setCurrentClient({...currentClient, taxId: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website</label>
                    <input type="url" placeholder="https://" className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentClient.website || ''} onChange={e => setCurrentClient({...currentClient, website: e.target.value})} />
                </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal Notes</label>
                  <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={2} value={currentClient.notes || ''} onChange={e => setCurrentClient({...currentClient, notes: e.target.value})} />
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
