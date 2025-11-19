import React from 'react';
import { Invoice, AppSettings } from '../types';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

interface Props {
  invoice: Invoice;
  settings: AppSettings;
  onClose: () => void;
}

export const InvoicePreview: React.FC<Props> = ({ invoice, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full bg-white shadow-2xl overflow-hidden flex flex-col relative print-only rounded-xl">
        
        {/* Toolbar (Hidden when printing via .no-print) */}
        <div className="bg-gray-900 text-white border-b border-gray-800 p-4 flex justify-between items-center no-print z-50 shadow-lg">
          <h2 className="text-lg font-bold pl-2 flex items-center gap-2">
             Document Preview
          </h2>
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 text-sm font-bold flex items-center gap-2">
               Print / Save PDF
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 bg-white text-slate-900 p-12 relative min-h-[1000px]" id="printable-area">
            {/* Decorative Header Bar */}
            <div className="absolute top-0 left-0 w-full h-3 bg-slate-900"></div>

            {/* Header */}
            <div className="flex justify-between items-start mt-8 mb-16">
                <div>
                    {/* Logo Logic */}
                    {settings.logoUrl ? (
                        <img 
                            src={settings.logoUrl} 
                            alt="Logo" 
                            style={{ width: settings.logoWidth ? `${settings.logoWidth}px` : '150px' }}
                            className="object-contain mb-6 block" 
                        />
                    ) : (
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">{settings.companyName}</h1>
                    )}
                    <div className="text-slate-500 text-sm leading-relaxed">
                        <p className="font-bold text-slate-900">{settings.companyName}</p>
                        {settings.companyAddress.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                        <div className="mt-2">{settings.companyEmail}</div>
                    </div>
                </div>
                <div className="text-right">
                    <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-2 capitalize">{invoice.type}</h1>
                    <div className="text-slate-500 font-medium text-lg mb-6">#{invoice.number}</div>
                    <div className="inline-block">
                        <div className={`px-4 py-1 rounded border text-sm font-bold uppercase tracking-wide ${
                            invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            invoice.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                            {invoice.status}
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing Info */}
            <div className="grid grid-cols-12 gap-8 mb-16">
                <div className="col-span-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To</h3>
                    <div className="text-slate-900 font-bold text-lg mb-2">{invoice.clientName}</div>
                    <div className="text-slate-500 text-sm leading-relaxed whitespace-pre-line mb-2">
                        {invoice.clientAddress}
                    </div>
                    <div className="text-slate-500 text-sm">{invoice.clientEmail}</div>
                </div>
                <div className="col-span-7 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Issued</h3>
                        <div className="text-slate-900 font-medium">{invoice.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : '—'}</div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {invoice.type === 'estimate' ? 'Expires' : 'Due Date'}
                        </h3>
                        <div className="text-slate-900 font-medium">{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '—'}</div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="mb-12">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Description</th>
                            <th className="py-3 text-right text-xs font-bold text-slate-900 uppercase tracking-wider w-24">Qty</th>
                            <th className="py-3 text-right text-xs font-bold text-slate-900 uppercase tracking-wider w-32">Price</th>
                            <th className="py-3 text-right text-xs font-bold text-slate-900 uppercase tracking-wider w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoice.items.map(item => (
                            <tr key={item.id}>
                                <td className="py-4 text-slate-800 font-medium">{item.description}</td>
                                <td className="py-4 text-right text-slate-600">{item.quantity}</td>
                                <td className="py-4 text-right text-slate-600">{settings.currencySymbol}{item.rate.toFixed(2)}</td>
                                <td className="py-4 text-right text-slate-900 font-bold">{settings.currencySymbol}{item.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex flex-col md:flex-row justify-between gap-12 page-break-inside-avoid">
                <div className="flex-1">
                    {invoice.notes && (
                        <div className="bg-slate-50 p-6 rounded border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes & Terms</h3>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                    )}
                </div>
                <div className="w-full md:w-80 space-y-3">
                    <div className="flex justify-between text-slate-600 text-sm">
                        <span>Subtotal</span>
                        <span className="font-medium text-slate-900">{settings.currencySymbol}{invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {invoice.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 text-sm">
                            <span>Discount ({invoice.discountRate}%)</span>
                            <span>-{settings.currencySymbol}{invoice.discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {settings.taxEnabled && invoice.taxAmount > 0 && (
                        <div className="flex justify-between text-slate-600 text-sm">
                            <span>{settings.taxLabel} ({invoice.taxRate}%)</span>
                            <span className="font-medium text-slate-900">+{settings.currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="border-t-2 border-slate-900 pt-4 mt-2 flex justify-between items-baseline">
                        <span className="text-lg font-bold text-slate-900">Total</span>
                        <span className="text-3xl font-bold text-slate-900">{settings.currencySymbol}{invoice.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-xs font-medium">Thank you for your business!</p>
            </div>
        </div>
    </div>
  );
};