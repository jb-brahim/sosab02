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
    const { project, projects, headerLabel, groups } = data;
    const rangeLabels = data.rangeLabels || Array.from({ length: 31 }, (_, i) => i + 1);

    for (const group of groups) {
        let groupLabel = group.subcontractor ? group.subcontractor.name : 'EQUIPE DIRECTE';
        if (!group.subcontractor && group.project && projects && projects.length > 1) {
            groupLabel = `DIR - ${group.project.name}`;
        }
        // Excel sheet names must be unique and <= 31 chars
        const sheetName = groupLabel.substring(0, 31).replace(/[:\\\?\*\[\]\/]/g, '_');
        const worksheet = workbook.addWorksheet(sheetName);

        const currentProject = (!group.subcontractor && group.project) ? group.project : project;
        let currentRow = setupAttendanceSheet(worksheet, currentProject, headerLabel, rangeLabels, groupLabel);

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
    const { project, projects, headerLabel, groups, totalPayment } = data;

    for (const group of groups) {
        let groupLabel = group.subcontractor ? group.subcontractor.name : 'EQUIPE DIRECTE';
        if (!group.subcontractor && group.projectName && projects && projects.length > 1) {
            groupLabel = `DIR - ${group.projectName}`;
        }
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
        const currentProjName = (!group.subcontractor && group.projectName) ? group.projectName : project.name;
        titleCell.value = `PAIEMENT CHANTIER: ${currentProjName} - ${groupLabel}`;
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

function getMaterialFamily(mat) {
    if (mat.category && mat.category !== 'N/A' && mat.category !== 'Standard' && mat.category.trim() !== '') {
        return mat.category.trim();
    }
    const n = (mat.name || '').toLowerCase();
    if (n.includes('ciment') || n.includes('chaux') || n.includes('beton')) {
        return 'Ciments & Liants';
    }
    if (n.includes('fer') || n.includes('treillis') || n.includes('attache') || n.includes('armature') || n.includes('acier')) {
        return 'Fers & Armatures';
    }
    if (n.includes('bois') || n.includes('planche') || n.includes('panello') || n.includes('panelo') || n.includes('madrier') || n.includes('besting') || n.includes('plancher') || n.includes('sapine') || n.includes('isorere')) {
        return 'Bois & Coffrage';
    }
    if (n.includes('brique') || n.includes('agglo') || n.includes('parpaing') || n.includes('bloc')) {
        return 'Maçonnerie & Gros Œuvre';
    }
    if (n.includes('clou') || n.includes('point') || n.includes('boulon') || n.includes('clovette') || n.includes('rachklou') || n.includes('vis') || n.includes('ecrou')) {
        return 'Quincaillerie & Fixation';
    }
    if (n.includes('cable') || n.includes('electrique') || n.includes('dimino') || n.includes('gaine') || n.includes('prise') || n.includes('interrupteur')) {
        return 'Électricité';
    }
    if (n.includes('derbigume') || n.includes('flintcote') || n.includes('sika') || n.includes('etancheite') || n.includes('résine') || n.includes('peinture')) {
        return 'Étanchéité & Chimie de Chantier';
    }
    if (n.includes('bros') || n.includes('eprouvette') || n.includes('grillage') || n.includes('hbal') || n.includes('pioche') || n.includes('vibreur') || n.includes('outil') || n.includes('pelle')) {
        return 'Outillage & Équipement de Chantier';
    }
    return 'Divers';
}

/**
 * Generate Material Report in Excel format
 */
async function generateMaterialExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const { project, headerLabel, materials, movements } = data;

    // ─────────────────────────────────────────────────────────────────────
    // SHEET 1 — RÉSUMÉ DES STOCKS
    // ─────────────────────────────────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('RÉSUMÉ DES STOCKS', {
        properties: { tabColor: { argb: 'FF00B050' } }
    });

    summarySheet.columns = [
        { width: 28 },  // Matériau
        { width: 10 },  // Unité
        { width: 15 },  // Total IN
        { width: 15 },  // Total OUT
        { width: 12 }   // SOLDE
    ];

    // Title
    summarySheet.mergeCells('A1:E1');
    const sTitleCell = summarySheet.getCell('A1');
    sTitleCell.value = `Rapport Matériel: ${project.name}`;
    sTitleCell.font = { bold: true, size: 14 };
    sTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Date range
    summarySheet.mergeCells('A2:E2');
    const sDateCell = summarySheet.getCell('A2');
    sDateCell.value = `Période: ${headerLabel}`;
    sDateCell.font = { bold: true, size: 12 };
    sDateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Section label
    summarySheet.getCell('A4').value = 'RÉSUMÉ DES STOCKS PAR FAMILLE';
    summarySheet.getCell('A4').font = { bold: true, size: 12 };

    // Header
    const sHeaderRow = summarySheet.getRow(5);
    sHeaderRow.values = ['Matériau', 'Unité', 'Total Entrées', 'Total Sorties', 'SOLDE'];
    sHeaderRow.font = { bold: true };
    sHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Group materials by family
    const familyMap = {};
    materials.forEach(mat => {
        const family = getMaterialFamily(mat);
        if (!familyMap[family]) familyMap[family] = [];
        familyMap[family].push(mat);
    });

    const sortedFamilies = Object.keys(familyMap).sort((a, b) => a.localeCompare(b, 'fr'));

    let sRow = 6;
    sortedFamilies.forEach(family => {
        const familyMaterials = familyMap[family].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

        // Family Section Banner Row
        summarySheet.mergeCells(`A${sRow}:E${sRow}`);
        const fCell = summarySheet.getCell(`A${sRow}`);
        fCell.value = `📂 FAMILLE: ${family.toUpperCase()} (${familyMaterials.length})`;
        fCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        fCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        fCell.alignment = { horizontal: 'left', vertical: 'middle' };
        summarySheet.getRow(sRow).height = 24;
        sRow++;

        familyMaterials.forEach(mat => {
            const row = summarySheet.getRow(sRow);
            row.values = [mat.name, mat.unit, mat.in, mat.out, mat.balance];
            row.eachCell((cell, col) => {
                if (col <= 5) {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                }
                if (col === 5) {
                    cell.font = { bold: true };
                    if (mat.balance === 0) cell.font = { bold: true, color: { argb: 'FFFF0000' } };
                }
            });
            sRow++;
        });

        sRow++; // spacing row
    });

    // ─────────────────────────────────────────────────────────────────────
    // SHEET 2 — MOUVEMENTS DÉTAILLÉS
    // ─────────────────────────────────────────────────────────────────────
    const movSheet = workbook.addWorksheet('MOUVEMENTS DÉTAILLÉS', {
        properties: { tabColor: { argb: 'FF0070C0' } }
    });

    movSheet.columns = [
        { width: 14 },  // DATE MOUVEMENT
        { width: 20 },  // DATE SAISIE (SYSTÈME)
        { width: 22 },  // AJOUTÉ PAR (COMPTE)
        { width: 22 },  // DÉSIGNATION
        { width: 8 },   // TYPE
        { width: 10 },  // QTÉ
        { width: 8 },   // UNITÉ
        { width: 20 },  // FOURNISSEUR
        { width: 18 },  // LIVREUR
        { width: 18 },  // N° BON LIVRAISON
        { width: 28 }   // NOTES
    ];

    // Title
    movSheet.mergeCells('A1:K1');
    const mTitleCell = movSheet.getCell('A1');
    mTitleCell.value = `Rapport Matériel: ${project.name}`;
    mTitleCell.font = { bold: true, size: 14 };
    mTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    mTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Date range
    movSheet.mergeCells('A2:K2');
    const mDateCell = movSheet.getCell('A2');
    mDateCell.value = `Période: ${headerLabel}`;
    mDateCell.font = { bold: true, size: 12 };
    mDateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Section label
    movSheet.getCell('A4').value = 'MOUVEMENTS DÉTAILLÉS';
    movSheet.getCell('A4').font = { bold: true };

    // Header
    const mHeaderRow = movSheet.getRow(5);
    mHeaderRow.values = [
        'DATE MOUVEMENT',
        'DATE SAISIE (SYSTÈME)',
        'AJOUTÉ PAR (COMPTE)',
        'DÉSIGNATION',
        'TYPE',
        'QTÉ',
        'UNITÉ',
        'FOURNISSEUR',
        'LIVREUR',
        'N° BON LIVRAISON',
        'NOTES'
    ];
    mHeaderRow.font = { bold: true };
    mHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    let mRow = 6;
    movements.forEach((log) => {
        const row = movSheet.getRow(mRow);
        row.values = [
            new Date(log.date).toLocaleDateString('fr-FR'),
            new Date(log.createdAt || log.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            log.addedBy || 'N/A',
            log.name,
            log.type,
            log.quantity,
            log.unit,
            log.supplier || 'N/A',
            log.deliveredBy || 'N/A',
            log.bonLivraison || '',
            log.notes || ''
        ];

        // Style the TYPE column (col 5)
        const typeCell = row.getCell(5);
        if (log.type === 'IN') {
            typeCell.font = { color: { argb: 'FF00B050' }, bold: true };
        } else {
            typeCell.font = { color: { argb: 'FFFF0000' }, bold: true };
        }

        row.eachCell((cell) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        mRow++;
    });

    // Save file
    await workbook.xlsx.writeFile(outputPath);
}

module.exports = {
    generateAttendanceExcel,
    generatePaymentExcel,
    generateMaterialExcel
};
