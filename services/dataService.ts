
import { Invoice, Expense, Client, Project, AppSettings, DEFAULT_SETTINGS, Reminder, Staff, WorkLog, PayrollRun } from '../types';
import { addYears, addMonths, addWeeks, addDays, format } from 'date-fns';

const STORAGE_KEY_INVOICES = 'invoicify_data';
const STORAGE_KEY_EXPENSES = 'invoicify_expenses';
const STORAGE_KEY_CLIENTS = 'invoicify_clients';
const STORAGE_KEY_PROJECTS = 'invoicify_projects';
const STORAGE_KEY_REMINDERS = 'invoicify_reminders';
const STORAGE_KEY_STAFF = 'invoicify_staff';
const STORAGE_KEY_WORKLOGS = 'invoicify_worklogs';
const STORAGE_KEY_PAYROLL = 'invoicify_payroll';
const SETTINGS_KEY = 'invoicify_settings';

// --- Sync State Management ---
type SyncListener = (isSyncing: boolean) => void;
let syncListener: SyncListener | null = null;

export const setSyncListener = (listener: SyncListener) => {
  syncListener = listener;
};

const setLoading = (loading: boolean) => {
  if (syncListener) syncListener(loading);
};

// --- In-Memory Cache ---
const cache: Record<string, any[]> = {};

// --- Helper: Local Storage Operations ---

const getLocal = <T>(key: string): T[] => {
  if (cache[key]) return cache[key] as T[];
  const data = localStorage.getItem(key);
  const parsed = data ? JSON.parse(data) : [];
  cache[key] = parsed;
  return parsed;
};

