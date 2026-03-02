"use client";

import ExcelJS from 'exceljs';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

/**
 * React Native Export Service
 * Replaces 'file-saver' and 'window.print' with Native Sharing and Print APIs.
 */

export const exportToCSV = async (config, data, filename) => {
    const headers = config.columns.map(col => col.header);
    const rows = data.map(item => 
        config.columns.map(col => `"${String(col.getValue(item)).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    const fileUri = `${FileSystem.documentDirectory}${filename}.csv`;
    
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri);
};

export const exportToExcel = async (config, data, filename, meta) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    worksheet.columns = config.columns.map(col => ({ 
        header: col.header, 
        key: col.key, 
        width: col.width / 5 // Adjusting web width units to Excel units
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    data.forEach(item => {
        const rowData = {};
        config.columns.forEach(col => {
            rowData[col.key] = col.getValue(item);
        });
        const row = worksheet.addRow(rowData);
        config.columns.forEach((col, idx) => {
            if (col.type === 'currency') row.getCell(idx + 1).numFmt = '#,##0.00';
        });
    });

    // In React Native, we write to a base64 string then save to local storage
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const fileUri = `${FileSystem.documentDirectory}${filename}.xlsx`;

    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(fileUri);
};

export const generatePDF = async (config, data, meta) => {
    // Note: Assets in RN are referenced differently than web
    const htmlContent = `
        <html>
        <head>
            <style>
                body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #1F2937; }
                header { display: flex; flex-direction: row; justify-content: space-between; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; margin-bottom: 20px; }
                .summary-box { background: #EEF2FF; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #4F46E5; color: white; padding: 8px; text-align: left; font-size: 10px; }
                td { padding: 8px; border-bottom: 1px solid #E5E7EB; font-size: 10px; }
                .text-right { text-align: right; }
            </style>
        </head>
        <body>
            <header>
                <div style="font-weight:bold; color:#4F46E5; font-size: 20px;">${meta.brandName}</div>
                <div style="text-align:right">
                    <div style="font-size:10px; color:#6B7280;">${meta.reportTitle}</div>
                </div>
            </header>
            <div class="summary-box">
                <div style="font-size:10px;">Total Amount</div>
                <div style="font-size:20px; font-weight:bold; color:#4F46E5;">₱${meta.total.toLocaleString()}</div>
                <div style="font-size:9px; margin-top: 5px;">Range: ${meta.dateRange} | Generated: ${new Date().toLocaleDateString()}</div>
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

    // Uses the native print/PDF generator
    await Print.printAsync({ html: htmlContent });
};