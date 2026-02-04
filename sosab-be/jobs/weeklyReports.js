const cron = require('node-cron');
const Report = require('../models/Report');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generatePDF, generateSalaryReportHTML, generateMaterialReportHTML, generateActivityReportHTML } = require('../utils/pdfGenerator');
const { getWeekString, getWeekDates } = require('../utils/weekHelper');
const { sendNotificationEmail } = require('../utils/emailService');
const Salary = require('../models/Salary');
const Worker = require('../models/Worker');
const Material = require('../models/Material');
const MaterialLog = require('../models/MaterialLog');
const path = require('path');
const fs = require('fs').promises;

// Generate weekly reports every Monday at 9 AM
const scheduleWeeklyReports = () => {
  cron.schedule('0 9 * * 1', async () => {
    console.log('Starting weekly report generation...');

    try {
      const week = getWeekString();
      const projects = await Project.find({ status: 'Active' });

      for (const project of projects) {
        try {
          // Generate salary report
          await generateWeeklySalaryReport(project, week);

          // Generate material report
          await generateWeeklyMaterialReport(project, week);

          // Generate activity report
          await generateWeeklyActivityReport(project, week);

          // Send notifications to relevant users
          await sendReportNotifications(project, week);
        } catch (error) {
          console.error(`Error generating reports for project ${project.name}:`, error);
        }
      }

      console.log('Weekly report generation completed');
    } catch (error) {
      console.error('Error in weekly report generation:', error);
    }
  });

  console.log('Weekly report scheduler initialized (Mondays at 9 AM)');
};

// Generate weekly salary report
const generateWeeklySalaryReport = async (project, week) => {
  try {
    // Check if report already exists
    const existingReport = await Report.findOne({ projectId: project._id, type: 'salary', week });
    if (existingReport) {
      console.log(`Salary report already exists for project ${project.name}, week ${week}`);
      return;
    }

    const workers = await Worker.find({ projectId: project._id, active: true });
    const salaryData = [];

    for (const worker of workers) {
      const salary = await Salary.findOne({ workerId: worker._id, week });
      if (salary) {
        salaryData.push({
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

    if (salaryData.length === 0) {
      console.log(`No salary data for project ${project.name}, week ${week}`);
      return;
    }

    const totalSalary = salaryData.reduce((sum, w) => sum + w.total, 0);
    const htmlContent = generateSalaryReportHTML({
      project,
      week,
      workers: salaryData,
      totalSalary
    });

    const outputDir = path.join(__dirname, '../uploads/reports');
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `${project.name}-salary-${week}-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);

    await generatePDF(htmlContent, outputPath);

    await Report.create({
      projectId: project._id,
      type: 'salary',
      week,
      pdfUrl: `/uploads/reports/${filename}`,
      generatedBy: null // System generated
    });

    console.log(`Salary report generated for project ${project.name}`);
  } catch (error) {
    console.error(`Error generating salary report for project ${project.name}:`, error);
  }
};

// Generate weekly material report
const generateWeeklyMaterialReport = async (project, week) => {
  try {
    const existingReport = await Report.findOne({ projectId: project._id, type: 'material', week });
    if (existingReport) {
      console.log(`Material report already exists for project ${project.name}, week ${week}`);
      return;
    }

    const { startDate, endDate } = getWeekDates(week);
    const materials = await Material.find({ projectId: project._id });
    const materialData = [];
    const movementLogs = [];

    for (const material of materials) {
      const logs = await MaterialLog.find({
        materialId: material._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const inTotal = logs.filter(l => l.type === 'IN').reduce((sum, l) => sum + l.quantity, 0);
      const outTotal = logs.filter(l => l.type === 'OUT').reduce((sum, l) => sum + l.quantity, 0);

      materialData.push({
        _id: material._id,
        name: material.name,
        unit: material.unit,
        in: inTotal,
        out: outTotal,
        balance: material.stockQuantity
      });

      logs.forEach(log => {
        movementLogs.push({
          _id: log._id,
          name: material.name,
          date: log.date,
          type: log.type,
          quantity: log.quantity,
          deliveredBy: log.deliveredBy,
          notes: log.notes
        });
      });
    }

    if (materialData.length === 0) {
      console.log(`No material data for project ${project.name}, week ${week}`);
      return;
    }

    const htmlContent = generateMaterialReportHTML({
      project,
      week,
      materials: materialData,
      movements: movementLogs.sort((a, b) => a.date - b.date)
    });

    const outputDir = path.join(__dirname, '../uploads/reports');
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `${project.name}-material-${week}-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);

    await generatePDF(htmlContent, outputPath);

    await Report.create({
      projectId: project._id,
      type: 'material',
      week,
      pdfUrl: `/uploads/reports/${filename}`,
      generatedBy: null
    });

    console.log(`Material report generated for project ${project.name}`);
  } catch (error) {
    console.error(`Error generating material report for project ${project.name}:`, error);
  }
};

// Generate weekly activity report
const generateWeeklyActivityReport = async (project, week) => {
  try {
    const existingReport = await Report.findOne({ projectId: project._id, type: 'activity', week });
    if (existingReport) {
      console.log(`Activity report already exists for project ${project.name}, week ${week}`);
      return;
    }

    const activities = [
      { title: 'Project Progress', description: `Project progress: ${project.progress}%`, date: new Date() },
      { title: 'Materials', description: 'Material logs updated', date: new Date() },
      { title: 'Attendance', description: 'Worker attendance marked', date: new Date() }
    ];

    const htmlContent = generateActivityReportHTML({
      project,
      week,
      activities
    });

    const outputDir = path.join(__dirname, '../uploads/reports');
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `${project.name}-activity-${week}-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);

    await generatePDF(htmlContent, outputPath);

    await Report.create({
      projectId: project._id,
      type: 'activity',
      week,
      pdfUrl: `/uploads/reports/${filename}`,
      generatedBy: null
    });

    console.log(`Activity report generated for project ${project.name}`);
  } catch (error) {
    console.error(`Error generating activity report for project ${project.name}:`, error);
  }
};

// Send report notifications
const sendReportNotifications = async (project, week) => {
  try {
    // Get users who should receive notifications
    const users = await User.find({
      $or: [
        { role: 'Admin' },
        { role: 'Accountant' },
        { role: 'Project Manager', assignedProjects: project._id }
      ],
      active: true
    });

    for (const user of users) {
      // Create notification
      await Notification.create({
        userId: user._id,
        type: 'report',
        message: `Weekly reports for project ${project.name} (Week ${week}) have been generated`,
        link: `/reports?projectId=${project._id}&week=${week}`
      });

      // Send email if email service is configured
      if (process.env.EMAIL_USER && user.email) {
        try {
          await sendNotificationEmail(
            user.email,
            `Weekly Reports Generated - ${project.name}`,
            `<p>Weekly reports for project <strong>${project.name}</strong> (Week ${week}) have been generated.</p>
             <p>You can access them in your dashboard.</p>`
          );
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
        }
      }
    }

    console.log(`Notifications sent for project ${project.name}`);
  } catch (error) {
    console.error(`Error sending notifications for project ${project.name}:`, error);
  }
};

module.exports = scheduleWeeklyReports;

