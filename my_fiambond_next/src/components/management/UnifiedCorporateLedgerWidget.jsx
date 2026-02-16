'use client'; 

import { useState, useMemo } from 'react';
import ExcelJS from 'exceljs'; 
// @ts-ignore
import { saveAs } from 'file-saver'; 
import UnifiedLoadingWidget from '../../components/ui/UnifiedLoadingWidget';

export default function UnifiedCorporateLedgerWidget({ 
    transactions, 
    config, 
    brandName, 
    reportType, 
    filenamePrefix,
    themeColor = "indigo" 
}) {
    const defaultStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    // 🟢 The only addition: Loading State
    const [isProcessing, setIsProcessing] = useState(false);

    const reportData = useMemo(() => {
        if (!config || !config.filterFn || !transactions || !Array.isArray(transactions)) return [];
    
        const startObj = new Date(startDate);
        startObj.setHours(0, 0, 0, 0);
        const endObj = new Date(endDate);
        endObj.setHours(23, 59, 59, 999);
    
        return transactions
            .filter(tx => config.filterFn(tx)) 
            .filter(tx => {
                if (!tx.created_at) return false;
                const txDate = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                return txDate >= startObj && txDate <= endObj;
            })
            .sort((a, b) => {
                const dateA = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
                const dateB = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
                return dateB.getTime() - dateA.getTime();
            });
    }, [transactions, startDate, endDate, config]);

    const totalAmount = reportData.reduce((acc, curr) => acc + curr.amount, 0);
    const getPeriodLabel = () => `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;

    // --- Actions with Processing State ---
    const handleGeneratePDF = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        
        // Timeout to allow the UI to show the loading state before the print window blocks the thread
        setTimeout(() => {
            const logoUrl = `${window.location.origin}/FiamBond_Logo.png`; 
            const printWindow = window.open('', '_blank', 'width=900,height=900');

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${reportType} - ${brandName}</title>
                    <style>
                        @page { margin: 0; size: A4; }
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #1F2937; -webkit-print-color-adjust: exact; }
                        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; }
                        .logo-container img { height: 60px; width: auto; display: block; }
                        .company-details { text-align: right; }
                        .company-name { font-size: 20px; font-weight: 700; color: #4F46E5; text-transform: uppercase; letter-spacing: 1px; }
                        .report-label { font-size: 12px; color: #6B7280; margin-top: 4px; }
                        .summary-box { background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                        .summary-title { font-size: 14px; font-weight: 600; color: #4338CA; text-transform: uppercase; }
                        .summary-amount { font-size: 32px; font-weight: 800; color: #4F46E5; }
                        .summary-meta { font-size: 12px; color: #6B7280; text-align: right; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                        thead th { background-color: #4F46E5; color: white; text-align: left; padding: 12px 15px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
                        tbody tr { border-bottom: 1px solid #E5E7EB; }
                        tbody tr:nth-child(even) { background-color: #F9FAFB; }
                        td { padding: 12px 15px; vertical-align: middle; }
                        .amount-col { text-align: right; font-weight: 600; font-family: 'Courier New', monospace; }
                        footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding: 20px; background: white; }
                    </style>
                </head>
                <body>
                    <header>
                        <div class="logo-container"><img src="${logoUrl}" alt="Logo" /></div>
                        <div class="company-details">
                            <div class="company-name">${brandName}</div>
                            <div class="report-label">Official ${reportType}</div>
                        </div>
                    </header>
                    <div class="summary-box">
                        <div><div class="summary-title">Total Disbursed</div><div class="summary-amount">₱${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</div></div>
                        <div class="summary-meta">Range: ${getPeriodLabel()}<br/>Generated: ${new Date().toLocaleDateString()}</div>
                    </div>
                    <table>
                        <thead><tr><th width="20%">Date</th><th width="50%">Description</th><th width="30%" style="text-align:right">Amount (PHP)</th></tr></thead>
                        <tbody>
                            ${reportData.map(tx => {
                                const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                                return `<tr>
                                    <td>${dateObj.toLocaleDateString()}</td>
                                    <td>
                                        <div style="font-weight:600; color:#111;">${config.getMainLabel(tx)}</div>
                                        <div style="font-size:10px; color:#666">${config.getSubLabel(tx)}</div>
                                    </td>
                                    <td class="amount-col">${tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                    <footer>Generated by <strong>FiamBond System Suite</strong>. This is a system-generated document.</footer>
                </body>
                </html>
            `;
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            setTimeout(() => { 
                printWindow.focus(); 
                printWindow.print(); 
                setIsProcessing(false); 
            }, 1000);
        }, 500);
    };

    const handleExportExcel = async () => {
        setIsProcessing(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');

            worksheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Primary Label', key: 'main', width: 40 },
                { header: 'Secondary Label', key: 'sub', width: 30 },
                { header: 'Amount', key: 'amount', width: 15 },
            ];

            worksheet.getRow(1).values = ['Date', config.columnLabels[0], config.columnLabels[1], 'Amount (PHP)'];
            worksheet.getRow(1).eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; 
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { horizontal: 'center' };
            });

            reportData.forEach((tx) => {
                const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                const row = worksheet.addRow([
                    dateObj.toLocaleDateString(),
                    config.getMainLabel(tx),
                    config.getSubLabel(tx),
                    tx.amount
                ]);
                row.getCell(4).numFmt = '#,##0.00';
            });

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `${filenamePrefix}_${getPeriodLabel().replace(/\//g, '-')}.xlsx`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportCSV = () => {
        setIsProcessing(true);
        const headers = ["Date", config.columnLabels[0], config.columnLabels[1], "Amount"];
        const rows = reportData.map(tx => {
            const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
            return [
                `"${dateObj.toLocaleDateString()}"`,
                `"${String(config.getMainLabel(tx)).replace(/"/g, '""')}"`,
                `"${String(config.getSubLabel(tx)).replace(/"/g, '""')}"`,
                tx.amount.toFixed(2)
            ];
        });
        
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        saveAs(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), `${filenamePrefix}_${getPeriodLabel().replace(/\//g, '-')}.csv`);
        setIsProcessing(false);
    };

    return (
        <div className="space-y-4">
            {/* 🟢 Loading Overlay when processing */}
            {isProcessing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                    <UnifiedLoadingWidget type="full" message="Processing Ledger..." />
                </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4 text-left">
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Start Date</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                            className="bg-white border border-slate-300 text-gray-700 text-sm rounded-lg block p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">End Date</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                            className="bg-white border border-slate-300 text-gray-700 text-sm rounded-lg block p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500">Total in Range</p>
                    <p className={`text-2xl font-bold ${themeColor === 'emerald' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        ₱{totalAmount.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl custom-scrollbar text-left">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.columnLabels[0]}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">No records found.</td></tr>
                        ) : (
                            reportData.map((tx, idx) => {
                                const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                                return (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dateObj.toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {config.getMainLabel(tx)}
                                            <div className="text-xs text-gray-400 font-normal">{config.getSubLabel(tx)}</div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${themeColor === 'emerald' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                            ₱{tx.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Export {reportType}</p>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={handleExportCSV} disabled={reportData.length === 0} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-700 bg-white border border-slate-300 font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        CSV
                    </button>
                    <button onClick={handleExportExcel} disabled={reportData.length === 0} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold shadow-sm hover:bg-emerald-100 disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Excel
                    </button>
                    <button onClick={handleGeneratePDF} disabled={reportData.length === 0} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white bg-indigo-600 font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        PDF
                    </button>
                </div>
            </div>
        </div>
    );
}