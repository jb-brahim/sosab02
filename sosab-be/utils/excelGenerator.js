const ExcelJS = require('exceljs');
const path = require('path');

/**
 * Helper to setup a sheet with basic header for attendance
 */
function setupAttendanceSheet(worksheet, project, headerLabel, rangeLabels, groupLabel) {
    const totalCols = rangeLabels.length + 4;

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
    titleCell.value = `POINTAGE CHANTIER: ${project.name} - ${groupLabel}`;
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

    headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    return 5; // Next row
}

/**
 * Generate Attendance Report with multiple sheets for subcontractors
 */
async function generateAttendanceExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const { project, headerLabel, groups } = data;
    const rangeLabels = data.rangeLabels || Array.from({ length: 31 }, (_, i) => i + 1);

    for (const group of groups) {
        const groupLabel = group.subcontractor ? group.subcontractor.name : 'EQUIPE DIRECTE';
        // Excel sheet names must be unique and <= 31 chars
        const sheetName = groupLabel.substring(0, 31).replace(/[:\\\?\*\[\]\/]/g, '_');
        const worksheet = workbook.addWorksheet(sheetName);

        let currentRow = setupAttendanceSheet(worksheet, project, headerLabel, rangeLabels, groupLabel);

        group.workers.forEach((worker) => {
            const row = worksheet.getRow(currentRow);
            const rowData = [
                worker.qualification || 'Fer',
                worker.name,
                worker.dailyRate || 0,
                ...worker.dailyAttendance,
                worker.totalDays
            ];
            row.values = rowData;
            row.alignment = { horizontal: 'center', vertical: 'middle' };

            row.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                if (colNumber === rowData.length) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
                    cell.font = { bold: true };
                }
            });
            currentRow++;
        });

        // Footer
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
    }

    await workbook.xlsx.writeFile(outputPath);
}

/**
 * Generate Payment Report with multiple sheets for subcontractors
 */
async function generatePaymentExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const { project, headerLabel, groups, totalPayment } = data;

    for (const group of groups) {
        const groupLabel = group.subcontractor ? group.subcontractor.name : 'EQUIPE DIRECTE';
        const sheetName = groupLabel.substring(0, 31).replace(/[:\\\?\*\[\]\/]/g, '_');
        const worksheet = workbook.addWorksheet(sheetName);

        // Set column widths
        worksheet.columns = [
            { width: 12 },  // Qualification
            { width: 25 },  // Name
            { width: 15 },  // Days worked
            { width: 12 },  // Daily Rate
            { width: 15 },  // Total Amount
            { width: 15 },  // Net a Payer
            { width: 20 }   // Signature
        ];

        // Title Rows
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `PAIEMENT CHANTIER: ${project.name} - ${groupLabel}`;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        worksheet.mergeCells('A2:G2');
        worksheet.getCell('A2').value = `PERIODE: ${headerLabel}`;
        worksheet.getCell('A2').font = { bold: true, size: 12 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        // Header
        const headerRow = worksheet.getRow(4);
        headerRow.values = ['QUALIF', 'NOM ET PRENOM', 'JOURS', 'TAUX', 'TOTAL / DT', 'NET A PAYER', 'SIGNATURE'];
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        headerRow.height = 30;

        headerRow.eachCell((cell, col) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (col === 3) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
            if (col === 6) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
        });

        let currentRow = 5;
        group.workers.forEach((worker) => {
            const row = worksheet.getRow(currentRow);
            row.values = [
                worker.qualification,
                worker.name,
                worker.daysWorked,
                worker.dailyRate,
                worker.totalAmount,
                worker.balance,
                ''
            ];
            row.alignment = { horizontal: 'center', vertical: 'middle' };
            row.eachCell((cell, col) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (col >= 4 && col <= 6) cell.numFmt = '#,##0.000';
                if (col === 6) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
                    cell.font = { bold: true };
                }
            });
            currentRow++;
        });

        // Group Total
        const totalRow = worksheet.getRow(currentRow + 1);
        worksheet.mergeCells(`A${currentRow + 1}:E${currentRow + 1}`);
        worksheet.getCell(`A${currentRow + 1}`).value = `TOTAL GROUPE / المجموع :`;
        worksheet.getCell(`A${currentRow + 1}`).font = { bold: true };
        worksheet.getCell(`A${currentRow + 1}`).alignment = { horizontal: 'right' };

        const totalValueCell = worksheet.getCell(`F${currentRow + 1}`);
        totalValueCell.value = group.totalPayment;
        totalValueCell.font = { bold: true, size: 12 };
        totalValueCell.numFmt = '#,##0.000';
        totalValueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
    }

    // Add a Summary sheet if there are multiple groups
    if (groups.length > 1) {
        const summarySheet = workbook.addWorksheet('RESUME GLOBAL', { properties: { tabColor: { argb: 'FF0000FF' } } });
        summarySheet.columns = [{ width: 30 }, { width: 20 }];
        summarySheet.getRow(1).values = ['GROUPE / SOUS-TRAITANT', 'TOTAL PAIEMENT'];
        summarySheet.getRow(1).font = { bold: true };

        let sRow = 2;
        groups.forEach(g => {
            summarySheet.getRow(sRow).values = [g.subcontractor ? g.subcontractor.name : 'EQUIPE DIRECTE', g.totalPayment];
            summarySheet.getCell(`B${sRow}`).numFmt = '#,##0.000';
            sRow++;
        });

        summarySheet.getRow(sRow + 1).values = ['TOTAL GENERAL', totalPayment];
        summarySheet.getRow(sRow + 1).font = { bold: true, size: 14 };
        summarySheet.getCell(`B${sRow + 1}`).numFmt = '#,##0.000';
        summarySheet.getCell(`B${sRow + 1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
    }

    await workbook.xlsx.writeFile(outputPath);
}

/**
 * Generate Material Report in Excel format
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
