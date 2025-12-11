import { useState, useMemo } from 'react';
import ExcelJS from 'exceljs'; // NEW Library for styling
import { saveAs } from 'file-saver'; // To save the file

export default function PayrollHistoryWidget({ transactions, companyName }) {
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
    const payrollData = useMemo(() => {
        return transactions
            .filter(tx => 
                (tx.category === 'Payroll' || tx.category === 'Cash Advance') || 
                (tx.description && (tx.description.toLowerCase().includes('salary') || tx.description.toLowerCase().includes('advance')))
            )
            .filter(tx => {
                const txDate = tx.created_at.toDate();
                const yearMatch = txDate.getFullYear().toString() === filterYear;
                const monthMatch = filterMonth === 'all' || txDate.getMonth().toString() === filterMonth;
                return yearMatch && monthMatch;
            })
            .sort((a, b) => b.created_at.toDate() - a.created_at.toDate());
    }, [transactions, filterYear, filterMonth]);

    const totalPaid = payrollData.reduce((acc, curr) => acc + curr.amount, 0);
    
    const getPeriodLabel = () => {
        if (filterMonth === 'all') return `Annual Report ${filterYear}`;
        const m = months.find(m => m.val === filterMonth);
        return `${m.label} ${filterYear}`;
    };

    // --- 1. PDF GENERATION (Keep existing logic) ---
    const handleGeneratePDF = (e) => {
        e.preventDefault();
        const logoUrl = `${window.location.origin}/FiamBond_Logo.png`;
        const printWindow = window.open('', '_blank', 'width=900,height=900');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payroll Report - ${companyName}</title>
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
                    .type-badge { background: #E0E7FF; color: #3730A3; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                    footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding: 20px; background: white; }
                </style>
            </head>
            <body>
                <header>
                    <div class="logo-container"><img src="${logoUrl}" alt="FiamBond Logo" /></div>
                    <div class="company-details"><div class="company-name">${companyName}</div><div class="report-label">Official Payroll & Expense Report</div></div>
                </header>
                <div class="summary-box">
                    <div><div class="summary-title">Total Disbursed</div><div class="summary-amount">₱${totalPaid.toLocaleString('en-US', {minimumFractionDigits: 2})}</div></div>
                    <div class="summary-meta">Period: ${getPeriodLabel()}<br/>Generated: ${new Date().toLocaleDateString()}</div>
                </div>
                <table>
                    <thead><tr><th width="15%">Date</th><th width="50%">Description / Beneficiary</th><th width="15%">Category</th><th width="20%" style="text-align:right">Amount (PHP)</th></tr></thead>
                    <tbody>
                        ${payrollData.map(tx => `<tr><td>${tx.created_at.toDate().toLocaleDateString()}</td><td><div style="font-weight:600; color:#111;">${tx.description}</div></td><td><span class="type-badge">${tx.category || 'Standard'}</span></td><td class="amount-col">${tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>`).join('')}
                    </tbody>
                </table>
                <footer>Generated by <strong>FiamBond Corporate Suite</strong>. This is a system-generated document and serves as an official internal record.</footer>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); }, 1000);
    };

    // --- 2. PROFESSIONAL EXCEL GENERATION (Styled) ---
    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payroll Report');

        // -- COLUMNS SETUP --
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Description', key: 'description', width: 50 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
        ];

        // -- 1. HEADER (Company Name) --
        worksheet.mergeCells('A1:D1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = companyName.toUpperCase();
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }; // White Text
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo Background
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 30;

        // -- 2. SUBTITLE --
        worksheet.mergeCells('A2:D2');
        const subtitleCell = worksheet.getCell('A2');
        subtitleCell.value = "OFFICIAL PAYROLL & EXPENSE REPORT";
        subtitleCell.font = { size: 12, bold: true, color: { argb: 'FF4F46E5' } }; // Indigo Text
        subtitleCell.alignment = { horizontal: 'center' };

        // -- 3. METADATA --
        worksheet.addRow([]); // Spacer
        worksheet.addRow(['Period:', getPeriodLabel()]);
        worksheet.addRow(['Generated:', new Date().toLocaleDateString()]);
        worksheet.getCell('A4').font = { bold: true };
        worksheet.getCell('A5').font = { bold: true };

        // -- 4. SUMMARY BOX (Light Blue) --
        worksheet.addRow([]); // Spacer
        const summaryRow = worksheet.addRow(['TOTAL DISBURSED', '', '', totalPaid]);
        
        // Style the Summary Row
        ['A', 'B', 'C', 'D'].forEach(col => {
            const cell = worksheet.getCell(`${col}${summaryRow.number}`);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } }; // Light Indigo
            cell.font = { bold: true, color: { argb: 'FF3730A3' } };
            cell.border = { top: {style:'thin'}, bottom: {style:'thin'} };
        });
        // Currency Format for Total
        worksheet.getCell(`D${summaryRow.number}`).numFmt = '₱#,##0.00';
        worksheet.getCell(`D${summaryRow.number}`).font = { size: 14, bold: true, color: { argb: 'FF4F46E5' } };

        worksheet.addRow([]); // Spacer

        // -- 5. TABLE HEADERS --
        // (We added columns initially, but let's re-style the header row, which is usually Row 8 now)
        const headerRowIdx = summaryRow.number + 2;
        const headerRow = worksheet.getRow(headerRowIdx);
        headerRow.values = ['Date', 'Description', 'Category', 'Amount (PHP)'];
        
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }; // White Text
            cell.alignment = { horizontal: 'center' };
        });

        // -- 6. DATA ROWS --
        payrollData.forEach((tx) => {
            const row = worksheet.addRow([
                tx.created_at.toDate().toLocaleDateString(),
                tx.description,
                tx.category || 'General',
                tx.amount
            ]);
            
            // Currency Format
            row.getCell(4).numFmt = '#,##0.00';
            
            // Optional: Border for each cell
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
                    left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
                    bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
                    right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
                };
            });
        });

        // -- 7. FOOTER TOTAL --
        const totalRow = worksheet.addRow(['', 'TOTAL', '', totalPaid]);
        totalRow.getCell(2).font = { bold: true };
        totalRow.getCell(2).alignment = { horizontal: 'right' };
        totalRow.getCell(4).font = { bold: true };
        totalRow.getCell(4).numFmt = '₱#,##0.00';
        totalRow.getCell(4).border = { top: { style: 'double' } };

        // -- 8. SAVE FILE --
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${companyName}_Payroll_${getPeriodLabel().replace(/ /g, '_')}.xlsx`);
    };

    // --- 3. CSV GENERATION (Raw Data) ---
    const handleExportCSV = () => {
        const headers = ["Date", "Description", "Category", "Amount"];
        const rows = payrollData.map(tx => [
            `"${tx.created_at.toDate().toLocaleDateString()}"`,
            `"${tx.description.replace(/"/g, '""')}"`,
            `"${tx.category || 'General'}"`,
            tx.amount.toFixed(2)
        ]);
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${companyName}_Payroll_${getPeriodLabel()}.csv`);
    };

    return (
        <div className="space-y-4">
            {/* --- FILTER BAR --- */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Fiscal Year</label>
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-white border border-slate-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-24 p-2 outline-none">
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Month</label>
                        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-white border border-slate-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-32 p-2 outline-none">
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500">Total {filterMonth === 'all' ? 'Annual' : 'Monthly'} Disbursed</p>
                    <p className="text-2xl font-bold text-emerald-600">₱{totalPaid.toLocaleString()}</p>
                </div>
            </div>

            {/* PREVIEW TABLE */}
            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payrollData.length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">No records found for {getPeriodLabel()}.</td></tr>
                        ) : (
                            payrollData.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tx.created_at.toDate().toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                        {tx.description}
                                        <div className="text-xs text-gray-400 font-normal">{tx.category || 'General Payroll'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-700">
                                        ₱{tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Export Data</p>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={handleExportCSV} disabled={payrollData.length === 0} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-700 bg-white border border-slate-300 font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        CSV
                    </button>
                    {/* EXCEL BUTTON */}
                    <button onClick={handleExportExcel} disabled={payrollData.length === 0} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold shadow-sm hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Excel
                    </button>
                    {/* PDF BUTTON */}
                    <button onClick={handleGeneratePDF} disabled={payrollData.length === 0} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white bg-indigo-600 font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        PDF
                    </button>
                </div>
            </div>
        </div>
    );
}