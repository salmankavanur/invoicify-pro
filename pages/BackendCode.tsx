

import React from 'react';
import { Copy, ArrowLeft, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export const APPS_SCRIPT_CODE = `function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let action = 'GET';
    let sheetName = 'Invoices';
    let payload = null;

    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      action = data.action;
      sheetName = data.sheet || 'Invoices';
      payload = data.payload;
    } else if (e.parameter.action) {
      action = e.parameter.action;
      sheetName = e.parameter.sheet || 'Invoices';
    }

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      let headers = [];
      if (sheetName === 'Invoices') headers = ['id', 'type', 'number', 'date', 'clientName', 'total', 'status', 'json_data', 'updatedAt'];
      else if (sheetName === 'Expenses') headers = ['id', 'date', 'category', 'description', 'amount', 'isRecurring', 'frequency', 'createdAt'];
      else if (sheetName === 'Clients') headers = ['id', 'name', 'companyName', 'email', 'phone', 'address', 'taxId', 'notes', 'createdAt'];
      else if (sheetName === 'Projects') headers = ['id', 'name', 'clientName', 'status', 'deadline', 'budget', 'description', 'createdAt'];
      else if (sheetName === 'Reminders') headers = ['id', 'title', 'date', 'type', 'relatedId', 'status', 'createdAt'];
      else if (sheetName === 'Staff') headers = ['id', 'name', 'role', 'email', 'phone', 'type', 'salary', 'hourlyRate', 'department', 'status', 'json_data', 'createdAt'];
      else if (sheetName === 'WorkLogs') headers = ['id', 'staffId', 'date', 'hours', 'description', 'createdAt'];
      else if (sheetName === 'Payroll') headers = ['id', 'month', 'staffId', 'total', 'status', 'paidDate', 'json_data', 'createdAt'];

      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    let result = { status: 'success', data: [] };
    if (action === 'GET') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const cols = sheet.getLastColumn();
        const rows = sheet.getRange(2, 1, lastRow - 1, cols).getValues();
        if (sheetName === 'Invoices') result.data = rows.map(row => { try { return row[7] ? JSON.parse(row[7]) : null; } catch (err) { return null; } }).filter(Boolean);
        else if (sheetName === 'Expenses') result.data = rows.map(row => ({ id: row[0], date: row[1], category: row[2], description: row[3], amount: row[4], isRecurring: row[5], frequency: row[6], createdAt: row[7] }));
        else if (sheetName === 'Clients') result.data = rows.map(row => ({ id: row[0], name: row[1], companyName: row[2], email: row[3], phone: row[4], address: row[5], taxId: row[6], notes: row[7], createdAt: row[8] }));
        else if (sheetName === 'Projects') result.data = rows.map(row => ({ id: row[0], name: row[1], clientName: row[2], status: row[3], deadline: row[4], budget: row[5], description: row[6], createdAt: row[7] }));
        else if (sheetName === 'Reminders') result.data = rows.map(row => ({ id: row[0], title: row[1], date: row[2], type: row[3], relatedId: row[4], status: row[5], createdAt: row[6] }));
        else if (sheetName === 'Staff') result.data = rows.map(row => { try { return row[10] ? JSON.parse(row[10]) : null; } catch (err) { return null; } }).filter(Boolean);
        else if (sheetName === 'WorkLogs') result.data = rows.map(row => ({ id: row[0], staffId: row[1], date: row[2], hours: row[3], description: row[4], createdAt: row[5] }));
        else if (sheetName === 'Payroll') result.data = rows.map(row => { try { return row[6] ? JSON.parse(row[6]) : null; } catch (err) { return null; } }).filter(Boolean);
      }
    } else if (action === 'SYNC') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
      let newRows = [];
      if (sheetName === 'Invoices') newRows = payload.map(inv => [inv.id, inv.type, inv.number, inv.date, inv.clientName, inv.total, inv.status, JSON.stringify(inv), inv.updatedAt]);
      else if (sheetName === 'Expenses') newRows = payload.map(ex => [ex.id, ex.date, ex.category, ex.description, ex.amount, ex.isRecurring, ex.frequency, ex.createdAt]);
      else if (sheetName === 'Clients') newRows = payload.map(c => [c.id, c.name, c.companyName, c.email, c.phone, c.address, c.taxId, c.notes, c.createdAt]);
      else if (sheetName === 'Projects') newRows = payload.map(p => [p.id, p.name, p.clientName, p.status, p.deadline, p.budget, p.description, p.createdAt]);
      else if (sheetName === 'Reminders') newRows = payload.map(r => [r.id, r.title, r.date, r.type, r.relatedId, r.status, r.createdAt]);
      else if (sheetName === 'Staff') newRows = payload.map(s => [s.id, s.name, s.role, s.email, s.phone, s.type, s.salary, s.hourlyRate, s.department, s.status, JSON.stringify(s), s.createdAt]);
      else if (sheetName === 'WorkLogs') newRows = payload.map(w => [w.id, w.staffId, w.date, w.hours, w.description, w.createdAt]);
      else if (sheetName === 'Payroll') newRows = payload.map(p => [p.id, p.month, p.staffId, p.total, p.status, p.paidDate, JSON.stringify(p), p.createdAt]);

      if (newRows.length > 0) sheet.getRange(2, 1, newRows.length, newRows[0].length).setValues(newRows);
      result.data = payload;
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally { lock.releaseLock(); }
}`;

export const BackendCode = () => {
  const { addToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    addToast('Code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
           <Link to="/settings" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
             <ArrowLeft size={20} /> Back to Settings
           </Link>
           <h1 className="text-2xl font-bold dark:text-white">Backend Script Code</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-3 font-mono text-sm text-gray-400">Code.gs</span>
                </div>
                <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700">
                    <Copy size={14} /> Copy Code
                </button>
            </div>
            <div className="p-0 overflow-x-auto">
                <pre className="p-6 text-sm font-mono text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-all">
                    {APPS_SCRIPT_CODE}
                </pre>
            </div>
        </div>
        
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
            <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Setup Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li>Copy the code above.</li>
                <li>Open your Google Sheet.</li>
                <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                <li>Paste the code into the editor (replace existing code).</li>
                <li>Click <strong>Deploy &gt; New Deployment</strong>.</li>
                <li>Select type: <strong>Web App</strong>.</li>
                <li>Set "Execute as" to <strong>Me</strong>.</li>
                <li>Set "Who has access" to <strong>Anyone</strong>.</li>
                <li>Click <strong>Deploy</strong> and copy the URL.</li>
                <li>Paste the URL in <strong>Settings &gt; Data Synchronization</strong>.</li>
            </ol>
        </div>
      </div>
    </div>
  );
};
