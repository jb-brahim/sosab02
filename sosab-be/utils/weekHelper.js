// Get week string in format YYYY-WW
exports.getWeekString = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
  const startOfFirstWeek = new Date(firstDayOfYear);
  startOfFirstWeek.setDate(firstDayOfYear.getDate() - firstDayOfYear.getDay());
  
  const startOfThisWeek = new Date(d);
  startOfThisWeek.setDate(d.getDate() - d.getDay());
  
  const weekNum = Math.floor((startOfThisWeek - startOfFirstWeek) / (86400000 * 7)) + 1;
  const year = d.getFullYear();
  return `${year}-${weekNum.toString().padStart(2, '0')}`;
};

// Get start and end dates of a week
exports.getWeekDates = (weekString) => {
  const [yearPart, weekPart] = weekString.split('-');
  const year = parseInt(yearPart, 10);
  const week = parseInt(weekPart.replace('W', ''), 10);
  
  const firstDayOfYear = new Date(year, 0, 1);
  const startOfFirstWeek = new Date(firstDayOfYear);
  startOfFirstWeek.setDate(firstDayOfYear.getDate() - firstDayOfYear.getDay());
  
  const startDate = new Date(startOfFirstWeek);
  startDate.setDate(startOfFirstWeek.getDate() + (week - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return { startDate, endDate };
};

