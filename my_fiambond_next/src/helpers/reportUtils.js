import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToCSV = (config, data, filename) => {
    const headers = config.columns.map(col => col.header);
    const rows = data.map(item => 
        config.columns.map(col => `"${String(col.getValue(item)).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
};

export const exportToExcel = async (config, data, filename, meta) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Setup Columns
    worksheet.columns = config.columns.map(col => ({ header: col.header, key: col.key, width: col.width }));

    // Header Styling
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    // Add Data
    data.forEach(item => {
        const rowData = {};
        config.columns.forEach(col => {
            rowData[col.key] = col.getValue(item);
        });
        const row = worksheet.addRow(rowData);
        // Format currency columns
        config.columns.forEach((col, idx) => {
            if (col.type === 'currency') row.getCell(idx + 1).numFmt = '#,##0.00';
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${filename}.xlsx`);
};

export const generatePDF = (config, data, meta) => {
    const logoUrl = `${window.location.origin}/FiamBond_Logo.png`;
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    
    const htmlContent = `
        <html>
        <head>
            <title>${meta.reportTitle}</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: #1F2937; }
                header { display: flex; justify-content: space-between; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
                .summary-box { background: #EEF2FF; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #4F46E5; color: white; padding: 10px; text-align: left; font-size: 12px; }
                td { padding: 10px; border-bottom: 1px solid #E5E7EB; font-size: 12px; }
                .text-right { text-align: right; }
            </style>
        </head>
        <body>
            <header>
                <img src="${logoUrl}" style="height:50px;" />
                <div style="text-align:right">
                    <div style="font-weight:bold; color:#4F46E5;">${meta.brandName}</div>
                    <div style="font-size:12px; color:#6B7280;">${meta.reportTitle}</div>
                </div>
            </header>
            <div class="summary-box">
                <div><div style="font-size:12px;">Total Amount</div><div style="font-size:24px; font-weight:bold; color:#4F46E5;">₱${meta.total.toLocaleString()}</div></div>
                <div style="font-size:12px; text-align:right;">Range: ${meta.dateRange}<br/>Generated: ${new Date().toLocaleDateString()}</div>
            </div>
            <table>
                <thead><tr>${config.columns.map(col => `<th class="${col.type === 'currency' ? 'text-right' : ''}">${col.header}</th>`).join('')}</tr></thead>
                <tbody>
                    ${data.map(item => `
                        <tr>${config.columns.map(col => `<td class="${col.type === 'currency' ? 'text-right' : ''}">${col.type === 'currency' ? col.getValue(item).toLocaleString() : col.getValue(item)}</td>`).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 1000);
};