const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const { getWeekDates } = require('./weekHelper');

// Calculate weekly salary for a worker
exports.calculateWeeklySalary = async (workerId, projectId, week, customStartDate, customEndDate) => {
  try {
    const worker = await Worker.findById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    let startDate, endDate;
    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dates = getWeekDates(week);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    // Get all attendance records for the week
    const attendances = await Attendance.find({
      workerId,
      projectId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    let baseSalary = 0;
    let overtimeHours = 0;
    let totalBonus = 0;
    let totalPenalty = 0;
    let daysWorked = 0;

    attendances.forEach(attendance => {
      if (attendance.present) {
        daysWorked++;
        baseSalary += worker.dailySalary;
        overtimeHours += attendance.overtime || 0;
        totalBonus += attendance.bonus || 0;
        totalPenalty += attendance.penalty || 0;
      }
    });

    // Calculate overtime pay (assuming 1.5x hourly rate)
    // Assuming 8 hours per day
    const hourlyRate = worker.dailySalary / 8;
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    const totalSalary = baseSalary + overtimePay + totalBonus - totalPenalty;

    return {
      baseSalary,
      overtime: overtimePay,
      overtimeHours,
      bonus: totalBonus,
      penalty: totalPenalty,
      daysWorked,
      totalSalary
    };
  } catch (error) {
    throw error;
  }
};

