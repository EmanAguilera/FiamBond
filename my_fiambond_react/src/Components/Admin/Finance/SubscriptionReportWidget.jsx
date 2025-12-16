import { useState, useMemo } from 'react';
import ExcelJS from 'exceljs'; 
import { saveAs } from 'file-saver'; 

export default function SubscriptionReportWidget({ transactions }) {
    // transactions here will be the list of user payments
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth().toString());

    const months = [
        { val: 'all', label: 'All Months' },
        { val: '0', label: 'January' }, { val: '1', label: 'February' }, { val: '2', label: 'March' },
        { val: '3', label: 'April' }, { val: '4', label: 'May' }, { val: '5', label: 'June' },
        { val: '6', label: 'July' }, { val: '7', label: 'August' }, { val: '8', label: 'September' },
        { val: '9', label: 'October' }, { val: '10', label: 'November' }, { val: '11', label: 'December' }
    ];

    // --- FILTER LOGIC ---
    const reportData = useMemo(() => {
        return transactions
            .filter(tx => {
                if (!tx.created_at) return false;
                // Handle Firebase Timestamp or JS Date
                const txDate = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                
                const yearMatch = txDate.getFullYear().toString() === filterYear;
                const monthMatch = filterMonth === 'all' || txDate.getMonth().toString() === filterMonth;
                return yearMatch && monthMatch;
            })
            .sort((a, b) => {
                const dateA = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
                const dateB = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
                return dateB - dateA;
            });
    }, [transactions, filterYear, filterMonth]);

    const totalRevenue = reportData.reduce((acc, curr) => acc + curr.amount, 0);
    
    const getPeriodLabel = () => {
        if (filterMonth === 'all') return `Annual Revenue ${filterYear}`;
        const m = months.find(m => m.val === filterMonth);
        return `${m.label} ${filterYear}`;
    };

    // --- 1. PDF GENERATION ---
    const handleGeneratePDF = (e) => {
        e.preventDefault();
        const printWindow = window.open('', '_blank', 'width=900,height=900');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Subscription Report - FiamBond Admin</title>
                <style>
                    @page { margin: 0; size: A4; }
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #1F2937; }
                    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
                    .company-name { font-size: 24px; font-weight: 700; color: #059669; text-transform: uppercase; }
                    .report-label { font-size: 12px; color: #6B7280; margin-top: 4px; }
                    .summary-box { background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                    .summary-title { font-size: 14px; font-weight: 600; color: #047857; text-transform: uppercase; }
                    .summary-amount { font-size: 32px; font-weight: 800; color: #059669; }
                    .summary-meta { font-size: 12px; color: #6B7280; text-align: right; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                    thead th { background-color: #059669; color: white; text-align: left; padding: 12px 15px; text-transform: uppercase; font-size: 11px; }
                    tbody tr { border-bottom: 1px solid #E5E7EB; }
                    tbody tr:nth-child(even) { background-color: #F9FAFB; }
                    td { padding: 12px 15px; vertical-align: middle; }
                    .amount-col { text-align: right; font-weight: 600; }
                    .plan-badge { background: #D1FAE5; color: #065F46; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <header>
                    <div class="company-name">FiamBond Admin</div>
                    <div class="report-label">Official Subscription Revenue Report</div>
                </header>
                <div class="summary-box">
                    <div><div class="summary-title">Total Revenue</div><div class="summary-amount">₱${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}</div></div>
                    <div class="summary-meta">Period: ${getPeriodLabel()}<br/>Generated: ${new Date().toLocaleDateString()}</div>
                </div>
                <table>
                    <thead><tr><th width="20%">Date</th><th width="40%">Subscriber</th><th width="20%">Plan</th><th width="20%" style="text-align:right">Amount (PHP)</th></tr></thead>
                    <tbody>
                        ${reportData.map(tx => {
                            const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                            return `<tr><td>${dateObj.toLocaleDateString()}</td><td><div style="font-weight:600;">${tx.subscriber}</div><div style="font-size:10px; color:#666">${tx.method} - Ref: ${tx.ref}</div></td><td><span class="plan-badge">${tx.plan}</span></td><td class="amount-col">${tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); }, 1000);
    };

    // --- 2. EXCEL GENERATION ---
    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Revenue Report');

        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Subscriber', key: 'subscriber', width: 30 },
            { header: 'Reference', key: 'ref', width: 20 },
            { header: 'Plan', key: 'plan', width: 15 },
            { header: 'Amount', key: 'amount', width: 15 },
        ];

        // Header Style (Green for Revenue)
        worksheet.getRow(1).values = ['Date', 'Subscriber', 'Reference', 'Plan', 'Amount (PHP)'];
        worksheet.getRow(1).eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
        });

        reportData.forEach((tx) => {
            const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
            const row = worksheet.addRow([
                dateObj.toLocaleDateString(),
                tx.subscriber,
                tx.ref,
                tx.plan,
                tx.amount
            ]);
            row.getCell(5).numFmt = '#,##0.00';
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Subscription_Report_${getPeriodLabel().replace(/ /g, '_')}.xlsx`);
    };

    return (
        <div className="space-y-4">
            {/* FILTER BAR */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Fiscal Year</label>
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-white border border-slate-300 text-gray-700 text-sm rounded-lg block w-24 p-2 outline-none">
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Month</label>
                        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-white border border-slate-300 text-gray-700 text-sm rounded-lg block w-32 p-2 outline-none">
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500">Total {filterMonth === 'all' ? 'Annual' : 'Monthly'} Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">₱{totalRevenue.toLocaleString()}</p>
                </div>
            </div>

            {/* PREVIEW TABLE */}
            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscriber</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">No subscriptions found for {getPeriodLabel()}.</td></tr>
                        ) : (
                            reportData.map((tx, idx) => {
                                const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                                return (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dateObj.toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {tx.subscriber}
                                            <div className="text-xs text-gray-400 font-normal">{tx.plan.toUpperCase()} • {tx.method}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                                            ₱{tx.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* EXPORT BUTTONS */}
            <div className="pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Export Revenue Report</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleExportExcel} disabled={reportData.length === 0} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold shadow-sm hover:bg-emerald-100 disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Export Excel
                    </button>
                    <button onClick={handleGeneratePDF} disabled={reportData.length === 0} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white bg-indigo-600 font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Export PDF
                    </button>
                </div>
            </div>
        </div>
    );
}