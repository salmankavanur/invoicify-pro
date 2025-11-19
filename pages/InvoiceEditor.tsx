import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getInvoices, saveInvoice, getSettings, getClients } from '../services/dataService';
import { Invoice, AppSettings, LineItem, Client, ServiceItem } from '../types';
import { InvoicePreview } from '../components/InvoicePreview';
import { generateInvoiceNote } from '../services/geminiService';
import { Plus, Trash2, Save, Eye, Wand2, ArrowLeft, RefreshCw, Bell, User, Search, ChevronDown, Package, X } from 'lucide-react';
import { addYears, addDays, format } from 'date-fns';
import { useToast } from '../context/ToastContext';

const EMPTY_INVOICE: Invoice = {
  id: '',
  type: 'invoice',
  number: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  clientName: '',
  clientEmail: '',
  clientAddress: '',
  items: [{ id: '1', description: 'Consulting Services', quantity: 1, rate: 100, amount: 100 }],
  notes: '',
  status: 'draft',
  subtotal: 100,
  taxRate: 0,
  taxAmount: 0,
  discountRate: 0,
  discountAmount: 0,
  total: 100,
  currency: 'USD',
  enableRenewal: false,
  enableFollowUp: false,
  followUpDuration: '3 Days',
  createdAt: '',
  updatedAt: ''
};

