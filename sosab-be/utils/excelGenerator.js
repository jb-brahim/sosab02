const ExcelJS = require('exceljs');
const path = require('path');

/**
 * Generate Attendance Report in Excel format
 * @param {Object} data - Report data
 * @param {Object} data.project - Project information
 * @param {String} data.headerLabel - Date range label
 * @param {Array} data.attendanceGrid - Grid data with workers and daily attendance
 * @param {String} outputPath - Path to save the Excel file
 */
async function generateAttendanceExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    const { project, headerLabel, attendanceGrid } = data;

    const rangeLabels = data.rangeLabels || Array.from({ length: 31 }, (_, i) => i + 1);
    const totalCols = rangeLabels.length + 4; // Qualif + Name + DailyRate + Days + Total

    // Set column widths
    worksheet.columns = [
        { width: 15 }, // Qualification
        { width: 25 }, // Name
        { width: 10 }, // Daily Rate
        ...rangeLabels.map(() => ({ width: 4 })), // Dynamic Days
        { width: 10 }  // Total
    ];

    // Title Row
    worksheet.mergeCells(1, 1, 1, totalCols);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `POINTAGE CHANTIER: ${project.name}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Date Range Row
    worksheet.mergeCells(2, 1, 2, totalCols);
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `PAIEMENT: ${headerLabel}`;
    dateCell.font = { bold: true, size: 12 };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Header Row
    const headerRow = worksheet.getRow(4);
    headerRow.values = [
        'QUALIF',
        'NOM ET PRENOM',
        'TAUX',
        ...rangeLabels,
        'TOTAL'
    ];
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
    };
    headerRow.height = 20;

    // Add borders to header
    headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Data Rows
    let currentRow = 5;
    attendanceGrid.forEach((worker) => {
        const row = worksheet.getRow(currentRow);
        const rowData = [
            worker.qualification || 'Fer',
            worker.name,
            worker.dailyRate || 0,
            ...worker.dailyAttendance, // Array of 0s and 1s
            worker.totalDays
        ];
        row.values = rowData;
        row.alignment = { horizontal: 'center', vertical: 'middle' };

        // Add borders
        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Highlight total column
            if (colNumber === rowData.length) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFCE4D6' }
                };
                cell.font = { bold: true };
            }
        });

        currentRow++;
    });

    // Footer with signatures
    const footerRow = currentRow + 2;
    worksheet.mergeCells(`A${footerRow}:K${footerRow}`);
    worksheet.getCell(`A${footerRow}`).value = 'SIG: CHEF CHANTIER';
    worksheet.getCell(`A${footerRow}`).font = { bold: true };
    worksheet.getCell(`A${footerRow}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`L${footerRow}:V${footerRow}`);
    worksheet.getCell(`L${footerRow}`).value = 'SIG: POINTEUR';
    worksheet.getCell(`L${footerRow}`).font = { bold: true };
    worksheet.getCell(`L${footerRow}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`W${footerRow}:AG${footerRow}`);
    worksheet.getCell(`W${footerRow}`).value = 'SIG: GERANT';
    worksheet.getCell(`W${footerRow}`).font = { bold: true };
    worksheet.getCell(`W${footerRow}`).alignment = { horizontal: 'center' };

    // Save file
    await workbook.xlsx.writeFile(outputPath);
    console.log(`Attendance Excel report generated: ${outputPath}`);
}

/**
 * Generate Payment Report in Excel format
 * @param {Object} data - Report data
 * @param {Object} data.project - Project information
 * @param {String} data.headerLabel - Date range label
 * @param {Array} data.workers - Worker payment data
 * @param {Number} data.totalPayment - Grand total
 * @param {String} outputPath - Path to save the Excel file
 */
async function generatePaymentExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payment Report');

    const { project, headerLabel, workers, totalPayment } = data;

    // Set column widths
    worksheet.columns = [
        { width: 12 },  // Qualification
        { width: 25 },  // Name
        { width: 15 },  // Days worked
        { width: 12 },  // Total Days
        { width: 12 },  // Daily Rate
        { width: 15 },  // Total Amount
        { width: 15 },  // Payments Made
        { width: 15 },  // Balance
        { width: 20 }   // Signature
    ];

    // Title Row
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `POINTAGE CHANTIER: ${project.name}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Date Range Row
    worksheet.mergeCells('A2:I2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `PAIEMENT: ${headerLabel}`;
    dateCell.font = { bold: true, size: 12 };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Header Row
    const headerRow = worksheet.getRow(4);
    headerRow.values = [
        'QUALIF',
        'NOM ET PRENOM',
        `${headerLabel}\n(Période)`,
        'TAUX du J',
        'TOTAL / DT',
        'NET A PAYER',
        'SIGNATURE'
    ];
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 30;

    // Color code headers
    headerRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
    headerRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };

    // Add borders to header
    headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Data Rows
    let currentRow = 5;
    workers.forEach((worker) => {
        const row = worksheet.getRow(currentRow);
        row.values = [
            worker.qualification || 'Fer',
            worker.name,
            worker.daysWorked,
            worker.dailyRate,
            worker.totalAmount,
            worker.balance,
            ''
        ];
        row.alignment = { horizontal: 'center', vertical: 'middle' };

        // Add borders and formatting
        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Format currency columns
            if (colNumber >= 4 && colNumber <= 6) {
                cell.numFmt = '#,##0.000';
            }

            // Highlight balance column (now column 6 instead of 8)
            if (colNumber === 6) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD4EDDA' }
                };
                cell.font = { bold: true };
            }
        });

        currentRow++;
    });

    // Grand Total Row
    const totalRow = worksheet.getRow(currentRow + 1);
    worksheet.mergeCells(`A${currentRow + 1}:E${currentRow + 1}`);
    const totalLabelCell = worksheet.getCell(`A${currentRow + 1}`);
    totalLabelCell.value = `Total de paiement du 14 jusqu'à 20 ${headerLabel}`;
    totalLabelCell.font = { bold: true, size: 12, italic: true };
    totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const totalValueCell = worksheet.getCell(`F${currentRow + 1}`);
    totalValueCell.value = totalPayment;
    totalValueCell.font = { bold: true, size: 14 };
    totalValueCell.numFmt = '#,##0.000';
    totalValueCell.alignment = { horizontal: 'center', vertical: 'middle' };
    totalValueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4EDDA' }
    };

    // Footer with signatures
    const footerRow = currentRow + 3;
    worksheet.mergeCells(`A${footerRow}:D${footerRow}`);
    worksheet.getCell(`A${footerRow}`).value = 'SIG: CHEF CHANTIER';
    worksheet.getCell(`A${footerRow}`).font = { bold: true };
    worksheet.getCell(`A${footerRow}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`F${footerRow}:I${footerRow}`);
    worksheet.getCell(`F${footerRow}`).value = 'SIG: GERANT';
    worksheet.getCell(`F${footerRow}`).font = { bold: true };
    worksheet.getCell(`F${footerRow}`).alignment = { horizontal: 'center' };

    // Save file
    await workbook.xlsx.writeFile(outputPath);
    console.log(`Payment Excel report generated: ${outputPath}`);
}

/**
 * Generate Material Report in Excel format
 * @param {Object} data - Report data
 * @param {Object} data.project - Project information
 * @param {String} data.headerLabel - Date range label
 * @param {Array} data.materials - Summary of materials
 * @param {Array} data.movements - Detailed material movements
 * @param {String} outputPath - Path to save the Excel file
 */
async function generateMaterialExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Material Report');

    const { project, headerLabel, materials, movements } = data;

    // Set column widths
    worksheet.columns = [
        { width: 12 },  // Date
        { width: 20 },  // Material Name
        { width: 10 },  // Type
        { width: 10 },  // Quantity
        { width: 10 },  // Unit
        { width: 20 },  // Supplier/Delivered By
        { width: 30 }   // Notes
    ];

    // Title Row
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Rapport Matériel: ${project.name}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Date Range Row
    worksheet.mergeCells('A2:G2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Période: ${headerLabel}`;
    dateCell.font = { bold: true, size: 12 };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // --- Summary Section ---
    let currentRow = 4;
    worksheet.getCell(`A${currentRow}`).value = 'RÉSUMÉ DES STOCKS';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    const summaryHeaderRow = worksheet.getRow(currentRow);
    summaryHeaderRow.values = ['Matériau', 'Unité', 'Total Entrées', 'Total Sorties', 'SOLDE', '', ''];
    summaryHeaderRow.font = { bold: true };
    summaryHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    currentRow++;

    materials.forEach(mat => {
        const row = worksheet.getRow(currentRow);
        row.values = [mat.name, mat.unit, mat.in, mat.out, mat.balance, '', ''];
        row.eachCell((cell, col) => {
            if (col <= 5) {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
        });
        currentRow++;
    });

    // --- Detailed Movements ---
    currentRow += 2;
    worksheet.getCell(`A${currentRow}`).value = 'MOUVEMENTS DÉTAILLÉS';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = [
        'DATE',
        'DÉSIGNATION',
        'TYPE',
        'QTÉ',
        'UNITÉ',
        'FOURNISSEUR/LIVREUR',
        'NOTES'
    ];
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    currentRow++;

    movements.forEach((log) => {
        const row = worksheet.getRow(currentRow);
        row.values = [
            new Date(log.date).toLocaleDateString('fr-FR'),
            log.name,
            log.type,
            log.quantity,
            log.unit,
            log.supplier || log.deliveredBy || 'N/A',
            log.notes || ''
        ];

        // Style the type column
        const typeCell = row.getCell(3);
        if (log.type === 'IN') {
            typeCell.font = { color: { argb: 'FF00B050' }, bold: true };
        } else {
            typeCell.font = { color: { argb: 'FFFF0000' }, bold: true };
        }

        row.eachCell((cell) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        currentRow++;
    });

    // Save file
    await workbook.xlsx.writeFile(outputPath);
}

module.exports = {
    generateAttendanceExcel,
    generatePaymentExcel,
    generateMaterialExcel
};