const saveLocal = <T>(key: string, data: T[]) => {
  cache[key] = data;
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Helper: Google Sheets Operations ---

const syncWithSheet = async (url: string, action: 'GET' | 'SYNC', sheetName: string, payload?: any[]) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors', 
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, sheet: sheetName, payload }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Sheet Sync Error (${sheetName})`, error);
    throw error;
  }
};

// --- Main Service Methods ---

export const getSettings = (): AppSettings => {
  const s = localStorage.getItem(SETTINGS_KEY);
  const parsed = s ? JSON.parse(s) : {};
  return { 
    ...DEFAULT_SETTINGS, 
    ...parsed, 
    expenseCategories: parsed.expenseCategories || DEFAULT_SETTINGS.expenseCategories,
    logoWidth: parsed.logoWidth || DEFAULT_SETTINGS.logoWidth,
    followUpOptions: parsed.followUpOptions || DEFAULT_SETTINGS.followUpOptions,
    serviceCatalog: parsed.serviceCatalog || DEFAULT_SETTINGS.serviceCatalog
  };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// --- Generic CRUD Helper ---

// Modified to prioritize Sheet Data (Act as DB)
async function genericGet<T>(key: string, sheetName: string): Promise<T[]> {
  const settings = getSettings();
  
  // 1. If Google Sheet is connected, try to fetch fresh data first (Realtime DB behavior)
  if (settings.googleSheetUrl) {
    setLoading(true);
    try {
      const result = await syncWithSheet(settings.googleSheetUrl, 'GET', sheetName);
      if (result && result.status === 'success' && Array.isArray(result.data)) {
         // Update local storage with the fresh truth from DB
         saveLocal(key, result.data);
         setLoading(false);
         return result.data; 
      }
    } catch (error) {
      console.warn(`Failed to fetch from sheet ${sheetName}, falling back to local.`, error);
      // Fallthrough to local if offline or error
    }
    setLoading(false);
  }

  // 2. Return local data (Fallback or if no DB configured)
  return getLocal<T>(key);
}

async function genericSave<T extends { id: string }>(key: string, sheetName: string, item: T, isNew: boolean = false): Promise<T[]> {
  const items = getLocal<T>(key);
  const index = items.findIndex(i => i.id === item.id);
  let newItems = [...items];
  
  const itemWithTs: any = { ...item, updatedAt: new Date().toISOString() };
  if (isNew || !itemWithTs.createdAt) {
     itemWithTs.createdAt = new Date().toISOString();
  }

  if (index >= 0) newItems[index] = itemWithTs;
  else newItems.push(itemWithTs);
  
  // 1. Optimistic Update (Local)
  saveLocal(key, newItems);
  
  // 2. DB Update (Sheet)
  const settings = getSettings();
  if (settings.googleSheetUrl) {
    setLoading(true);
    try {
      await syncWithSheet(settings.googleSheetUrl, 'SYNC', sheetName, newItems);
    } catch (error) {
      console.error("Failed to save to sheet", error);
      alert("Warning: Could not save to Google Sheet. Data saved locally only.");
    }
    setLoading(false);
  }
  
  return newItems;
}

async function genericDelete<T extends { id: string }>(key: string, sheetName: string, id: string): Promise<T[]> {
  const items = getLocal<T>(key);
  const newItems = items.filter(i => i.id !== id);
  
  // 1. Optimistic Update
  saveLocal(key, newItems);
  
  // 2. DB Update
  const settings = getSettings();
  if (settings.googleSheetUrl) {
    setLoading(true);
    try {
        await syncWithSheet(settings.googleSheetUrl, 'SYNC', sheetName, newItems);
    } catch (error) {
        console.error("Failed to delete from sheet", error);
        alert("Warning: Could not delete from Google Sheet. Deleted locally only.");
    }
    setLoading(false);
  }
  return newItems;
}

// --- Invoice Operations ---
export const getInvoices = () => genericGet<Invoice>(STORAGE_KEY_INVOICES, 'Invoices');
export const deleteInvoice = (id: string) => genericDelete<Invoice>(STORAGE_KEY_INVOICES, 'Invoices', id);
export const saveInvoice = async (invoice: Invoice): Promise<Invoice[]> => {
  const result = await genericSave<Invoice>(STORAGE_KEY_INVOICES, 'Invoices', invoice);
  
  // Handle Side Effects (Reminders) - These are local logic but saveReminder triggers DB sync too
  if (invoice.enableRenewal && invoice.renewalDate) {
    const reminders = getLocal<Reminder>(STORAGE_KEY_REMINDERS); // Get local to avoid double fetch
    const existing = reminders.find(r => r.relatedId === invoice.id && r.type === 'renewal');
    const reminder: Reminder = {
        id: existing ? existing.id : crypto.randomUUID(),
        title: `Renew Invoice #${invoice.number} for ${invoice.clientName}`,
        date: invoice.renewalDate,
        type: 'renewal',
        relatedId: invoice.id,
        status: existing?.status || 'pending',
        createdAt: new Date().toISOString()
    };
    await saveReminder(reminder);
  }

  if (invoice.type === 'estimate' && invoice.enableFollowUp) {
    let fDate = invoice.followUpDate;
    const settings = getSettings();
    const opt = settings.followUpOptions.find(o => o.label === invoice.followUpDuration);
    if (opt && invoice.date) {
        fDate = format(addDays(new Date(invoice.date), opt.days), 'yyyy-MM-dd');
    } else if (invoice.followUpDuration === '3_days' && invoice.date) {
        fDate = format(addDays(new Date(invoice.date), 3), 'yyyy-MM-dd');
    } 

    if (fDate) {
        const reminders = getLocal<Reminder>(STORAGE_KEY_REMINDERS);
        const existing = reminders.find(r => r.relatedId === invoice.id && r.type === 'followup');
        const reminder: Reminder = {
            id: existing ? existing.id : crypto.randomUUID(),
            title: `Follow up on Estimate #${invoice.number} for ${invoice.clientName}`,
            date: fDate,
            type: 'followup',
            relatedId: invoice.id,
            status: existing?.status || 'pending',
            createdAt: new Date().toISOString()
        };
        await saveReminder(reminder);
    }
  }
  return result;
};

export const generateRenewalInvoice = async (originalInvoiceId: string): Promise<Invoice | null> => {
    const invoices = await getInvoices();
    const original = invoices.find(i => i.id === originalInvoiceId);
    if (!original) return null;

    const newDate = new Date();
    const newRenewalDate = addYears(newDate, 1);
    
    const newInvoice: Invoice = {
        ...original,
        id: crypto.randomUUID(),
        number: `${original.number}-REN`,
        date: format(newDate, 'yyyy-MM-dd'),
        dueDate: format(addWeeks(newDate, 2), 'yyyy-MM-dd'),
        renewalDate: format(newRenewalDate, 'yyyy-MM-dd'),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: original.items.map(item => ({...item, id: crypto.randomUUID()}))
    };
    await saveInvoice(newInvoice);
    return newInvoice;
};