export const InvoiceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice>({ ...EMPTY_INVOICE, id: crypto.randomUUID() });
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    const init = async () => {
      const s = getSettings();
      setSettings(s);
      setClients(await getClients());
      
      if (id) {
        const invoices = await getInvoices();
        const found = invoices.find(i => i.id === id);
        if (found) setInvoice(found);
      } else {
        const params = new URLSearchParams(location.search);
        const type = params.get('type') as 'invoice' | 'estimate' || 'invoice';
        const prefix = type === 'estimate' ? 'EST' : 'INV';

        setInvoice(prev => ({
          ...prev,
          id: crypto.randomUUID(),
          type: type,
          number: `${prefix}-${Math.floor(Math.random() * 100000)}`,
          currency: s.currencySymbol,
          taxRate: s.taxEnabled ? prev.taxRate : 0,
          followUpDuration: s.followUpOptions?.[0]?.label || '3 Days'
        }));
      }
    };
    init();
  }, [id, location.search]);

  useEffect(() => {
    if (!settings) return;

    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discountAmount = subtotal * (invoice.discountRate / 100);
    const taxable = subtotal - discountAmount;
    const taxAmount = settings.taxEnabled ? taxable * (invoice.taxRate / 100) : 0;
    const total = taxable + taxAmount;

    let renewalDate = invoice.renewalDate;
    if (invoice.enableRenewal && !renewalDate && invoice.date) {
      renewalDate = format(addYears(new Date(invoice.date), 1), 'yyyy-MM-dd');
    }

    setInvoice(prev => {
      if (prev.total === total && prev.subtotal === subtotal && prev.taxAmount === taxAmount && prev.renewalDate === renewalDate) return prev;
      return { ...prev, subtotal, discountAmount, taxAmount, total, renewalDate };
    });
  }, [invoice.items, invoice.taxRate, invoice.discountRate, settings, invoice.enableRenewal, invoice.date]);

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...invoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    setInvoice({ ...invoice, items: newItems });
  };

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const addFromCatalog = (item: ServiceItem) => {
      setInvoice({
          ...invoice,
          items: [...invoice.items, { 
              id: crypto.randomUUID(), 
              description: item.name, 
              quantity: 1, 
              rate: item.defaultRate, 
              amount: item.defaultRate 
          }]
      });
      setShowCatalog(false);
  };

  const removeItem = (index: number) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: newItems });
  };

  const handleSave = async () => {
    await saveInvoice(invoice);
    addToast(`${invoice.type === 'invoice' ? 'Invoice' : 'Estimate'} saved successfully!`);
    if (invoice.type === 'estimate') navigate('/estimates');
    else navigate('/invoices');
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    const itemSummary = invoice.items.map(i => i.description).join(', ');
    const note = await generateInvoiceNote(invoice.clientName, invoice.type, itemSummary);
    setInvoice({ ...invoice, notes: note });
    setIsGenerating(false);
    addToast('Note generated by AI', 'info');
  };

  const selectClient = (client: Client) => {
    setInvoice({
        ...invoice,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address
    });
    setIsClientDropdownOpen(false);
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6 mt-14 md:mt-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex gap-3">
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-white">
            <Eye size={18} /> Preview
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Save size={18} /> Save
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 relative">
            <div className="flex justify-between items-center">
                 <h3 className="text-lg font-bold dark:text-white">Bill To</h3>
                 <button onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)} className="text-xs text-primary-600 font-medium flex items-center gap-1">
                    <User size={14} /> {isClientDropdownOpen ? 'Close Search' : 'Select Saved Client'}
                 </button>
            </div>
            
            {isClientDropdownOpen && (
                <div className="absolute z-10 top-10 left-0 w-full bg-white dark:bg-gray-700 shadow-xl rounded-xl border border-gray-200 dark:border-gray-600 p-2">
                    <div className="relative mb-2">
                        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search clients..." 
                            autoFocus
                            className="w-full pl-9 p-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            value={clientSearch}
                            onChange={e => setClientSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredClients.map(c => (
                            <div key={c.id} onClick={() => selectClient(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer text-sm dark:text-white">
                                <div className="font-bold">{c.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{c.companyName}</div>
                            </div>
                        ))}
                        {filteredClients.length === 0 && <div className="p-2 text-xs text-gray-400 text-center">No clients found</div>}
                    </div>
                </div>
            )}

            <input 
              type="text" 
              placeholder="Client Name" 
              className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:text-white font-bold"
              value={invoice.clientName}
              onChange={e => setInvoice({...invoice, clientName: e.target.value})}
            />
             <input 
              type="email" 
              placeholder="Client Email" 
              className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:text-white"
              value={invoice.clientEmail}
              onChange={e => setInvoice({...invoice, clientEmail: e.target.value})}
            />
            <textarea 
              placeholder="Billing Address" 
              className="w-full p-2 border rounded bg-transparent dark:border-gray-600 dark:text-white h-24"
              value={invoice.clientAddress}
              onChange={e => setInvoice({...invoice, clientAddress: e.target.value})}
            />
          </div>

          <div className="space-y-4">
             <h3 className="text-lg font-bold dark:text-white text-right">Document Details</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 uppercase mb-1">Status</label>
                  <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={invoice.status} onChange={(e:any) => setInvoice({...invoice, status: e.target.value})}>
                    {invoice.type === 'invoice' ? (
                      <>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </>
                    ) : (
                      <>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Number</label>
                  <input type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={invoice.number} onChange={e => setInvoice({...invoice, number: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Type</label>
                  <select 
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    value={invoice.type} 
                    onChange={(e:any) => setInvoice({...invoice, type: e.target.value})}
                  >
                    <option value="invoice">Invoice</option>
                    <option value="estimate">Estimate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Date</label>
                  <input type="date" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={invoice.date} onChange={e => setInvoice({...invoice, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Due / Expiry Date</label>
                  <input type="date" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={invoice.dueDate} onChange={e => setInvoice({...invoice, dueDate: e.target.value})} />
                </div>
             </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
            {invoice.type === 'invoice' && (
                <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${invoice.enableRenewal ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm dark:text-white">Annual Renewal</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Auto-reminder next year.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={invoice.enableRenewal || false} onChange={e => setInvoice({...invoice, enableRenewal: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            )}

            {invoice.type === 'estimate' && (
                 <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${invoice.enableFollowUp ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <Bell size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm dark:text-white">Follow-Up Reminder</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Get reminded to check in.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={invoice.enableFollowUp || false} onChange={e => setInvoice({...invoice, enableFollowUp: e.target.checked})} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                    {invoice.enableFollowUp && (
                         <div className="flex items-center gap-2 animate-in fade-in">
                             <span className="text-xs font-bold text-gray-500 uppercase">Remind me in:</span>
                             <select 
                                value={invoice.followUpDuration} 
                                onChange={e => setInvoice({...invoice, followUpDuration: e.target.value})}
                                className="text-sm p-1 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                             >
                                 {settings.followUpOptions?.map(opt => (
                                     <option key={opt.label} value={opt.label}>{opt.label}</option>
                                 ))}
                             </select>
                         </div>
                    )}
                </div>
            )}
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 dark:text-white">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase w-1/2 rounded-l-lg">Description</th>
                  <th className="p-3 text-center text-xs font-bold text-gray-500 uppercase w-20">Qty</th>
                  <th className="p-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Price</th>
                  <th className="p-3 text-right text-xs font-bold text-gray-500 uppercase w-24">Amount</th>
                  <th className="w-10 rounded-r-lg"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2">
                      <input 
                        type="text" 
                        className="w-full p-2 rounded bg-transparent hover:bg-gray-50 focus:bg-white dark:hover:bg-gray-700 dark:focus:bg-gray-600 transition-colors focus:outline-none dark:text-white" 
                        value={item.description} 
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        className="w-full p-2 text-center rounded bg-transparent hover:bg-gray-50 focus:bg-white dark:hover:bg-gray-700 dark:focus:bg-gray-600 transition-colors focus:outline-none dark:text-white" 
                        value={item.quantity} 
                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        className="w-full p-2 text-center rounded bg-transparent hover:bg-gray-50 focus:bg-white dark:hover:bg-gray-700 dark:focus:bg-gray-600 transition-colors focus:outline-none dark:text-white" 
                        value={item.rate} 
                        onChange={e => handleItemChange(idx, 'rate', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-2 text-right dark:text-gray-300 font-medium">
                      {item.amount.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex gap-3">
              <button onClick={addItem} className="flex items-center gap-2 text-primary-600 font-medium text-sm hover:text-primary-700 p-2 hover:bg-primary-50 rounded-lg transition-colors">
                <Plus size={16} /> Add Line Item
              </button>
              <div className="relative">
                  <button onClick={() => setShowCatalog(!showCatalog)} className="flex items-center gap-2 text-indigo-600 font-medium text-sm hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Package size={16} /> Add from Catalog
                  </button>
                  {showCatalog && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 z-20 max-h-64 overflow-y-auto p-2">
                          <div className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                              <span className="text-xs font-bold text-gray-500 uppercase">Select Item</span>
                              <button onClick={() => setShowCatalog(false)}><X size={14}/></button>
                          </div>
                          {settings.serviceCatalog.length === 0 && <p className="p-2 text-xs text-gray-400">No items in catalog. Go to Settings to add.</p>}
                          {settings.serviceCatalog.map(cat => (
                              <div key={cat.id} className="mb-2">
                                  <p className="px-2 py-1 text-xs font-bold text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 rounded">{cat.name}</p>
                                  {cat.items.map(item => (
                                      <button 
                                        key={item.id} 
                                        onClick={() => addFromCatalog(item)}
                                        className="w-full text-left p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded flex justify-between text-sm"
                                      >
                                          <span className="dark:text-white">{item.name}</span>
                                          <span className="text-gray-500">{item.defaultRate}</span>
                                      </button>
                                  ))}
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div>
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-lg font-bold dark:text-white">Notes</h3>
               <button 
                 onClick={handleAiGenerate} 
                 disabled={isGenerating}
                 className="flex items-center gap-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50"
               >
                 <Wand2 size={12} /> {isGenerating ? 'Thinking...' : 'AI Auto-Draft'}
               </button>
             </div>
             <textarea 
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white h-32"
                placeholder="Terms, payment details, or a thank you note..."
                value={invoice.notes}
                onChange={e => setInvoice({...invoice, notes: e.target.value})}
             />
          </div>
          <div className="space-y-3 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>{settings.currencySymbol}{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span>Discount</span>
                <input 
                  type="number" 
                  className="w-12 p-1 text-center text-xs border rounded" 
                  value={invoice.discountRate}
                  onChange={e => setInvoice({...invoice, discountRate: Number(e.target.value)})}
                />
                <span className="text-xs">%</span>
              </div>
              <span className="text-red-500">-{settings.currencySymbol}{invoice.discountAmount.toFixed(2)}</span>
            </div>
            
            {settings.taxEnabled && (
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <span>{settings.taxLabel}</span>
                  <input 
                    type="number" 
                    className="w-12 p-1 text-center text-xs border rounded" 
                    value={invoice.taxRate}
                    onChange={e => setInvoice({...invoice, taxRate: Number(e.target.value)})}
                  />
                  <span className="text-xs">%</span>
                </div>
                <span>+{settings.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600 text-xl font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto">
            <div className="max-w-4xl mx-auto py-10 px-4">
                <button onClick={() => setShowPreview(false)} className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <ArrowLeft size={20} /> Back to Editor
                </button>
                <InvoicePreview invoice={invoice} settings={settings} onClose={() => setShowPreview(false)} />
            </div>
        </div>
      )}
    </div>
  );
};