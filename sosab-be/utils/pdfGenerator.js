const fs = require('fs').promises;
const path = require('path');
// const puppeteer = require('puppeteer'); // TEMPORARILY DISABLED for faster deployment

// Format number with Tunisian locale (space as thousand separator, comma as decimal)
const formatTND = (amount) => {
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount);
};

// Format date in Tunisian format (DD/MM/YYYY)
const formatDateTN = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Generate PDF from HTML using Puppeteer
// TEMPORARILY DISABLED: Puppeteer removed for faster deployment
exports.generatePDF = async (htmlContent, outputPath) => {
  throw new Error('PDF generation is temporarily unavailable. This feature will be re-enabled soon.');
};

// All HTML generation functions remain available for future re-enabling
exports.generateSalaryReportHTML = (data) => {
  throw new Error('PDF generation is temporarily unavailable. This feature will be re-enabled soon.');
};

exports.generateMaterialReportHTML = (data) => {
  throw new Error('PDF generation is temporarily unavailable. This feature will be re-enabled soon.');
};

exports.generateActivityReportHTML = (data) => {
  throw new Error('PDF generation is temporarily unavailable. This feature will be re-enabled soon.');
};

exports.generateAttendanceReportHTML = (data) => {
  throw new Error('PDF generation is temporarily unavailable. This feature will be re-enabled soon.');
};

exports.generatePaymentReportHTML = (data) => {
  throw new Error('PDF generation is temporarily unavailable. This feature will be re-enabled soon.');
};