// --- Expense Operations ---
export const getExpenses = () => genericGet<Expense>(STORAGE_KEY_EXPENSES, 'Expenses');
export const deleteExpense = (id: string) => genericDelete<Expense>(STORAGE_KEY_EXPENSES, 'Expenses', id);
export const saveExpense = async (expense: Expense): Promise<Expense[]> => {
  const result = await genericSave<Expense>(STORAGE_KEY_EXPENSES, 'Expenses', expense);

  if (expense.isRecurring && expense.frequency && expense.frequency !== 'none') {
    let nextDate = new Date(expense.date);
    if (expense.frequency === 'daily') nextDate = addDays(nextDate, 1);
    if (expense.frequency === 'weekly') nextDate = addWeeks(nextDate, 1);
    if (expense.frequency === 'monthly') nextDate = addMonths(nextDate, 1);
    if (expense.frequency === 'yearly') nextDate = addYears(nextDate, 1);

    const nextDateStr = format(nextDate, 'yyyy-MM-dd');
    const reminders = getLocal<Reminder>(STORAGE_KEY_REMINDERS);
    const existing = reminders.find(r => r.relatedId === expense.id && r.type === 'expense' && r.status === 'pending');
    
    const reminder: Reminder = {
        id: existing ? existing.id : crypto.randomUUID(),
        title: `Recurring Expense: ${expense.description} (${expense.frequency})`,
        date: nextDateStr,
        type: 'expense',
        relatedId: expense.id,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    await saveReminder(reminder);
  }
  return result;
};

// --- Client Operations ---
export const getClients = () => genericGet<Client>(STORAGE_KEY_CLIENTS, 'Clients');
export const saveClient = (client: Client) => genericSave<Client>(STORAGE_KEY_CLIENTS, 'Clients', client);
export const deleteClient = (id: string) => genericDelete<Client>(STORAGE_KEY_CLIENTS, 'Clients', id);

// --- Project Operations ---
export const getProjects = () => genericGet<Project>(STORAGE_KEY_PROJECTS, 'Projects');
export const saveProject = (project: Project) => genericSave<Project>(STORAGE_KEY_PROJECTS, 'Projects', project);
export const deleteProject = (id: string) => genericDelete<Project>(STORAGE_KEY_PROJECTS, 'Projects', id);

// --- Reminder Operations ---
export const getReminders = () => genericGet<Reminder>(STORAGE_KEY_REMINDERS, 'Reminders');
export const saveReminder = (reminder: Reminder) => genericSave<Reminder>(STORAGE_KEY_REMINDERS, 'Reminders', reminder);
export const deleteReminder = (id: string) => genericDelete<Reminder>(STORAGE_KEY_REMINDERS, 'Reminders', id);

// --- Staff Operations ---
export const getStaff = () => genericGet<Staff>(STORAGE_KEY_STAFF, 'Staff');
export const saveStaff = (staff: Staff) => genericSave<Staff>(STORAGE_KEY_STAFF, 'Staff', staff);
export const deleteStaff = (id: string) => genericDelete<Staff>(STORAGE_KEY_STAFF, 'Staff', id);

// --- WorkLog Operations ---
export const getWorkLogs = () => genericGet<WorkLog>(STORAGE_KEY_WORKLOGS, 'WorkLogs');
export const saveWorkLog = (log: WorkLog) => genericSave<WorkLog>(STORAGE_KEY_WORKLOGS, 'WorkLogs', log);
export const deleteWorkLog = (id: string) => genericDelete<WorkLog>(STORAGE_KEY_WORKLOGS, 'WorkLogs', id);

// --- Payroll Operations ---
export const getPayrollRuns = () => genericGet<PayrollRun>(STORAGE_KEY_PAYROLL, 'Payroll');
export const savePayrollRun = (run: PayrollRun) => genericSave<PayrollRun>(STORAGE_KEY_PAYROLL, 'Payroll', run);
export const deletePayrollRun = (id: string) => genericDelete<PayrollRun>(STORAGE_KEY_PAYROLL, 'Payroll', id);
