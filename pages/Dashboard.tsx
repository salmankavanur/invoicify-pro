import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { getInvoices, getExpenses, getProjects, getClients, getSettings, getReminders } from '../services/dataService';
import { analyzeFinances, analyzeRecurringExpenses } from '../services/geminiService';
import { Invoice, Expense, Project, AppSettings, Client, Reminder } from '../types';
import { DollarSign, Bell, AlertTriangle, CheckCircle, Clock, RefreshCw, TrendingUp, TrendingDown, Wallet, Sparkles, ArrowRight, Calendar, PieChart } from 'lucide-react';
import { format, isSameMonth, parseISO, addDays, isBefore, isPast, startOfYear, isSameYear } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [recurringAnalysis, setRecurringAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setInvoices(await getInvoices());
      setExpenses(await getExpenses());
      setProjects(await getProjects());
      setReminders(await getReminders());
      setSettings(getSettings());
      setLoading(false);
    };
    loadData();
  }, []);

  // --- Metrics Calculation ---
  const totalIncome = invoices.filter(i => i.status === 'paid' && i.type === 'invoice').reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'pending' && i.type === 'invoice').reduce((sum, i) => sum + i.total, 0);
  const netProfit = totalIncome - totalExpenses;

  // --- Monthly vs Yearly Expense ---
  const currentMonth = new Date();
  const monthlyExpense = expenses
    .filter(e => isSameMonth(parseISO(e.date), currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);
  
  const yearlyExpense = expenses
    .filter(e => isSameYear(parseISO(e.date), currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  // --- Recurring Expenses Breakdown ---
  const monthlyRecurringList = expenses.filter(e => e.isRecurring && e.frequency === 'monthly');
  const yearlyRecurringList = expenses.filter(e => e.isRecurring && e.frequency === 'yearly');
  const totalMonthlyRecurring = monthlyRecurringList.reduce((sum, e) => sum + e.amount, 0);
  const totalYearlyRecurring = yearlyRecurringList.reduce((sum, e) => sum + e.amount, 0);

  // --- Chart Data (Income vs Expense) ---
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = format(d, 'MMM');
    const monthIncome = invoices
      .filter(inv => inv.type === 'invoice' && inv.status === 'paid' && isSameMonth(parseISO(inv.date), d))
      .reduce((s, inv) => s + inv.total, 0);
    const monthExpense = expenses
      .filter(exp => isSameMonth(parseISO(exp.date), d))
      .reduce((s, exp) => s + exp.amount, 0);
    chartData.push({ name: monthName, Income: monthIncome, Expense: monthExpense });
  }
  
  // --- Recurring Expense Graph Data ---
  const recurringCategoryMap: Record<string, number> = {};
  [...monthlyRecurringList, ...yearlyRecurringList].forEach(e => {
      recurringCategoryMap[e.category] = (recurringCategoryMap[e.category] || 0) + e.amount;
  });
  const recurringChartData = Object.keys(recurringCategoryMap).map(key => ({
      name: key, value: recurringCategoryMap[key]
  }));

  // AI Analysis Effect
  useEffect(() => {
      if (!loading && totalIncome > 0) {
         analyzeFinances(totalIncome, totalExpenses, chartData).then(setAiAnalysis);
      }
      if (!loading && (totalMonthlyRecurring > 0 || totalYearlyRecurring > 0)) {
         analyzeRecurringExpenses(totalMonthlyRecurring, totalYearlyRecurring, [...monthlyRecurringList, ...yearlyRecurringList]).then(setRecurringAnalysis);
      }
  }, [loading, totalIncome, totalExpenses]);

  // --- Notifications Logic ---
  const notifications = [];
  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const overdueReminders = pendingReminders.filter(r => isPast(new Date(r.date)) && !isSameMonth(new Date(r.date), new Date()));
  if (overdueReminders.length > 0) notifications.push({ type: 'alert', msg: `${overdueReminders.length} Reminder(s) overdue!`, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' });
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  if (overdueCount > 0) notifications.push({ type: 'alert', msg: `${overdueCount} Invoice(s) are Overdue`, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' });

  // --- Renewals (This Month) ---
  const renewalInvoices = invoices.filter(i => i.enableRenewal && i.renewalDate && isSameMonth(parseISO(i.renewalDate), currentMonth));
  const renewalReminders = reminders.filter(r => r.type === 'renewal' && r.status === 'pending' && isSameMonth(parseISO(r.date), currentMonth));

  // --- Expense Reminders (Upcoming) ---
  const upcomingRecurringExpenses = reminders.filter(r => r.type === 'expense' && r.status === 'pending' && isBefore(parseISO(r.date), addDays(new Date(), 7)));

  const StatCard = ({ title, value, icon: Icon, trend, trendUp }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-2 dark:text-white">{settings?.currencySymbol}{value.toLocaleString()}</h3>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"><Icon size={20} /></div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-4 text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );

  if (loading || !settings) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center flex-wrap gap-4 mt-14 md:mt-0">
        <div>
            <h1 className="text-2xl font-bold dark:text-white">Dashboard</h1>
            <p className="text-gray-500 text-sm">Overview of your business performance</p>
        </div>
        <div className="flex gap-3">
            <Link to="/reminders" className="relative p-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 cursor-pointer hover:bg-gray-50 dark:text-gray-300">
                <Bell size={20} />
                {notifications.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>}
            </Link>
        </div>
      </div>

      {/* AI Analysis Banner */}
      {aiAnalysis && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
              <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={100} /></div>
              <div className="relative z-10">
                  <h3 className="font-bold flex items-center gap-2 mb-2"><Sparkles size={18} /> AI Business Insight</h3>
                  <p className="text-indigo-50 text-sm leading-relaxed max-w-3xl">{aiAnalysis}</p>
              </div>
          </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Income (YTD)" value={totalIncome} icon={DollarSign} trend="+12% vs last year" trendUp={true} />
        <StatCard title="Expenses (Monthly)" value={monthlyExpense} icon={Wallet} trend={`Yearly: ${settings.currencySymbol}${yearlyExpense.toLocaleString()}`} trendUp={false} />
        <StatCard title="Net Profit" value={netProfit} icon={CheckCircle} trend="Healthy" trendUp={true} />
        <StatCard title="Pending Invoices" value={pendingAmount} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-96">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Income & Expense Flow</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
              <XAxis dataKey="name" stroke="#9CA3AF" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '0.75rem' }}
                itemStyle={{ color: '#F3F4F6' }}
              />
              <Area type="monotone" dataKey="Income" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Notifications & Alerts */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Notifications & Alerts</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-80">
                {notifications.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-10">All caught up! No alerts.</div>
                )}
                {notifications.map((n, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl ${n.bg}`}>
                        <n.icon size={18} className={`mt-0.5 ${n.color}`} />
                        <div>
                            <p className={`text-sm font-medium ${n.color}`}>{n.msg}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Recurring Expenses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold dark:text-white flex items-center gap-2"><RefreshCw size={20} className="text-indigo-500" /> Recurring Expenses Overview</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-700 flex-1">
              
              {/* Monthly List */}
              <div className="p-6">
                  <div className="flex justify-between items-end mb-4">
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Monthly</h4>
                      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{settings.currencySymbol}{totalMonthlyRecurring.toFixed(2)}</span>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                      {monthlyRecurringList.length === 0 && <p className="text-xs text-gray-400">No monthly recurring expenses.</p>}
                      {monthlyRecurringList.map(e => (
                          <div key={e.id} className="flex justify-between items-center text-sm">
                              <span className="dark:text-gray-300">{e.description}</span>
                              <span className="font-medium dark:text-white">{settings.currencySymbol}{e.amount}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Yearly List */}
              <div className="p-6">
                  <div className="flex justify-between items-end mb-4">
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Yearly</h4>
                      <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{settings.currencySymbol}{totalYearlyRecurring.toFixed(2)}</span>
                  </div>
                   <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                      {yearlyRecurringList.length === 0 && <p className="text-xs text-gray-400">No yearly recurring expenses.</p>}
                      {yearlyRecurringList.map(e => (
                          <div key={e.id} className="flex justify-between items-center text-sm">
                              <span className="dark:text-gray-300">{e.description}</span>
                              <span className="font-medium dark:text-white">{settings.currencySymbol}{e.amount}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Graph */}
              <div className="p-6">
                   <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">By Category</h4>
                   <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={recurringChartData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '0.5rem', fontSize: '12px' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                   </div>
              </div>
          </div>
          
          {/* AI Analysis Footer for Recurring Expenses */}
          {recurringAnalysis && (
             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-sm text-indigo-800 dark:text-indigo-200 border-t border-indigo-100 dark:border-indigo-800 flex gap-3 items-start">
                 <Sparkles size={16} className="mt-1 shrink-0" />
                 <div>
                     <span className="font-bold block mb-1">AI Insight: Recurring Spend</span>
                     {recurringAnalysis}
                 </div>
             </div>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Renewals */}
        <div onClick={() => navigate('/reminders')} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-300 transition-colors group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-500" />
                    <h3 className="text-lg font-bold dark:text-white">Renewals (This Month)</h3>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors"/>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto">
                {renewalInvoices.length === 0 && renewalReminders.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No renewals due in {format(currentMonth, 'MMMM')}.</p>
                ) : (
                    <>
                    {renewalInvoices.map(inv => (
                        <div key={inv.id} className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <div>
                                <p className="text-sm font-bold dark:text-white">{inv.clientName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Invoice #{inv.number}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{settings.currencySymbol}{inv.total}</p>
                                <p className="text-xs text-indigo-500 dark:text-indigo-400">{format(parseISO(inv.renewalDate!), 'MMM dd')}</p>
                            </div>
                        </div>
                    ))}
                    </>
                )}
            </div>
        </div>

        {/* Due Expenses (Alerts) */}
        <div onClick={() => navigate('/reminders')} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-purple-300 transition-colors group">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-purple-500" />
                    <h3 className="text-lg font-bold dark:text-white">Due Recurring Expenses</h3>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-purple-500 transition-colors"/>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto">
                {upcomingRecurringExpenses.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No recurring expenses due this week.</p>
                ) : (
                    upcomingRecurringExpenses.map(rem => (
                         <div key={rem.id} className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                            <div>
                                <p className="text-sm font-bold dark:text-white truncate w-48">
                                    {rem.title.replace(/Recurring Expense:\s*/i, "")}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-purple-500 dark:text-purple-400 font-bold">{format(parseISO(rem.date), 'MMM dd')}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Project Stats (Small) */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center text-center">
             <h3 className="text-lg font-bold dark:text-white mb-4">Projects Active</h3>
             <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                 <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{projects.filter(p => p.status === 'in_progress').length}</span>
             </div>
             <Link to="/projects" className="text-sm text-blue-500 hover:underline">View Details</Link>
         </div>
      </div>
    </div>
  );
};