const puppeteer = require('puppeteer');

// Helper functions for formatting
const formatTND = (num) => {
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(num || 0);
};

const formatDateTN = (date) => {
  return new Date(date).toLocaleDateString('fr-TN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};


// Generate PDF from HTML using Puppeteer
exports.generatePDF = async (htmlContent, outputPath) => {
  try {
    console.log('Starting PDF generation...');
    console.log('Output path:', outputPath);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();
    console.log('PDF generated successfully:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('PDF generation error:', error.message);
    console.error('Stack:', error.stack);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

// Generate LaTeX content for salary report
exports.generateSalaryReportHTML = (data) => {
  const { project, week, workers, totalSalary } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport des Salaires / تقرير الرواتب - ${project.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563EB; padding-bottom: 20px; }
    .header h1 { color: #333; margin: 0; font-size: 24px; }
    .header h2 { color: #2563EB; margin: 10px 0; font-size: 20px; }
    .header p { color: #666; margin: 5px 0; }
    .bilingual { display: flex; justify-content: space-between; align-items: center; }
    .bilingual .ar { direction: rtl; text-align: right; }
    .bilingual .fr { direction: ltr; text-align: left; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
    th { background-color: #2563EB; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .total { font-weight: bold; font-size: 1.2em; background-color: #EFF6FF; }
    .footer { margin-top: 30px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    .currency { font-weight: bold; color: #059669; }
    .column-header { font-size: 0.85em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SOSAB - Système de Gestion de Construction</h1>
    <h1 style="direction: rtl;">نظام إدارة البناء SOSAB</h1>
    <h2>Rapport des Salaires Hebdomadaire</h2>
    <h2 style="direction: rtl;">تقرير الرواتب الأسبوعي</h2>
    <div class="bilingual">
      <div class="fr">
        <p><strong>Projet:</strong> ${project.name}</p>
        <p><strong>Lieu:</strong> ${project.location || 'Non spécifié'}</p>
        <p><strong>Semaine:</strong> ${week}</p>
        <p><strong>Date de génération:</strong> ${formatDateTN(new Date())}</p>
      </div>
      <div class="ar">
        <p><strong>المشروع:</strong> ${project.name}</p>
        <p><strong>الموقع:</strong> ${project.location || 'غير محدد'}</p>
        <p><strong>الأسبوع:</strong> ${week}</p>
        <p><strong>تاريخ الإنشاء:</strong> ${formatDateTN(new Date())}</p>
      </div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th class="column-header">Nom de l'ouvrier<br/>اسم العامل</th>
        <th class="column-header">Jours travaillés<br/>أيام العمل</th>
        <th class="column-header">Salaire de base<br/>الراتب الأساسي</th>
        <th class="column-header">Heures supplémentaires<br/>ساعات إضافية</th>
        <th class="column-header">Prime<br/>مكافأة</th>
        <th class="column-header">Pénalité<br/>خصم</th>
        <th class="column-header">Total<br/>المجموع</th>
      </tr>
    </thead>
    <tbody>
      ${workers.map(worker => `
        <tr>
          <td>${worker.name}</td>
          <td>${worker.daysWorked}</td>
          <td class="currency">${formatTND(worker.baseSalary)} د.ت</td>
          <td class="currency">${formatTND(worker.overtime)} د.ت</td>
          <td class="currency">${formatTND(worker.bonus)} د.ت</td>
          <td class="currency">${formatTND(worker.penalty)} د.ت</td>
          <td class="currency">${formatTND(worker.total)} د.ت</td>
        </tr>
      `).join('')}
      <tr class="total">
        <td colspan="6" style="text-align: right;"><strong>Total / المجموع الكلي</strong></td>
        <td class="currency" style="font-size: 1.3em;">${formatTND(totalSalary)} د.ت</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>Ce rapport a été généré automatiquement par le système SOSAB</p>
    <p style="direction: rtl;">تم إنشاء هذا التقرير تلقائياً بواسطة نظام SOSAB</p>
    <p style="font-size: 0.9em; margin-top: 10px;">Tous les montants sont en Dinar tunisien (د.ت) / جميع المبالغ بالدينار التونسي (د.ت)</p>
  </div>
</body>
</html>
  `;
};

// Generate LaTeX content for material report
exports.generateMaterialReportHTML = (data) => {
  const { project, week, materials, movements } = data;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(num);
  };

  const formatPrice = (num) => {
    return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(num);
  };

  const totalPeriodCost = (movements || []).reduce((sum, m) => sum + (m.cost || 0), 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport des Matériaux - ${project.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    
    body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 30px; color: #1e293b; background: #fff; }
    
    .company-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 4px solid #0f172a; padding-bottom: 20px; }
    .brand h1 { margin: 0; font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
    .brand p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; font-weight: 600; }
    
    .report-title { text-align: center; margin-bottom: 30px; }
    .report-title h2 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; color: #1e40af; }
    .report-title .ar-title { direction: rtl; font-size: 28px; margin-top: 5px; color: #1e40af; }

    .meta-info { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .meta-box h4 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
    .meta-box p { margin: 3px 0; font-size: 15px; font-weight: 600; }
    .meta-box.ar { text-align: right; direction: rtl; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #e2e8f0; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 12px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; border: 1px solid #1e293b; }
    th.ar-col { text-align: right; direction: rtl; }
    
    td { padding: 10px; font-size: 12px; border: 1px solid #e2e8f0; vertical-align: middle; }
    
    .mat-header { background: #f1f5f9; font-weight: 800; color: #0f172a; }
    .mat-header td { border-bottom: 2px solid #cbd5e1; height: 40px; }
    
    .move-row { background: #fff; }
    .move-row:nth-child(even) { background: #fcfdfe; }
    
    .type-badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; color: #fff; display: inline-block; }
    .type-in { background: #059669; }
    .type-out { background: #dc2626; }
    
    .num { font-family: monospace; font-size: 13px; font-weight: 600; white-space: nowrap; }
    .price-col { color: #475569; }
    .total-col { font-weight: 700; color: #0f172a; }
    
    .stats-footer { margin-top: 40px; border-top: 2px dashed #e2e8f0; padding-top: 20px; display: flex; justify-content: flex-end; }
    .grand-total { background: #0f172a; color: #fff; padding: 15px 30px; border-radius: 8px; text-align: right; }
    .grand-total h3 { margin: 0; font-size: 12px; text-transform: uppercase; opacity: 0.8; }
    .grand-total p { margin: 5px 0 0 0; font-size: 24px; font-weight: 800; }

    .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    
    .ar-font { font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <div class="company-header">
    <div class="brand">
      <h1>SOSAB CONSTRUCTION</h1>
      <p>Building Excellence / بناء التميز</p>
    </div>
    <div style="text-align: right;">
      <p style="margin:0; font-weight: 800; font-size: 18px;">INVENTAIRE DES MATÉRIAUX</p>
      <p style="margin:0; font-size: 12px; color: #64748b;">Généré le: ${formatDateTN(new Date())}</p>
    </div>
  </div>

  <div class="report-title">
    <h2>Journal des Flux de Matériaux</h2>
    <div class="ar-title ar-font">سجل تدفق المواد</div>
  </div>

  <div class="meta-info">
    <div class="meta-box">
      <h4>Information du Projet</h4>
      <p><strong>Projet:</strong> ${project.name}</p>
      <p><strong>Lieu:</strong> ${project.location || 'Tunis, Tunisie'}</p>
      <p><strong>Période:</strong> ${data.headerLabel || week}</p>
    </div>
    <div class="meta-box ar ar-font">
      <h4>معلومات المشروع</h4>
      <p><strong>المشروع:</strong> ${project.name}</p>
      <p><strong>الموقع:</strong> ${project.location || 'تونس'}</p>
      <p><strong>الفترة:</strong> ${data.headerLabel || week}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th width="15%">Date / <span class="ar-font">التاريخ</span></th>
        <th width="30%">Articles & Détails / <span class="ar-font">المقالات والتفاصيل</span></th>
        <th width="10%">Type / <span class="ar-font">النوع</span></th>
        <th width="10%">Quantité / <span class="ar-font">الكمية</span></th>
        <th width="10%">U.P (DT) / <span class="ar-font">سعر الوحدة</span></th>
        <th width="15%" style="text-align: right;">Total / <span class="ar-font">المجموع</span></th>
        <th width="10%">Balance / <span class="ar-font">الرصيد</span></th>
      </tr>
    </thead>
    <tbody>
      ${materials.map(mat => {
    const matMovements = (movements || []).filter(m => m.name === mat.name);
    return `
          <tr class="mat-header">
            <td colspan="2">
              <span style="font-size: 14px;">📦 ${mat.name}</span> 
              <span style="font-weight: 400; color: #64748b; font-size: 11px; margin-left:10px;">[${mat.category || 'Standard'}]</span>
            </td>
            <td style="text-align: center;">${mat.unit}</td>
            <td style="text-align: center;">
              <div style="color: #059669; font-size: 10px;">IN: ${formatNumber(mat.in)}</div>
              <div style="color: #dc2626; font-size: 10px;">OUT: ${formatNumber(mat.out)}</div>
            </td>
            <td class="num price-col" style="text-align: center;">${formatPrice(mat.price || 0)}</td>
            <td class="num total-col" style="text-align: right; background: #e2e8f0;">${formatPrice((mat.in - mat.out) * (mat.price || 0))} DT</td>
            <td class="num" style="text-align: center; color: #1e40af;">${formatNumber(mat.balance)}</td>
          </tr>
          
          ${matMovements.length > 0 ? matMovements.map(m => `
            <tr class="move-row">
              <td class="num" style="color: #64748b;">${new Date(m.date).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
              <td>
                <div style="font-weight: 600;">${m.deliveredBy !== 'N/A' ? 'Chauffeur: ' + m.deliveredBy : 'Sortie Chantier'}</div>
                <div style="font-size: 10px; color: #94a3b8;">Fournisseur: ${m.supplier || 'N/A'}</div>
                ${m.notes ? `<div style="font-size: 10px; color: #334155; font-style: italic;">Note: ${m.notes}</div>` : ''}
              </td>
              <td style="text-align: center;">
                <span class="type-badge ${m.type === 'IN' ? 'type-in' : 'type-out'}">${m.type}</span>
              </td>
              <td class="num" style="text-align: center; font-weight: 700;">${m.type === 'IN' ? '+' : '-'}${formatNumber(m.quantity)}</td>
              <td class="num price-col" style="text-align: center;">${formatPrice(mat.price || 0)}</td>
              <td class="num total-col" style="text-align: right;">${formatPrice(m.cost || 0)} DT</td>
              <td class="num" style="text-align: center; color: #94a3b8; font-size: 11px;">-</td>
            </tr>
          `).join('') : `
            <tr><td colspan="7" style="text-align: center; color: #94a3b8; font-style: italic; font-size: 11px; padding: 15px;">Aucun mouvement pour cette période</td></tr>
          `}
          <tr style="height: 5px;"><td colspan="7" style="border: none;"></td></tr>
        `;
  }).join('')}
    </tbody>
  </table>

  <div class="stats-footer">
    <div class="grand-total">
      <h3>Dépense Totale (Période) / إجمالي النفقات</h3>
      <p>${formatPrice(totalPeriodCost)} TND</p>
    </div>
  </div>

  <div class="footer">
    <p>Ce document est une pièce comptable produite par le système de gestion SOSAB - Page 1 / 1</p>
    <p class="ar-font" style="direction: rtl;">هذا المستند هو مستند محاسبي صادر عن نظام إدارة SOSAB</p>
  </div>
</body>
</html>
  `;
};

// Generate activity report HTML
exports.generateActivityReportHTML = (data) => {
  const { project, week, activities } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport d'Activités / تقرير الأنشطة - ${project.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563EB; padding-bottom: 20px; }
    .header h1 { color: #333; margin: 0; font-size: 24px; }
    .header h2 { color: #2563EB; margin: 10px 0; font-size: 20px; }
    .header p { color: #666; margin: 5px 0; }
    .bilingual { display: flex; justify-content: space-between; align-items: center; }
    .bilingual .ar { direction: rtl; text-align: right; }
    .bilingual .fr { direction: ltr; text-align: left; }
    .activity { margin: 15px 0; padding: 15px; border-left: 4px solid #2563EB; background-color: #F9FAFB; border-radius: 5px; }
    .activity h3 { color: #2563EB; margin-top: 0; }
    .activity p { color: #374151; line-height: 1.6; }
    .activity small { color: #6B7280; }
    .footer { margin-top: 30px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SOSAB - Système de Gestion de Construction</h1>
    <h1 style="direction: rtl;">نظام إدارة البناء SOSAB</h1>
    <h2>Rapport d'Activités Hebdomadaire</h2>
    <h2 style="direction: rtl;">تقرير الأنشطة الأسبوعي</h2>
    <div class="bilingual">
      <div class="fr">
        <p><strong>Projet:</strong> ${project.name}</p>
        <p><strong>Lieu:</strong> ${project.location || 'Non spécifié'}</p>
        <p><strong>Semaine:</strong> ${week}</p>
        <p><strong>Date de génération:</strong> ${formatDateTN(new Date())}</p>
      </div>
      <div class="ar">
        <p><strong>المشروع:</strong> ${project.name}</p>
        <p><strong>الموقع:</strong> ${project.location || 'غير محدد'}</p>
        <p><strong>الأسبوع:</strong> ${week}</p>
        <p><strong>تاريخ الإنشاء:</strong> ${formatDateTN(new Date())}</p>
      </div>
    </div>
  </div>
  
  ${activities.map(activity => `
    <div class="activity">
      <h3>${activity.title} / ${activity.title}</h3>
      <p>${activity.description}</p>
      <p><small>Date / التاريخ: ${typeof activity.date === 'string' ? activity.date : formatDateTN(activity.date)}</small></p>
    </div>
  `).join('')}
  
  <div class="footer">
    <p>Ce rapport a été généré automatiquement par le système SOSAB</p>
    <p style="direction: rtl;">تم إنشاء هذا التقرير تلقائياً بواسطة نظام SOSAB</p>
  </div>
</body>
</html>
  `;
};

// Generate Attendance Report HTML
exports.generateAttendanceReportHTML = (data) => {
  const { project, headerLabel, attendanceGrid } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport de Pointage - ${project.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 15px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #1e293b; padding-bottom: 15px; }
    .header h1 { color: #1e293b; margin: 5px 0; font-size: 18px; font-weight: 800; }
    .header h2 { color: #2563EB; margin: 5px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10px; }
    th, td { border: 1px solid #333; padding: 6px 4px; text-align: center; }
    th { background-color: #1e293b; color: white; font-weight: bold; font-size: 9px; }
    .worker-name { text-align: left; padding-left: 8px; font-weight: 600; }
    .total-col { background-color: #fef3c7; font-weight: bold; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; }
    .footer div { flex: 1; text-align: center; border-top: 1px solid #333; padding-top: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>POINTAGE CHANTIER: ${project.name}</h1>
    <h2>PAIEMENT: ${headerLabel} - ANNEE: ${new Date().getFullYear()}</h2>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>QUALIF</th>
        <th>NOM ET PRENOM</th>
        ${(data.rangeLabels || Array.from({ length: 31 }, (_, i) => i + 1)).map(d => `<th>${d}</th>`).join('')}
        <th>TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${attendanceGrid.map(worker => `
        <tr>
          <td>${worker.qualification || 'Fer'}</td>
          <td class="worker-name">${worker.name}</td>
          ${worker.dailyAttendance.map(val => `<td>${val}</td>`).join('')}
          <td class="total-col">${worker.totalDays}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <div>SIG: CHEF CHANTIER</div>
    <div>SIG: POINTEUR</div>
    <div>SIG: GERANT</div>
  </div>
</body>
</html>
  `;
};

// Generate Payment Report HTML
exports.generatePaymentReportHTML = (data) => {
  const { project, headerLabel, workers, totalPayment } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport de Paiement - ${project.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1e293b; padding-bottom: 15px; }
    .header h1 { color: #1e293b; margin: 5px 0; font-size: 20px; font-weight: 800; }
    .header h2 { color: #2563EB; margin: 5px 0; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #333; padding: 10px 8px; text-align: center; font-size: 11px; }
    th { background-color: #1e293b; color: white; font-weight: bold; }
    .worker-name { text-align: left; padding-left: 10px; font-weight: 600; }
    .period-col { background-color: #fef3c7; }
    .balance-col { background-color: #d4edda; font-weight: bold; color: #166534; }
    .currency { font-weight: 600; }
    .total-row { font-weight: bold; font-size: 13px; background-color: #f8f9fa; }
    .total-row td { padding: 15px; }
    .grand-total { background-color: #d4edda; font-size: 16px; font-weight: 800; color: #166534; }
    .footer { margin-top: 40px; display: flex; justify-content: space-around; font-size: 12px; font-weight: bold; }
    .footer div { flex: 1; text-align: center; border-top: 1px solid #333; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>POINTAGE CHANTIER: ${project.name}</h1>
    <h2>PAIEMENT: ${headerLabel} - ANNEE: ${new Date().getFullYear()}</h2>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>QUALIF</th>
        <th>NOM ET PRENOM</th>
        <th class="period-col">${headerLabel}<br>(Période)</th>
        <th>TAUX du J</th>
        <th>TOTAL / DT</th>
        <th class="balance-col">NET A PAYER</th>
        <th>SIGNATURE</th>
      </tr>
    </thead>
    <tbody>
      ${workers.map(worker => `
        <tr>
          <td>${worker.qualification || 'Fer'}</td>
          <td class="worker-name">${worker.name}</td>
          <td class="period-col">${worker.daysWorked}</td>
          <td class="currency">${formatTND(worker.dailyRate)}</td>
          <td class="currency">${formatTND(worker.totalAmount)}</td>
          <td class="balance-col currency">${formatTND(worker.balance)}</td>
          <td></td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="5" style="text-align: right; padding-right: 20px;">Total de paiement: ${headerLabel}</td>
        <td class="grand-total">${formatTND(totalPayment)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <div>SIG: CHEF CHANTIER</div>
    <div>SIG: GERANT</div>
  </div>
</body>
</html>
  `;
};
