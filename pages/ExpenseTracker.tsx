
import React, { useEffect, useState } from 'react';
import { getExpenses, saveExpense, deleteExpense, getSettings } from '../services/dataService';
import { Expense, AppSettings, RecurrenceFrequency } from '../types';
import { Plus, Trash2, DollarSign, TrendingUp, Calendar, Tag, Edit, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: 0,
    isRecurring: false,
    frequency: 'none'
  });

  useEffect(() => {
    const load = async () => {
      const s = getSettings();
      setSettings(s);
      setExpenses(await getExpenses());
      setNewExpense(prev => ({ ...prev, category: s.expenseCategories[0] || 'Other' }));
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description) return;

    const expense: Expense = {
      id: newExpense.id || crypto.randomUUID(),
      date: newExpense.date!,
      category: newExpense.category!,
      description: newExpense.description!,
      amount: Number(newExpense.amount),
      isRecurring: newExpense.isRecurring,
      frequency: newExpense.frequency,
      createdAt: newExpense.createdAt || new Date().toISOString()
    };

    const updated = await saveExpense(expense);
    setExpenses(updated);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setNewExpense({
        id: undefined,
        date: new Date().toISOString().split('T')[0],
        category: settings?.expenseCategories[0] || 'Other',
        description: '',
        amount: 0,
        isRecurring: false,
        frequency: 'none'
    });
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Delete this expense?")) {
        const updated = await deleteExpense(id);
        setExpenses(updated);
    }
  };

  const handleEdit = (exp: Expense) => {
    setNewExpense(exp);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stats
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentMonthExpenses = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0);

  if (!settings) return null;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold dark:text-white mb-1">Expense Tracker</h1>
            <p className="text-gray-500 dark:text-gray-400">Track your business spending</p>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); if (!isAdding) resetForm(); }}
          className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-900/20 font-medium"
        >
          <Plus size={20} /> {isAdding ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-6 opacity-10">
                <DollarSign size={64} className="dark:text-white" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
            <h3 className="text-3xl font-bold mt-2 dark:text-white">{settings.currencySymbol}{totalExpenses.toFixed(2)}</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-6 opacity-10">
                <TrendingUp size={64} className="dark:text-white" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</p>
            <h3 className="text-3xl font-bold mt-2 dark:text-white">{settings.currencySymbol}{currentMonthExpenses.toFixed(2)}</h3>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-gray-50 dark:bg-gray-750 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold mb-4 dark:text-white">{newExpense.id ? 'Edit Expense' : 'New Expense'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                    <input 
                        type="date" 
                        required
                        className="w-full p-3 rounded-xl border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={newExpense.date}
                        onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                    <select 
                        className="w-full p-3 rounded-xl border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={newExpense.category}
                        onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    >
                        {settings.expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <input 
                        type="text" 
                        required
                        placeholder="e.g. Monthly Server Cost"
                        className="w-full p-3 rounded-xl border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={newExpense.description}
                        onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                    <input 
                        type="number" 
                        required
                        step="0.01"
                        className="w-full p-3 rounded-xl border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={newExpense.amount}
                        onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                    />
                </div>
                
                {/* Recurrence Options */}
                <div className="md:col-span-12 flex items-center gap-6 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-primary-600"
                            checked={newExpense.isRecurring}
                            onChange={e => setNewExpense({...newExpense, isRecurring: e.target.checked})}
                        />
                        <span className="text-sm font-medium dark:text-white">Recurring Expense</span>
                    </label>
                    
                    {newExpense.isRecurring && (
                        <div className="flex items-center gap-2 animate-in fade-in">
                            <label className="text-xs font-bold text-gray-500 uppercase">Frequency:</label>
                            <select 
                                className="p-1.5 rounded border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                value={newExpense.frequency}
                                onChange={e => setNewExpense({...newExpense, frequency: e.target.value as RecurrenceFrequency})}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="md:col-span-12 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold flex items-center gap-2">
                        <Plus size={20} /> {newExpense.id ? 'Update' : 'Save'} Expense
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {expenses.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No expenses recorded.</td></tr>
              ) : (
                  expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                {format(new Date(expense.date), 'MMM dd, yyyy')}
                            </div>
                            {expense.isRecurring && (
                                <div className="mt-1 flex items-center gap-1 text-xs text-indigo-500">
                                    <RefreshCw size={10} /> {expense.frequency}
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                <Tag size={12} /> {expense.category}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                            {expense.description}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                            {settings.currencySymbol}{expense.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button onClick={() => handleEdit(expense)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => handleDelete(expense.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-all">
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
