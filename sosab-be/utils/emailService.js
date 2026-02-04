const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file.');
  }

  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  // Validate host is not localhost
  if (config.host === 'localhost' || config.host === '127.0.0.1') {
    throw new Error(`Invalid EMAIL_HOST: ${config.host}. Please use a proper SMTP server (e.g., smtp.gmail.com, smtp-mail.outlook.com)`);
  }

  return nodemailer.createTransport(config);
};

// Send email
exports.sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

// Send notification email
exports.sendNotificationEmail = async (userEmail, subject, message, attachments = []) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      html: message,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Notification email error:', error);
    throw error;
  }
};

