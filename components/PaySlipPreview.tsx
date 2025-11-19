
import React from 'react';
import { PayrollRun, Staff, AppSettings } from '../types';
import { format } from 'date-fns';
import { ArrowLeft, Download, Printer } from 'lucide-react';

interface Props {
  run: PayrollRun;
  staff: Staff;
  settings: AppSettings;
  onClose: () => void;
}

export const PaySlipPreview: React.FC<Props> = ({ run, staff, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 flex flex-col relative h-full">
        {/* Toolbar */}
        <div className="bg-gray-900 text-white border-b border-gray-800 p-4 flex justify-between items-center no-print shadow-lg sticky top-0 z-50">
          <h2 className="text-lg font-bold pl-2 flex items-center gap-2">Payslip Preview</h2>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-lg text-sm font-bold flex items-center gap-2">
               <Printer size={16} /> Print / PDF
            </button>
          </div>
        </div>

        {/* Printable Slip */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
             <div className="max-w-3xl mx-auto bg-white p-12 shadow-xl rounded-xl print:shadow-none print:rounded-none print:w-full print:max-w-none">
                 {/* Header */}
                 <div className="flex justify-between border-b-2 border-gray-900 pb-6 mb-6">
                     <div>
                         <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Payslip</h1>
                         <p className="text-sm text-gray-500 mt-1">Period: {format(new Date(run.month), 'MMMM yyyy')}</p>
                     </div>
                     <div className="text-right">
                         <h2 className="text-lg font-bold text-gray-900">{settings.companyName}</h2>
                         <div className="text-sm text-gray-500 whitespace-pre-line">{settings.companyAddress}</div>
                     </div>
                 </div>

                 {/* Employee Info */}
                 <div className="grid grid-cols-2 gap-8 mb-8">
                     <div>
                         <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Employee Details</h3>
                         <div className="text-gray-900 font-bold text-lg">{staff.name}</div>
                         <div className="text-sm text-gray-600">{staff.role}</div>
                         {staff.department && <div className="text-sm text-gray-600">{staff.department}</div>}
                         <div className="text-sm text-gray-600 mt-1">{staff.email}</div>
                     </div>
                     <div className="text-right">
                         <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Payment Details</h3>
                         {staff.bankDetails?.bankName ? (
                             <>
                                 <div className="text-sm text-gray-600"><span className="font-medium">Bank:</span> {staff.bankDetails.bankName}</div>
                                 <div className="text-sm text-gray-600"><span className="font-medium">Account:</span> {staff.bankDetails.accountNumber}</div>
                                 {staff.bankDetails.swiftCode && <div className="text-sm text-gray-600"><span className="font-medium">SWIFT:</span> {staff.bankDetails.swiftCode}</div>}
                             </>
                         ) : (
                             <div className="text-sm text-gray-500 italic">Check / Cash</div>
                         )}
                         <div className="mt-4">
                             <span className={`px-3 py-1 rounded border text-xs font-bold uppercase ${run.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                 {run.status}
                             </span>
                         </div>
                     </div>
                 </div>

                 {/* Earnings Table */}
                 <div className="mb-6">
                     <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 mb-2">Earnings</h3>
                     <table className="w-full text-sm">
                         <tbody className="divide-y divide-gray-100">
                             <tr>
                                 <td className="py-2 text-gray-600">Basic Salary / Wages</td>
                                 <td className="py-2 text-right font-medium text-gray-900">{settings.currencySymbol}{run.baseAmount.toFixed(2)}</td>
                             </tr>
                             {run.bonus > 0 && (
                                 <tr>
                                     <td className="py-2 text-gray-600">Bonus / Commission</td>
                                     <td className="py-2 text-right font-medium text-gray-900">{settings.currencySymbol}{run.bonus.toFixed(2)}</td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>

                 {/* Deductions Table */}
                 {run.deductions > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 mb-2">Deductions</h3>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="py-2 text-gray-600">Tax / Deductions</td>
                                    <td className="py-2 text-right font-medium text-red-600">-{settings.currencySymbol}{run.deductions.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                 )}

                 {/* Net Pay */}
                 <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center rounded-lg">
                     <div className="text-sm font-bold text-gray-500 uppercase">Net Pay</div>
                     <div className="text-2xl font-bold text-gray-900">{settings.currencySymbol}{run.total.toFixed(2)}</div>
                 </div>
                 
                 <div className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
                     This is a system generated payslip.
                 </div>
             </div>
        </div>
    </div>
  );
};
