
import React, { useEffect, useState } from 'react';
import { getStaff, saveStaff, deleteStaff, getWorkLogs, saveWorkLog, deleteWorkLog, getSettings, savePayrollRun, getPayrollRuns } from '../services/dataService';
import { Staff, StaffType, WorkLog, AppSettings, PayrollRun } from '../types';
import { Plus, Trash2, Clock, DollarSign, UserCircle, Mail, Phone, Edit, Calendar, ChevronDown, ChevronUp, Coins, Upload, Building2, CheckCircle, Printer, FileText, X, Search, Image as ImageIcon } from 'lucide-react';
import { format, isSameMonth, parseISO, subMonths, addMonths } from 'date-fns';
import { PaySlipPreview } from '../components/PaySlipPreview';
import { useToast } from '../context/ToastContext';

export const StaffList = () => {
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const { addToast } = useToast();
  
  // UI State
  const [activeTab, setActiveTab] = useState<'staff' | 'timesheets' | 'payroll'>('staff');
  
  // Staff Edit Modal
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Partial<Staff>>({});
  const [staffModalTab, setStaffModalTab] = useState<'profile' | 'employment' | 'banking'>('profile');
  
  // Time Log Modal
  const [isLoggingTime, setIsLoggingTime] = useState(false);
  const [currentLog, setCurrentLog] = useState<Partial<WorkLog>>({});
  
  // Payroll State
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [payrollAdjustments, setPayrollAdjustments] = useState<Record<string, { bonus: number, deductions: number }>>({});
  const [viewSlip, setViewSlip] = useState<{run: PayrollRun, staff: Staff} | null>(null);

  useEffect(() => {
    const load = async () => {
        setStaffMembers(await getStaff());
        setWorkLogs(await getWorkLogs());
        setPayrollRuns(await getPayrollRuns());
        setSettings(getSettings());
    };
    load();
  }, []);

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const staff: Staff = {
        id: currentStaff.id || crypto.randomUUID(),
        name: currentStaff.name!,
        role: currentStaff.role!,
        email: currentStaff.email || '',
        phone: currentStaff.phone || '',
        address: currentStaff.address || '',
        department: currentStaff.department || '',
        status: currentStaff.status || 'active',
        joinDate: currentStaff.joinDate || '',
        photoUrl: currentStaff.photoUrl || '',
        type: currentStaff.type || 'full_time',
        salary: Number(currentStaff.salary) || 0,
        hourlyRate: Number(currentStaff.hourlyRate) || 0,
        bankDetails: currentStaff.bankDetails,
        notes: currentStaff.notes || '',
        createdAt: currentStaff.createdAt || new Date().toISOString()
    };
    setStaffMembers(await saveStaff(staff));
    setIsEditingStaff(false);
    setCurrentStaff({});
    addToast('Staff profile saved successfully');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setCurrentStaff(prev => ({ ...prev, photoUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDeleteStaff = async (id: string) => {
      if(confirm("Delete staff member?")) {
          setStaffMembers(await deleteStaff(id));
          addToast('Staff deleted');
      }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!currentLog.staffId) return;
      const log: WorkLog = {
          id: currentLog.id || crypto.randomUUID(),
          staffId: currentLog.staffId,
          date: currentLog.date || new Date().toISOString().split('T')[0],
          hours: Number(currentLog.hours) || 0,
          description: currentLog.description || '',
          createdAt: currentLog.createdAt || new Date().toISOString()
      };
      setWorkLogs(await saveWorkLog(log));
      setIsLoggingTime(false);
      setCurrentLog({});
      addToast('Time log saved');
  };

  const handleDeleteLog = async (id: string) => {
      if(confirm("Delete log?")) setWorkLogs(await deleteWorkLog(id));
  };

  const openEditStaff = (s?: Staff) => {
      setCurrentStaff(s || { type: 'full_time', salary: 0, hourlyRate: 0, status: 'active' });
      setStaffModalTab('profile');
      setIsEditingStaff(true);
  };

  const openLogTime = () => {
      setCurrentLog({ date: new Date().toISOString().split('T')[0], hours: 0 });
      setIsLoggingTime(true);
  };

  // --- Payroll Logic ---
  const getStaffName = (id: string) => staffMembers.find(s => s.id === id)?.name || 'Unknown';

  const calculatePayroll = (staff: Staff) => {
      const currentMonthDate = parseISO(selectedMonth + '-01');
      if (staff.type === 'full_time') {
          return staff.salary / 12;
      } else {
          const monthLogs = workLogs.filter(l => l.staffId === staff.id && isSameMonth(parseISO(l.date), currentMonthDate));
          const totalHours = monthLogs.reduce((sum, l) => sum + l.hours, 0);
          return totalHours * staff.hourlyRate;
      }
  };

  const getHoursWorked = (staffId: string) => {
      const currentMonthDate = parseISO(selectedMonth + '-01');
      return workLogs
        .filter(l => l.staffId === staffId && isSameMonth(parseISO(l.date), currentMonthDate))
        .reduce((sum, l) => sum + l.hours, 0);
  };

  const handleRunPayroll = async (staffId: string) => {
      const staff = staffMembers.find(s => s.id === staffId);
      if (!staff) return;
      
      const existing = payrollRuns.find(p => p.staffId === staffId && p.month === selectedMonth);
      const baseAmount = calculatePayroll(staff);
      const adj = payrollAdjustments[staffId] || { bonus: 0, deductions: 0 };
      const total = baseAmount + adj.bonus - adj.deductions;

      const run: PayrollRun = {
          id: existing?.id || crypto.randomUUID(),
          month: selectedMonth,
          staffId: staff.id,
          baseAmount,
          bonus: adj.bonus,
          deductions: adj.deductions,
          total,
          status: existing?.status || 'draft',
          paidDate: existing?.paidDate,
          createdAt: new Date().toISOString()
      };

      setPayrollRuns(await savePayrollRun(run));
      addToast('Payroll saved');
  };

  const handleMarkPaid = async (run: PayrollRun) => {
      const updated: PayrollRun = { ...run, status: 'paid', paidDate: new Date().toISOString() };
      setPayrollRuns(await savePayrollRun(updated));
      addToast('Marked as paid');
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
      const current = parseISO(selectedMonth + '-01');
      const newDate = direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
      setSelectedMonth(format(newDate, 'yyyy-MM'));
  };

  if (viewSlip && settings) {
      return <PaySlipPreview run={viewSlip.run} staff={viewSlip.staff} settings={settings} onClose={() => setViewSlip(null)} />;
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center mt-14 md:mt-0 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Staff & Payroll</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage employees, time, and compensation</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
            <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'staff' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}><UserCircle size={16}/> Staff</button>
            <button onClick={() => setActiveTab('timesheets')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'timesheets' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}><Clock size={16}/> Time Sheets</button>
            <button onClick={() => setActiveTab('payroll')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'payroll' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}><Coins size={16}/> Payroll Center</button>
        </div>
      </div>

      {activeTab === 'staff' && (
          <>
            <div className="flex justify-end">
                <button onClick={() => openEditStaff()} className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium shadow-lg shadow-gray-900/20">
                    <Plus size={20} /> Add Staff
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffMembers.length === 0 && <p className="col-span-3 text-center text-gray-400 py-10">No staff members added.</p>}
                {staffMembers.map(s => (
                    <div key={s.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${s.status === 'active' ? 'bg-green-500' : s.status === 'on_leave' ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                        <div className="flex justify-between items-start mb-4 pl-3">
                             <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-600 shadow-sm">
                                     {s.photoUrl ? <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" /> : <UserCircle size={32} className="text-gray-400" />}
                                 </div>
                                 <div>
                                     <h3 className="font-bold dark:text-white text-lg leading-tight">{s.name}</h3>
                                     <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{s.role}</p>
                                     <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status.replace('_', ' ')}</span>
                                 </div>
                             </div>
                             <button onClick={() => openEditStaff(s)} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"><Edit size={16} /></button>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6 pl-3">
                            <div className="flex items-center gap-3"><Mail size={14} className="text-gray-400"/> {s.email || '—'}</div>
                            <div className="flex items-center gap-3"><Phone size={14} className="text-gray-400"/> {s.phone || '—'}</div>
                            {s.department && <div className="flex items-center gap-3"><Building2 size={14} className="text-gray-400"/> {s.department}</div>}
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center pl-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-0.5">Employment</p>
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded font-medium capitalize">{s.type.replace('_', ' ')}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 mb-0.5">Compensation</p>
                                <p className="font-bold dark:text-white text-sm">
                                    {settings?.currencySymbol}
                                    {s.type === 'contract' || s.type === 'part_time' ? `${s.hourlyRate}/hr` : `${(s.salary/12).toFixed(0)}/mo`}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </>
      )}

      {activeTab === 'timesheets' && (
          <>
            <div className="flex justify-end">
                 <button onClick={() => openLogTime()} className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium shadow-lg shadow-gray-900/20">
                    <Clock size={20} /> Log Work Hours
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                 <table className="w-full text-left">
                     <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
                         <tr>
                             <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                             <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Staff Member</th>
                             <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Description</th>
                             <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Duration</th>
                             <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                         {workLogs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No logs recorded yet.</td></tr>}
                         {workLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                             <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                 <td className="px-6 py-4 text-sm dark:text-gray-300 font-medium">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                                 <td className="px-6 py-4">
                                     <div className="font-bold dark:text-white text-sm">{getStaffName(log.staffId)}</div>
                                 </td>
                                 <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{log.description}</td>
                                 <td className="px-6 py-4">
                                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                         {log.hours} hours
                                     </span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                     <button onClick={() => handleDeleteLog(log.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
            </div>
          </>
      )}

      {activeTab === 'payroll' && (
          <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                       <button onClick={() => handleMonthChange('prev')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><ChevronDown className="rotate-90" size={20} /></button>
                       <div className="text-center">
                           <p className="text-xs text-gray-500 font-bold uppercase">Payroll Period</p>
                           <h2 className="text-xl font-bold dark:text-white">{format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}</h2>
                       </div>
                       <button onClick={() => handleMonthChange('next')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><ChevronDown className="-rotate-90" size={20} /></button>
                   </div>
                   <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500">Total Payout</p>
                            <p className="font-bold text-lg dark:text-white">
                                {settings?.currencySymbol}
                                {payrollRuns.filter(p => p.month === selectedMonth).reduce((sum, p) => sum + p.total, 0).toFixed(2)}
                            </p>
                        </div>
                   </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-left">
                         <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
                             <tr>
                                 <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase w-1/4">Employee</th>
                                 <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Base Pay</th>
                                 <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right w-32">Bonus</th>
                                 <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right w-32">Deductions</th>
                                 <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Net Pay</th>
                                 <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                                 <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                             {staffMembers.filter(s => s.status !== 'inactive').map(staff => {
                                 const existingRun = payrollRuns.find(p => p.staffId === staff.id && p.month === selectedMonth);
                                 const basePay = existingRun ? existingRun.baseAmount : calculatePayroll(staff);
                                 const adj = payrollAdjustments[staff.id] || { bonus: 0, deductions: 0 };
                                 
                                 // If saved run exists, use its values, otherwise calculate
                                 const displayBonus = existingRun ? existingRun.bonus : adj.bonus;
                                 const displayDeductions = existingRun ? existingRun.deductions : adj.deductions;
                                 const netPay = existingRun ? existingRun.total : (basePay + displayBonus - displayDeductions);

                                 return (
                                    <tr key={staff.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${existingRun ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                                    {staff.photoUrl ? <img src={staff.photoUrl} className="w-full h-full object-cover"/> : <UserCircle size={32} className="text-gray-400"/>}
                                                </div>
                                                <div>
                                                    <p className="font-bold dark:text-white text-sm">{staff.name}</p>
                                                    <p className="text-xs text-gray-500">{staff.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {settings?.currencySymbol}{basePay.toFixed(2)}
                                            {staff.type !== 'full_time' && <div className="text-[10px] text-gray-400">({getHoursWorked(staff.id)} hrs)</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {existingRun ? (
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{displayBonus.toFixed(2)}</span>
                                            ) : (
                                                <input 
                                                    type="number" 
                                                    className="w-24 p-1 text-right text-sm border rounded bg-transparent" 
                                                    placeholder="0.00"
                                                    value={adj.bonus || ''}
                                                    onChange={e => setPayrollAdjustments({...payrollAdjustments, [staff.id]: { ...adj, bonus: Number(e.target.value) }})}
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {existingRun ? (
                                                 <span className="text-sm text-gray-600 dark:text-gray-400">{displayDeductions.toFixed(2)}</span>
                                            ) : (
                                                <input 
                                                    type="number" 
                                                    className="w-24 p-1 text-right text-sm border rounded bg-transparent text-red-500" 
                                                    placeholder="0.00"
                                                    value={adj.deductions || ''}
                                                    onChange={e => setPayrollAdjustments({...payrollAdjustments, [staff.id]: { ...adj, deductions: Number(e.target.value) }})}
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                            {settings?.currencySymbol}{netPay.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {existingRun ? (
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${existingRun.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {existingRun.status}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {!existingRun ? (
                                                    <button onClick={() => handleRunPayroll(staff.id)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors">
                                                        Save
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => setViewSlip({run: existingRun, staff})} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="View Slip">
                                                            <Printer size={16}/>
                                                        </button>
                                                        {existingRun.status !== 'paid' && (
                                                            <button onClick={() => handleMarkPaid(existingRun)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark Paid">
                                                                <CheckCircle size={16}/>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                 );
                             })}
                         </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Add/Edit Staff Modal */}
      {isEditingStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                   <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750">
                       <h2 className="text-xl font-bold dark:text-white">{currentStaff.id ? 'Edit Profile' : 'New Staff Member'}</h2>
                       <button onClick={() => setIsEditingStaff(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                   </div>
                   
                   <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
                       <button onClick={() => setStaffModalTab('profile')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${staffModalTab === 'profile' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Profile</button>
                       <button onClick={() => setStaffModalTab('employment')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${staffModalTab === 'employment' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Employment</button>
                       <button onClick={() => setStaffModalTab('banking')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${staffModalTab === 'banking' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Banking Details</button>
                   </div>

                   <form onSubmit={handleSaveStaff} className="overflow-y-auto p-6 flex-1">
                       {staffModalTab === 'profile' && (
                           <div className="space-y-6">
                               <div className="flex items-center gap-6">
                                   <div className="relative group shrink-0">
                                       <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                                           {currentStaff.photoUrl ? <img src={currentStaff.photoUrl} className="w-full h-full object-cover" /> : <UserCircle size={40} className="text-gray-400" />}
                                       </div>
                                       <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                                           <Upload size={20} />
                                           <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                       </label>
                                   </div>
                                   <div className="flex-1 space-y-4">
                                       <input type="text" placeholder="Full Name" required className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.name || ''} onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})} />
                                       <input type="text" placeholder="Role / Position" required className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.role || ''} onChange={e => setCurrentStaff({...currentStaff, role: e.target.value})} />
                                   </div>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-4">
                                   <input type="email" placeholder="Email Address" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.email || ''} onChange={e => setCurrentStaff({...currentStaff, email: e.target.value})} />
                                   <input type="text" placeholder="Phone Number" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.phone || ''} onChange={e => setCurrentStaff({...currentStaff, phone: e.target.value})} />
                               </div>
                               <textarea placeholder="Address" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={2} value={currentStaff.address || ''} onChange={e => setCurrentStaff({...currentStaff, address: e.target.value})} />
                           </div>
                       )}

                       {staffModalTab === 'employment' && (
                           <div className="space-y-5">
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 mb-1">Employment Type</label>
                                       <select className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.type} onChange={e => setCurrentStaff({...currentStaff, type: e.target.value as StaffType})}>
                                           <option value="full_time">Full Time</option>
                                           <option value="part_time">Part Time</option>
                                           <option value="contract">Contractor</option>
                                       </select>
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                                       <select className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.status} onChange={e => setCurrentStaff({...currentStaff, status: e.target.value as any})}>
                                           <option value="active">Active</option>
                                           <option value="on_leave">On Leave</option>
                                           <option value="inactive">Inactive</option>
                                       </select>
                                   </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 mb-1">Department</label>
                                       <input type="text" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.department || ''} onChange={e => setCurrentStaff({...currentStaff, department: e.target.value})} placeholder="e.g. Engineering" />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 mb-1">Join Date</label>
                                       <input type="date" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.joinDate || ''} onChange={e => setCurrentStaff({...currentStaff, joinDate: e.target.value})} />
                                   </div>
                               </div>

                               <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                                   <h4 className="font-bold text-sm mb-3 dark:text-white">Compensation</h4>
                                   <div className="grid grid-cols-2 gap-4">
                                       <div>
                                           <label className="block text-xs font-bold text-gray-500 mb-1">Annual Salary</label>
                                           <input type="number" className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-600 dark:text-white" value={currentStaff.salary || ''} onChange={e => setCurrentStaff({...currentStaff, salary: Number(e.target.value)})} placeholder="0.00" />
                                       </div>
                                       <div>
                                           <label className="block text-xs font-bold text-gray-500 mb-1">Hourly Rate</label>
                                           <input type="number" className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:border-gray-600 dark:text-white" value={currentStaff.hourlyRate || ''} onChange={e => setCurrentStaff({...currentStaff, hourlyRate: Number(e.target.value)})} placeholder="0.00" />
                                       </div>
                                   </div>
                               </div>
                           </div>
                       )}

                       {staffModalTab === 'banking' && (
                           <div className="space-y-5">
                               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                                   <p className="text-sm text-blue-800 dark:text-blue-300">These details will be used for payslip generation.</p>
                               </div>
                               <input type="text" placeholder="Bank Name" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.bankDetails?.bankName || ''} onChange={e => setCurrentStaff({...currentStaff, bankDetails: {...currentStaff.bankDetails!, bankName: e.target.value}})} />
                               <input type="text" placeholder="Account Name" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.bankDetails?.accountName || ''} onChange={e => setCurrentStaff({...currentStaff, bankDetails: {...currentStaff.bankDetails!, accountName: e.target.value}})} />
                               <div className="grid grid-cols-2 gap-4">
                                   <input type="text" placeholder="Account Number / IBAN" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.bankDetails?.accountNumber || ''} onChange={e => setCurrentStaff({...currentStaff, bankDetails: {...currentStaff.bankDetails!, accountNumber: e.target.value}})} />
                                   <input type="text" placeholder="SWIFT / Sort Code" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentStaff.bankDetails?.swiftCode || ''} onChange={e => setCurrentStaff({...currentStaff, bankDetails: {...currentStaff.bankDetails!, swiftCode: e.target.value}})} />
                               </div>
                               <textarea placeholder="Internal Notes" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white mt-4" rows={3} value={currentStaff.notes || ''} onChange={e => setCurrentStaff({...currentStaff, notes: e.target.value})} />
                           </div>
                       )}
                   </form>

                   <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-750">
                       <button onClick={() => setIsEditingStaff(false)} className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium">Cancel</button>
                       <button onClick={handleSaveStaff} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/30">Save Profile</button>
                   </div>
              </div>
          </div>
      )}

      {/* Log Time Modal */}
      {isLoggingTime && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
               <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                   <h2 className="text-xl font-bold mb-6 dark:text-white">Log Work Hours</h2>
                   <form onSubmit={handleSaveLog} className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Staff Member</label>
                           <select required className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentLog.staffId || ''} onChange={e => setCurrentLog({...currentLog, staffId: e.target.value})}>
                               <option value="">Select Staff...</option>
                               {staffMembers.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                           <input type="date" required className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentLog.date} onChange={e => setCurrentLog({...currentLog, date: e.target.value})} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Hours Worked</label>
                           <input type="number" step="0.5" required className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentLog.hours || ''} onChange={e => setCurrentLog({...currentLog, hours: Number(e.target.value)})} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                           <input type="text" placeholder="What did they work on?" className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={currentLog.description || ''} onChange={e => setCurrentLog({...currentLog, description: e.target.value})} />
                       </div>
                       
                       <div className="flex gap-3 mt-6">
                           <button type="button" onClick={() => setIsLoggingTime(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-medium">Cancel</button>
                           <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">Save Log</button>
                       </div>
                   </form>
               </div>
          </div>
      )}
    </div>
  );
};
