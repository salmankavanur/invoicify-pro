
import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings, getInvoices, getClients, getExpenses, getProjects, getReminders, getStaff } from '../services/dataService';
import { AppSettings, FollowUpOption, ServiceCategory, ServiceItem } from '../types';
import { Save, Copy, Check, Upload, Trash2, Image as ImageIcon, Plus, X, Sun, Moon, Bell, Package, FolderPlus, Database, ExternalLink, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export const Settings = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const { addToast } = useToast();
  
  // Follow up options state
  const [newFollowUpLabel, setNewFollowUpLabel] = useState('');
  const [newFollowUpDays, setNewFollowUpDays] = useState(1);

  // Service Catalog State
  const [newServiceCat, setNewServiceCat] = useState('');
  const [newServiceItem, setNewServiceItem] = useState({ name: '', rate: 0, catId: '' });

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    if (settings) {
      saveSettings(settings);
      window.dispatchEvent(new Event('settingsChanged'));
      if (settings.darkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      addToast('Settings saved successfully');
    }
  };

  const handleConnectSync = async () => {
      if (settings) {
          saveSettings(settings); // Save URL first
          try {
              addToast('Connecting to Google Sheet...', 'info');
              // Force fetch all data to sync local with remote
              await Promise.all([
                  getInvoices(),
                  getClients(),
                  getExpenses(),
                  getProjects(),
                  getReminders(),
                  getStaff()
              ]);
              addToast('Connected & Synced Successfully!');
          } catch (e) {
              addToast('Connection failed. Check URL.', 'error');
          }
      }
  };

  const handleChange = (key: keyof AppSettings, value: any) => {
    if (settings) setSettings({ ...settings, [key]: value });
  };

  const addCategory = () => {
    if (settings && newCategory.trim() && !settings.expenseCategories.includes(newCategory.trim())) {
        handleChange('expenseCategories', [...settings.expenseCategories, newCategory.trim()]);
        setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    if (settings) handleChange('expenseCategories', settings.expenseCategories.filter(c => c !== cat));
  };

  const addFollowUpOption = () => {
      if (settings && newFollowUpLabel.trim()) {
          const newOpt = { label: newFollowUpLabel.trim(), days: Number(newFollowUpDays) };
          handleChange('followUpOptions', [...settings.followUpOptions, newOpt]);
          setNewFollowUpLabel('');
          setNewFollowUpDays(1);
      }
  };

  const removeFollowUpOption = (label: string) => {
      if (settings) handleChange('followUpOptions', settings.followUpOptions.filter(o => o.label !== label));
  };

  // --- Service Catalog Methods ---
  const addServiceCategory = () => {
    if (settings && newServiceCat.trim()) {
       const newCat: ServiceCategory = { id: crypto.randomUUID(), name: newServiceCat.trim(), items: [] };
       handleChange('serviceCatalog', [...settings.serviceCatalog, newCat]);
       setNewServiceCat('');
    }
  };

  const deleteServiceCategory = (id: string) => {
    if (settings) handleChange('serviceCatalog', settings.serviceCatalog.filter(c => c.id !== id));
  };

  const addServiceItem = (catId: string) => {
      if (settings && newServiceItem.name.trim()) {
          const updatedCatalog = settings.serviceCatalog.map(cat => {
              if (cat.id === catId) {
                  return {
                      ...cat,
                      items: [...cat.items, { id: crypto.randomUUID(), name: newServiceItem.name, defaultRate: Number(newServiceItem.rate) }]
                  };
              }
              return cat;
          });
          handleChange('serviceCatalog', updatedCatalog);
          setNewServiceItem({ name: '', rate: 0, catId: '' });
      }
  };

  const deleteServiceItem = (catId: string, itemId: string) => {
      if (settings) {
          const updatedCatalog = settings.serviceCatalog.map(cat => {
              if (cat.id === catId) {
                  return { ...cat, items: cat.items.filter(i => i.id !== itemId) };
              }
              return cat;
          });
          handleChange('serviceCatalog', updatedCatalog);
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'light') handleChange('logoUrl', reader.result as string);
        else handleChange('logoUrlDark', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold dark:text-white">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">Configure your application preferences</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg font-medium">
           {saved ? <Check size={20} /> : <Save size={20} />} {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-bold dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">Company Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Company Name</label>
                <input type="text" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={settings.companyName} onChange={e => handleChange('companyName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Support Email</label>
                <input type="email" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={settings.companyEmail} onChange={e => handleChange('companyEmail', e.target.value)} />
              </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2">Address</label>
            <textarea className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white h-24" value={settings.companyAddress} onChange={e => handleChange('companyAddress', e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Currency Symbol</label>
                <input type="text" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={settings.currencySymbol} onChange={e => handleChange('currencySymbol', e.target.value)} />
              </div>
              <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Theme</label>
                  <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl w-fit">
                      <button onClick={() => handleChange('darkMode', false)} className={`p-2 rounded-lg flex items-center gap-2 transition-all ${!settings.darkMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 dark:text-gray-400'}`}>
                          <Sun size={18} /> Light
                      </button>
                      <button onClick={() => handleChange('darkMode', true)} className={`p-2 rounded-lg flex items-center gap-2 transition-all ${settings.darkMode ? 'bg-gray-600 shadow-sm text-white' : 'text-gray-500'}`}>
                          <Moon size={18} /> Dark
                      </button>
                  </div>
              </div>
          </div>
        </div>
        
        {/* Branding & Tax */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
           <h2 className="text-xl font-bold dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">Branding & Billing</h2>
           
           <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">Light Mode Logo</label>
                    <div className="flex items-center gap-4">
                        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain border p-1 rounded" />}
                        <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium dark:text-white">
                            <Upload size={16} /> Upload
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'light')} />
                        </label>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">Dark Mode Logo</label>
                    <div className="flex items-center gap-4">
                        {settings.logoUrlDark && <img src={settings.logoUrlDark} alt="Logo" className="h-12 object-contain border p-1 rounded bg-gray-800" />}
                        <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium dark:text-white">
                            <Upload size={16} /> Upload
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'dark')} />
                        </label>
                    </div>
                </div>
           </div>

           <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Logo Size (Preview Width: {settings.logoWidth}px)</label>
                <input 
                    type="range" 
                    min="50" 
                    max="300" 
                    value={settings.logoWidth} 
                    onChange={e => handleChange('logoWidth', Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
           </div>

           <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
               <div className="flex items-center gap-3 mb-4">
                   <input type="checkbox" id="taxToggle" className="w-5 h-5 rounded text-primary-600" checked={settings.taxEnabled} onChange={e => handleChange('taxEnabled', e.target.checked)} />
                   <label htmlFor="taxToggle" className="font-bold dark:text-white">Enable Tax Calculation</label>
               </div>
               {settings.taxEnabled && (
                   <div>
                       <label className="block text-sm font-bold text-gray-500 mb-2">Tax Label</label>
                       <input type="text" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={settings.taxLabel} onChange={e => handleChange('taxLabel', e.target.value)} />
                   </div>
               )}
           </div>
        </div>

        {/* Service Catalog */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h2 className="text-xl font-bold dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 flex items-center gap-2"><Package size={24} className="text-indigo-500" /> Services & Products Catalog</h2>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Add Category */}
                 <div className="lg:col-span-1 space-y-4">
                     <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                         <h3 className="font-bold text-sm mb-3 dark:text-white">New Category</h3>
                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                placeholder="e.g. Design, Dev" 
                                className="flex-1 p-2 text-sm rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                value={newServiceCat}
                                onChange={e => setNewServiceCat(e.target.value)}
                             />
                             <button onClick={addServiceCategory} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><FolderPlus size={18}/></button>
                         </div>
                     </div>
                 </div>

                 {/* Categories & Items List */}
                 <div className="lg:col-span-2 space-y-6">
                     {settings.serviceCatalog.length === 0 && <p className="text-gray-400 text-center py-8">No services added yet. Create a category to start.</p>}
                     {settings.serviceCatalog.map(cat => (
                         <div key={cat.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                             <div className="bg-gray-50 dark:bg-gray-700/50 p-3 flex justify-between items-center">
                                 <h3 className="font-bold dark:text-white flex items-center gap-2"><Package size={16} className="text-indigo-500"/> {cat.name}</h3>
                                 <button onClick={() => deleteServiceCategory(cat.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                             </div>
                             <div className="p-4 bg-white dark:bg-gray-800">
                                 <div className="space-y-2 mb-4">
                                     {cat.items.length === 0 && <p className="text-xs text-gray-400 italic">No items in this category.</p>}
                                     {cat.items.map(item => (
                                         <div key={item.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group">
                                             <span className="dark:text-gray-300">{item.name}</span>
                                             <div className="flex items-center gap-4">
                                                 <span className="font-mono font-bold dark:text-white">{settings.currencySymbol}{item.defaultRate}</span>
                                                 <button onClick={() => deleteServiceItem(cat.id, item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                                 
                                 {/* Add Item Row */}
                                 <div className="flex gap-2 items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                                     <input 
                                        type="text" 
                                        placeholder="Item Name" 
                                        className="flex-[2] p-2 text-sm rounded-lg border dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                        value={newServiceItem.catId === cat.id ? newServiceItem.name : ''}
                                        onChange={e => setNewServiceItem({...newServiceItem, name: e.target.value, catId: cat.id})}
                                     />
                                     <input 
                                        type="number" 
                                        placeholder="Rate" 
                                        className="flex-1 p-2 text-sm rounded-lg border dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                        value={newServiceItem.catId === cat.id ? newServiceItem.rate : ''}
                                        onChange={e => setNewServiceItem({...newServiceItem, rate: Number(e.target.value), catId: cat.id})}
                                     />
                                     <button 
                                        onClick={() => addServiceItem(cat.id)}
                                        className="px-3 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg text-xs font-bold"
                                     >
                                         Add
                                     </button>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        {/* Data Synchronization */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 xl:col-span-1">
             <h2 className="text-xl font-bold dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 flex items-center gap-2"><Database size={20} className="text-green-500" /> Data Synchronization</h2>
             <div className="space-y-4">
                 <p className="text-sm text-gray-500 dark:text-gray-400">Connect a Google Sheet to sync your data. This enables real-time backup and external access.</p>
                 <div>
                     <label className="block text-sm font-bold text-gray-500 mb-2">Google Sheet Web App URL</label>
                     <input 
                        type="text" 
                        placeholder="https://script.google.com/macros/s/..." 
                        className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" 
                        value={settings.googleSheetUrl || ''} 
                        onChange={e => handleChange('googleSheetUrl', e.target.value)} 
                     />
                 </div>
                 
                 <div className="flex flex-col gap-3 mt-2">
                     <button onClick={handleConnectSync} className="flex justify-center items-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-green-900/20">
                         <RefreshCw size={18} /> Save & Connect Sync
                     </button>
                     <Link to="/backend-script" target="_blank" className="text-center inline-flex justify-center items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold hover:underline py-2">
                         <ExternalLink size={14} /> Get Backend Script Code
                     </Link>
                 </div>
             </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 xl:col-span-1">
            <h2 className="text-xl font-bold dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">Expense Categories</h2>
            <div className="flex gap-2 mb-4">
                <input type="text" placeholder="New Category" className="flex-1 p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                <button onClick={addCategory} className="bg-primary-600 text-white px-6 rounded-xl font-bold hover:bg-primary-700"><Plus size={20} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
                {settings.expenseCategories.map(cat => (
                    <span key={cat} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-2 text-sm font-medium dark:text-white group">
                        {cat}
                        <button onClick={() => removeCategory(cat)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                    </span>
                ))}
            </div>
        </div>

        {/* Follow Up Options */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 xl:col-span-2">
             <h2 className="text-xl font-bold dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 flex items-center gap-2"><Bell size={20} className="text-amber-500" /> Follow-Up Reminder Options</h2>
             <div className="flex gap-2 mb-4 items-end">
                 <div className="flex-1">
                     <label className="text-xs font-bold text-gray-500 mb-1 block">Label</label>
                     <input type="text" placeholder="e.g. 2 Days" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newFollowUpLabel} onChange={e => setNewFollowUpLabel(e.target.value)} />
                 </div>
                 <div className="w-24">
                     <label className="text-xs font-bold text-gray-500 mb-1 block">Days</label>
                     <input type="number" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newFollowUpDays} onChange={e => setNewFollowUpDays(Number(e.target.value))} />
                 </div>
                 <button onClick={addFollowUpOption} className="bg-amber-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-amber-600 h-[50px]"><Plus size={20} /></button>
             </div>
             <div className="flex flex-wrap gap-2">
                {settings.followUpOptions?.map(opt => (
                    <span key={opt.label} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-lg flex items-center gap-2 text-sm font-medium dark:text-white group">
                        {opt.label} <span className="text-xs text-amber-600 dark:text-amber-400">({opt.days}d)</span>
                        <button onClick={() => removeFollowUpOption(opt.label)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                    </span>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
