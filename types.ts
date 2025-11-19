

export type Status = 'draft' | 'pending' | 'paid' | 'overdue' | 'accepted' | 'rejected' | 'expired';

export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';

export type ReminderType = 'general' | 'renewal' | 'followup' | 'expense';

export type StaffType = 'full_time' | 'part_time' | 'contract';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  type: 'invoice' | 'estimate';
  number: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  items: LineItem[];
  notes?: string;
  status: Status;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  currency: string;
  enableRenewal?: boolean;
  renewalDate?: string;
  enableFollowUp?: boolean;
  followUpDuration?: string; // value in days stored as string or code
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  receiptUrl?: string; 
  isRecurring?: boolean;
  frequency?: RecurrenceFrequency;
  nextDueDate?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  website?: string;
  notes?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  deadline: string;
  budget: number;
  description?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  type: ReminderType;
  relatedId?: string; // ID of invoice, client, or expense
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface BankDetails {
    bankName: string;
    accountNumber: string;
    accountName: string;
    swiftCode?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  photoUrl?: string;
  department?: string;
  address?: string;
  joinDate?: string;
  status: 'active' | 'inactive' | 'on_leave';
  type: StaffType;
  salary: number; // Annual or Monthly fixed
  hourlyRate: number;
  bankDetails?: BankDetails;
  notes?: string;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  staffId: string;
  date: string;
  hours: number;
  description: string;
  createdAt: string;
}

export interface PayrollRun {
    id: string;
    month: string; // YYYY-MM
    staffId: string;
    baseAmount: number;
    bonus: number;
    deductions: number;
    total: number;
    status: 'draft' | 'paid';
    paidDate?: string;
    createdAt: string;
}

export interface FollowUpOption {
  label: string;
  days: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  defaultRate: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  items: ServiceItem[];
}

export interface AppSettings {
  googleSheetUrl?: string;
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  currencySymbol: string;
  darkMode: boolean;
  logoUrl?: string;
  logoUrlDark?: string;
  logoWidth: number;
  taxEnabled: boolean;
  taxLabel: string;
  expenseCategories: string[];
  followUpOptions: FollowUpOption[];
  serviceCatalog: ServiceCategory[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'My Company Inc.',
  companyEmail: 'billing@mycompany.com',
  companyAddress: '123 Business Rd, Tech City',
  currencySymbol: '$',
  darkMode: false,
  taxEnabled: true,
  taxLabel: 'Tax',
  logoWidth: 150,
  expenseCategories: ['Office Supplies', 'Travel', 'Software', 'Marketing', 'Utilities', 'Rent', 'Other'],
  followUpOptions: [
    { label: '3 Days', days: 3 },
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 }
  ],
  serviceCatalog: []
};
