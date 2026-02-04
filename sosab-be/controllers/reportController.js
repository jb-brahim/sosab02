const Report = require('../models/Report');
const Project = require('../models/Project');
const Salary = require('../models/Salary');
const Worker = require('../models/Worker');
const MaterialLog = require('../models/MaterialLog');
const Material = require('../models/Material');
const Attendance = require('../models/Attendance');
const asyncHandler = require('../middleware/asyncHandler');
const { generatePDF, generateSalaryReportHTML, generateMaterialReportHTML, generateActivityReportHTML, generateAttendanceReportHTML, generatePaymentReportHTML } = require('../utils/pdfGenerator');
const { generateAttendanceExcel, generatePaymentExcel } = require('../utils/excelGenerator');
const { getWeekDates, getWeekString } = require('../utils/weekHelper');
const path = require('path');
const fs = require('fs').promises;

// @desc    Generate report
// @route   POST /api/reports/generate
// @access  Private
exports.generateReport = asyncHandler(async (req, res) => {
  const { projectId, type, week, startDate, endDate, format = 'pdf' } = req.body;

  console.log('[Report Generation] Request received:', { projectId, type, week, startDate, endDate });

  // Verify project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check permissions: If not Admin, must be manager of the project
  const isAdmin = req.user.role === 'Admin' || req.user.role === 'admin';
  if (!isAdmin && project.managerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to generate reports for this project'
    });
  }

  let start, end;
  let dateLabel;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    if (start > end) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 32) { // Allow slightly more than 30 days just in case, say 31 days + buffer
      return res.status(400).json({ success: false, message: 'Date range cannot exceed 1 month' });
    }

    dateLabel = `Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;

  } else if (week) {
    // Fallback to week logic
    let weekDates;
    try {
      weekDates = getWeekDates(week);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid week format' });
    }
    start = weekDates.startDate;
    end = weekDates.endDate;
    dateLabel = `Semaine ${week}`;
  } else {
    return res.status(400).json({ success: false, message: 'Please provide either a week or start/end dates' });
  }

  // Check if report already exists - disabled to allow template updates to reflect immediately
  /*
  const query = { projectId, type };
  if (week) query.week = week;
  if (startDate && endDate) {
    query.startDate = start;
    query.endDate = end;
  }

  const existingReport = await Report.findOne(query);
  if (existingReport) {
    return res.status(200).json({
      success: true,
      message: 'Report already exists',
      data: existingReport
    });
  }
  */

  let htmlContent;
  let reportData;

  console.log('[Report Generation] Generating report for period:', start, end);

  // If type is salary and using custom range, map it to payment logic which calculates daily
  let effectiveType = type;
  if (type === 'salary' && !week) {
    console.log('[Report Generation] Mapping salary for custom range to payment logic');
    effectiveType = 'payment';
  }

  if (effectiveType === 'salary') {
    // Generate salary report
    // Allow logic to capture partial weeks implies fetching Daily Salaries if we bad them 
    // OR fetching Weekly Salaries that overlap? 
    // Existing logic uses weekly 'Salary' model. 
    // IF custom range: we might need to approximate or change logic.
    // However, existing Salary model IS weekly. 
    // For custom range: Aggregating weekly salaries that fall within range? 
    // Or if range < 1 week? 
    // PROBLEM: Salary is computed weekly. 
    // SOLUTION: For now, if custom date range, we warn or just fetch overlapping weekly salaries?
    // BETTER: For custom range, we calculate daily estimate based on attendance?
    // Actually, let's use the Salary model if it matches weeks, or warn. Easiest: Aggregating salaries for weeks included in range.
    // If start/end fall in middle of week, we might include full week or exclude.
    // Let's assume we fetch all Salaries where 'week' string falls within the dates? 
    // Or better: Warn that Salary report is best generated weekly.
    // BUT user asked for custom range.
    // Let's fetch all Workers, then calculate estimated salary from DailyReports in that range if possible?
    // No, DailyReport only has 'workersPresent' number, NOT names.
    // Attendance is in... where? Attendance model? 
    // We haven't built explicit Daily Attendance model linked to Worker yet in this conversation context?
    // Wait, 'Salary' model exists. 
    // If the user wants custom range salary, it's hard without daily attendance records.
    // Let's look at Worker model... 'dailySalary'.
    // We can check 'Salary' model for weeks that *overlap* the range.
    // For simplicity V1: Fetch overlapping Weekly Salaries.
    // It's an approximation if range is not exact weeks.

    // Actually, wait. User wants "Minimum 1 day". Calculating salary for 1 day requires knowing if worker worked that day.
    // DailyReport has "workersPresent" count.

    // Let's stick to what we have:
    // If 'week' is provided -> use old logic.
    // If 'date range' is provided -> this might be inaccurate for Salary if we don't have daily attendance.
    // But we can generate Material and Activity reports accurately for date ranges.
    // For Salary, let's just use the 'DailyReport' notes/workers count as proxy? No.
    // Let's Disable Salary for custom range OR Return "Not available for custom range" OR best effort.
    // Best effort: Return 0 or empty for now if strict daily data missing.
    // Update: We can just sum up any 'Salary' records whose week falls entirely within the range?

    // DECISION: For 'salary' type with custom dates, if we can't be accurate, we return error or empty.
    // However, let's try to support checking 'Salary' model for weeks.

    const workers = await Worker.find({ projectId, active: true });
    const salaryData = [];

    // If weekly mode or loose matching
    // Let's just collect all workers for listing.
    // If we can't compute exact salary, show base daily rate * days?
    // But we don't know days worked without attendance.
    // Let's just show the Worker list and their Daily Rate in the report for custom range?

    // FOR NOW: If custom range, we generate a "Projected Salary" based on all active workers * days * daily rate?
    // This is risky.
    // Let's fallback to "Weekly Salary Report" logic if 'week' is missing, but query for all weeks in range.

    for (const worker of workers) {
      // Find salaries 
      // We need to match 'week' string to date range. 
      // This is complex. 
      // Let's simplify: Generate report with available data.

      let total = 0;
      let days = 0;

      // Try to find any salary records created in this time?
      // ...

      salaryData.push({
        name: worker.name,
        daysWorked: days,
        baseSalary: worker.dailySalary || 0,
        overtime: 0,
        bonus: 0,
        penalty: 0,
        total: total
      });
    }

    // IF WEEK IS PROVIDED, use old robust logic
    if (week) {
      // ... existing logic ...
      const workers = await Worker.find({ projectId, active: true });
      const realSalaryData = [];
      for (const worker of workers) {
        const salary = await Salary.findOne({ workerId: worker._id, week: week });
        if (salary) {
          realSalaryData.push({
            name: worker.name,
            daysWorked: salary.breakdown.daysWorked,
            baseSalary: salary.breakdown.baseSalary,
            overtime: salary.breakdown.overtime,
            bonus: salary.breakdown.bonus,
            penalty: salary.breakdown.penalty,
            total: salary.totalSalary
          });
        }
      }
      reportData = { project, headerLabel: dateLabel, workers: realSalaryData, totalSalary: realSalaryData.reduce((s, w) => s + w.total, 0) };
      htmlContent = generateSalaryReportHTML(reportData);
    } else {
      // Custom range salary - currently placeholder/empty to prevent crash
      reportData = { project, headerLabel: dateLabel, workers: [], totalSalary: 0 };
      // We'll insert a note in HTML says "Salary detail valid for full weeks only"
      htmlContent = generateSalaryReportHTML(reportData);
    }

  } else if (type === 'material') {
    // Generate material report - ACCURATE for any range
    const materials = await Material.find({ projectId });
    const materialData = [];
    const movementLogs = [];

    for (const material of materials) {
      const logs = await MaterialLog.find({
        materialId: material._id,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      const inTotal = logs.filter(l => l.type === 'IN').reduce((sum, l) => sum + l.quantity, 0);
      const outTotal = logs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + l.quantity, 0);

      materialData.push({
        name: material.name,
        unit: material.unit,
        in: inTotal,
        out: outTotal,
        balance: material.stockQuantity,
        price: material.price || 0,
        supplier: material.supplier || 'N/A',
        category: material.category || 'N/A'
      });

      // Collect detailed movements
      logs.forEach(log => {
        movementLogs.push({
          date: log.date,
          name: material.name,
          unit: material.unit,
          type: log.type,
          quantity: log.quantity,
          deliveredBy: log.deliveredBy || 'N/A',
          notes: log.notes,
          cost: log.cost || (log.quantity * (material.price || 0)),
          supplier: log.supplier || material.supplier || 'N/A'
        });
      });
    }

    reportData = { project, headerLabel: dateLabel, materials: materialData, movements: movementLogs.sort((a, b) => a.date - b.date) };
    htmlContent = generateMaterialReportHTML(reportData);

  } else if (type === 'activity') {
    // Generate activity report - ACCURATE for any range
    // We can fetch DailyReports in range to build activity list?
    // Existing logic was dummy data. Let's make it real using DailyReports?
    // Or keep existing simple logic.

    // Let's improve it: Fetch Daily Reports in range
    const dailyReports = await require('../models/DailyReport').find({
      projectId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const activities = dailyReports.map(dr => ({
      title: `Rapport Journalier / التقرير اليومي`,
      description: `Progression: ${dr.progress}%, Ouvriers: ${dr.workersPresent}.\nNotes: ${dr.notes || ''}\nIssues: ${dr.issues || ''}`,
      date: dr.date
    }));

    if (activities.length === 0) {
      activities.push({
        title: 'Aucune activité / لا يوجد نشاط',
        description: 'Aucun rapport journalier trouvé pour cette période.',
        date: new Date()
      });
    }

    reportData = { project, headerLabel: dateLabel, activities };
    htmlContent = generateActivityReportHTML(reportData);

  } else if (type === 'attendance') {
    // Generate attendance report
    const workers = await Worker.find({ projectId, active: true }).sort({ name: 1 });
    const attendanceGrid = [];

    // Calculate days in range for dynamic columns
    const daysInRange = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      daysInRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Labels for columns (e.g. 1, 2, 3... or 30, 31, 1...)
    const rangeLabels = daysInRange.map(d => d.getDate());

    for (const worker of workers) {
      const attendanceRecords = await Attendance.find({
        workerId: worker._id,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      // Deduplicate records to handle multiple entries per day
      const uniqueRecords = new Map();
      attendanceRecords.forEach(record => {
        if (record.present) {
          // Normalize to local date to avoid UTC shift
          const d = new Date(record.date);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          uniqueRecords.set(dateStr, record.dayValue || 1);
        }
      });

      // Map dynamic days to attendance values
      const dailyAttendance = daysInRange.map(dayDate => {
        // Normalize to local date to avoid UTC shift
        const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
        return uniqueRecords.get(dateStr) || 0;
      });

      // Calculate total from the dynamic range
      totalDays = dailyAttendance.reduce((sum, val) => sum + val, 0);

      attendanceGrid.push({
        name: worker.name,
        qualification: worker.trade || 'Fer',
        dailyRate: worker.dailySalary || 0,
        dailyAttendance,
        totalDays
      });
    }

    reportData = { project, headerLabel: dateLabel, attendanceGrid, rangeLabels };

    if (format === 'excel') {
      // Generate Excel
      const outputDir = path.join(__dirname, '../uploads/reports');
      await fs.mkdir(outputDir, { recursive: true });
      const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}-attendance-${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}-${Date.now()}.xlsx`;
      const outputPath = path.join(outputDir, filename);
      await generateAttendanceExcel(reportData, outputPath);

      const report = await Report.create({
        projectId,
        type,
        week: week || 'CUSTOM',
        startDate: start,
        endDate: end,
        pdfUrl: `/uploads/reports/${filename}`,
        generatedBy: req.user._id
      });

      return res.status(201).json({
        success: true,
        message: 'Attendance report generated successfully',
        data: report
      });
    } else {
      htmlContent = generateAttendanceReportHTML(reportData);
    }

  } else if (type === 'payment') {
    // Generate payment report
    const workers = await Worker.find({ projectId, active: true }).sort({ name: 1 });
    const workerPayments = [];
    let totalPayment = 0;

    for (const worker of workers) {
      const attendanceRecords = await Attendance.find({
        workerId: worker._id,
        date: { $gte: start, $lte: end },
        present: true
      });

      // Deduplicate records by day to avoid duplicate counting
      const uniqueDays = new Map();
      attendanceRecords.forEach(record => {
        // Normalize to local date to avoid UTC shift
        const d = new Date(record.date);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        uniqueDays.set(dateStr, record.dayValue || 1);
      });

      const daysWorked = Array.from(uniqueDays.values()).reduce((sum, val) => sum + val, 0);

      const dailyRate = worker.dailySalary || 0;
      const totalAmount = daysWorked * dailyRate;
      const paymentsMade = 0; // TODO: Implement payment tracking
      const balance = totalAmount - paymentsMade;

      workerPayments.push({
        name: worker.name,
        qualification: worker.trade || 'Worker',
        daysWorked,
        totalDays: daysWorked,
        dailyRate,
        totalAmount,
        paymentsMade,
        balance
      });

      totalPayment += balance;
    }

    reportData = { project, headerLabel: dateLabel, workers: workerPayments, totalPayment };

    if (format === 'excel') {
      // Generate Excel
      const outputDir = path.join(__dirname, '../uploads/reports');
      await fs.mkdir(outputDir, { recursive: true });
      const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}-payment-${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}-${Date.now()}.xlsx`;
      const outputPath = path.join(outputDir, filename);
      await generatePaymentExcel(reportData, outputPath);

      const report = await Report.create({
        projectId,
        type,
        week: week || 'CUSTOM',
        startDate: start,
        endDate: end,
        pdfUrl: `/uploads/reports/${filename}`,
        generatedBy: req.user._id
      });

      return res.status(201).json({
        success: true,
        message: 'Payment report generated successfully',
        data: report
      });
    } else {
      htmlContent = generatePaymentReportHTML(reportData);
    }

  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid report type'
    });
  }

  // Generate PDF
  const outputDir = path.join(__dirname, '../uploads/reports');
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (dirError) {
    return res.status(500).json({ success: false, message: 'Failed to create reports directory' });
  }

  let datePart = week;
  if (!datePart && start && end) {
    datePart = `${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}`;
  }
  const fileExtension = format === 'excel' ? 'xlsx' : 'pdf';
  const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}-${type}-${datePart}-${Date.now()}.${fileExtension}`;
  const outputPath = path.join(outputDir, filename);

  try {
    await generatePDF(htmlContent, outputPath);

    // Store report in database
    const report = await Report.create({
      projectId,
      type,
      week: week || 'CUSTOM',
      startDate: start,
      endDate: end,
      pdfUrl: `/uploads/reports/${filename}`,
      generatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: report
    });
  } catch (pdfError) {
    console.error('PDF error:', pdfError);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
});

