// Get week string in format YYYY-WW
exports.getWeekString = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  const year = d.getFullYear();
  return `${year}-${weekNum.toString().padStart(2, '0')}`;
};

// Get start and end dates of a week
exports.getWeekDates = (weekString) => {
  const [yearPart, weekPart] = weekString.split('-');
  const year = parseInt(yearPart, 10);
  const week = parseInt(weekPart.replace('W', ''), 10);
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }

  const startDate = new Date(ISOweekStart);
  const endDate = new Date(ISOweekStart);
  endDate.setDate(endDate.getDate() + 6);

  return { startDate, endDate };
};

