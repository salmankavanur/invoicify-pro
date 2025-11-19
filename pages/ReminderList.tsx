
import React, { useEffect, useState } from 'react';
import { getReminders, saveReminder, deleteReminder, generateRenewalInvoice } from '../services/dataService';
import { Reminder, ReminderType } from '../types';
import { CheckCircle, Clock, Plus, Trash2, Calendar, RefreshCw, Bell, Wallet, AlertTriangle, Play, XCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const ReminderList = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
      date: new Date().toISOString().split('T')[0],
      type: 'general',
      title: ''
  });

  useEffect(() => {
    const load = async () => setReminders(await getReminders());
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newReminder.title) return;
    
    const reminder: Reminder = {
        id: crypto.randomUUID(),
        title: newReminder.title,
        date: newReminder.date || new Date().toISOString(),
        type: newReminder.type as ReminderType,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    setReminders(await saveReminder(reminder));
    setIsAdding(false);
    setNewReminder({ date: new Date().toISOString().split('T')[0], type: 'general', title: '' });
    addToast('Reminder created successfully');
  };

  const handleComplete = async (id: string) => {
      const rem = reminders.find(r => r.id === id);
      if (rem) {
          const updated = { ...rem, status: rem.status === 'pending' ? 'completed' : 'pending' };
          // @ts-ignore
          setReminders(await saveReminder(updated));
          addToast('Reminder updated');
      }
  };

  const handleApproveRenewal = async (reminder: Reminder) => {
      if (!reminder.relatedId) return;
      if (confirm("Generate new invoice for this renewal?")) {
          const newInv = await generateRenewalInvoice(reminder.relatedId);
          if (newInv) {
              await handleComplete(reminder.id);
              addToast('Invoice generated successfully!');
              navigate(`/edit/${newInv.id}`);
          } else {
              addToast('Original invoice not found', 'error');
          }
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm("Delete reminder?")) {
          setReminders(await deleteReminder(id));
          addToast('Reminder deleted', 'info');
      }
  };

  const getTypeIcon = (type: ReminderType) => {
      switch(type) {
          case 'renewal': return <RefreshCw size={16} className="text-indigo-500"/>;
          case 'followup': return <Bell size={16} className="text-amber-500"/>;
          case 'expense': return <Wallet size={16} className="text-rose-500"/>;
          default: return <Clock size={16} className="text-gray-500"/>;
      }
  };

  const pendingReminders = reminders.filter(r => r.status === 'pending').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completedReminders = reminders.filter(r => r.status === 'completed');

  return (
    <div className="space-y-8 pb-10">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold dark:text-white">Reminders</h1>
                <p className="text-gray-500 dark:text-gray-400">Stay on top of tasks, renewals, and payments.</p>
            </div>
            <button onClick={() => setIsAdding(!isAdding)} className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium">
                <Plus size={20} /> New Reminder
            </button>
        </div>

        {isAdding && (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                 <h2 className="font-bold dark:text-white mb-4">Create New Reminder</h2>
                 <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Task</label>
                        <input type="text" required className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="What needs to be done?" value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} />
                    </div>
                    <div className="w-full md:w-48">
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                         <input type="date" required className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={newReminder.date} onChange={e => setNewReminder({...newReminder, date: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-xl font-bold">Add</button>
                 </form>
             </div>
        )}

        <div className="space-y-4">
            <h3 className="text-lg font-bold dark:text-white flex items-center gap-2"><AlertTriangle size={20} className="text-amber-500"/> Pending Tasks</h3>
            {pendingReminders.length === 0 && <p className="text-gray-400 italic">No pending reminders.</p>}
            {pendingReminders.map(r => {
                const isOverdue = isPast(new Date(r.date)) && !isToday(new Date(r.date));
                return (
                    <div key={r.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-l-4 shadow-sm gap-4 ${isOverdue ? 'border-l-red-500' : 'border-l-primary-500'}`}>
                        <div className="flex items-start gap-4">
                            <button onClick={() => handleComplete(r.id)} className="mt-1 md:mt-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-green-50 transition-all flex-shrink-0"></button>
                            <div>
                                <p className={`font-bold dark:text-white ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>{r.title}</p>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><Calendar size={12}/> {format(new Date(r.date), 'MMM dd, yyyy')}</span>
                                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">{getTypeIcon(r.type)} {r.type}</span>
                                    {isOverdue && <span className="text-red-500 font-bold text-xs">Overdue</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            {/* Auto Renewal Approval Buttons */}
                            {r.type === 'renewal' && r.relatedId && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleApproveRenewal(r)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-200">
                                        <Play size={12} fill="currentColor" /> Approve & Generate
                                    </button>
                                    <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200">
                                        <XCircle size={14} /> Decline
                                    </button>
                                </div>
                            )}
                            
                            <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-400 hover:text-red-500 ml-2"><Trash2 size={18}/></button>
                        </div>
                    </div>
                )
            })}
        </div>

        {completedReminders.length > 0 && (
            <div className="space-y-4 opacity-60">
                <h3 className="text-lg font-bold dark:text-white mt-8 flex items-center gap-2"><CheckCircle size={20} className="text-green-500"/> Completed</h3>
                {completedReminders.map(r => (
                     <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                         <div className="flex items-center gap-4">
                             <button onClick={() => handleComplete(r.id)} className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white"><CheckCircle size={14}/></button>
                             <div className="line-through text-gray-500">{r.title}</div>
                         </div>
                         <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                     </div>
                ))}
            </div>
        )}
    </div>
  );
};
