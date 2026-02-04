// Load env vars - support .env.development, .env.production, etc.
const dotenv = require('dotenv');
const fs = require('fs');

// Determine which env file to load
let envFile = null;
if (process.env.NODE_ENV) {
  envFile = `.env.${process.env.NODE_ENV}`;
} else {
  // Auto-detect: try .env.development first, then .env
  if (fs.existsSync('.env.development')) {
    envFile = '.env.development';
  } else if (fs.existsSync('.env')) {
    envFile = '.env';
  }
}

// Load the file if found
if (envFile && fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`Loaded: ${envFile}\n`);
} else {
  console.log('Warning: No .env file found. Using system environment variables only.\n');
}
const { sendEmail } = require('../utils/emailService');

// Test email configuration
async function testEmail() {
  console.log('Testing email configuration...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : '❌ NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
  console.log('');

  // Validate configuration
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration is incomplete!');
    console.error('\nPlease set the following in your .env file:');
    console.error('  EMAIL_HOST=smtp.gmail.com (or your SMTP server)');
    console.error('  EMAIL_PORT=587');
    console.error('  EMAIL_USER=your-email@gmail.com');
    console.error('  EMAIL_PASS=your-app-password');
    console.error('  EMAIL_FROM=noreply@sosab.com');
    console.error('\nSee ENV_SETUP_GUIDE.md for detailed instructions.');
    process.exit(1);
  }

  // Check for common mistakes
  if (process.env.EMAIL_HOST === 'localhost' || process.env.EMAIL_HOST === '127.0.0.1') {
    console.error('❌ ERROR: EMAIL_HOST is set to localhost!');
    console.error('Please use a proper SMTP server:');
    console.error('  - Gmail: smtp.gmail.com');
    console.error('  - Outlook: smtp-mail.outlook.com');
    console.error('  - Yahoo: smtp.mail.yahoo.com');
    process.exit(1);
  }

  // Test email sending
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  console.log(`Attempting to send test email to: ${testEmail}...\n`);

  try {
    await sendEmail({
      email: testEmail,
      subject: 'SOSAB Email Test',
      message: 'This is a test email from SOSAB backend. If you receive this, your email configuration is working correctly!'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Check your inbox (and spam folder) for the test email.');
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused. Possible issues:');
      console.error('  1. EMAIL_HOST is incorrect or set to localhost');
      console.error('  2. Firewall is blocking the connection');
      console.error('  3. SMTP server is down');
      console.error(`  4. Trying to connect to: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    } else if (error.code === 'EAUTH') {
      console.error('\nAuthentication failed. Possible issues:');
      console.error('  1. EMAIL_USER or EMAIL_PASS is incorrect');
      console.error('  2. For Gmail: Use App Password, not regular password');
      console.error('  3. 2-Factor Authentication must be enabled for Gmail');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\nConnection timeout. Possible issues:');
      console.error('  1. Network connectivity problem');
      console.error('  2. EMAIL_HOST is incorrect');
      console.error('  3. Firewall blocking port', process.env.EMAIL_PORT);
    }
    
    console.error('\nSee ENV_SETUP_GUIDE.md for troubleshooting help.');
    process.exit(1);
  }
}

// Run test
testEmail();