// @desc    Get report
// @route   GET /api/reports
// @access  Private
exports.getReport = asyncHandler(async (req, res) => {
  const { projectId, week, type } = req.query;

  let query = {};
  if (projectId) query.projectId = projectId;
  if (week) query.week = week;
  if (type) query.type = type;

  if (req.user.role !== 'Admin') {
    const managedProjects = await Project.find({ managerId: req.user._id });
    const managedProjectIds = managedProjects.map(p => p._id);
    if (query.projectId) {
      if (!managedProjectIds.some(id => id.toString() === query.projectId.toString())) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    } else {
      query.projectId = { $in: managedProjectIds };
    }
  }

  const reports = await Report.find(query)
    .populate('projectId', 'name location')
    .populate('generatedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports
  });
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private/Admin
exports.deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate('projectId');

  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  // Check permissions: Admin, Project Manager, or Report Creator
  const isAdmin = req.user.role === 'Admin';
  const isCreator = report.generatedBy && report.generatedBy.toString() === req.user._id.toString();
  const isManager = report.projectId && report.projectId.managerId && report.projectId.managerId.toString() === req.user._id.toString();

  if (!isAdmin && !isCreator && !isManager) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete reports' });
  }

  // Attempt to delete the file
  if (report.pdfUrl) {
    try {
      // Construct absolute path from relative URL
      // URL: /uploads/reports/filename.pdf
      // Path: __dirname/../uploads/reports/filename.pdf
      // Need to be careful with paths
      const relativePath = report.pdfUrl; // starts with /uploads...
      const absolutePath = path.join(__dirname, '..', relativePath);
      await fs.unlink(absolutePath);
    } catch (err) {
      console.error('Failed to delete report file:', err);
      // Verify if error is ENOENT (file not found), proceed anyway
      if (err.code !== 'ENOENT') {
        // If strictly required, could fail here. But better to clean up DB.
      }
    }
  }

  await report.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Report deleted successfully'
  });
});
