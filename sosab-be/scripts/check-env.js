// Check which .env file is being loaded
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

console.log('Environment File Checker\n');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

// Determine which file to look for
let envFile = null;
if (process.env.NODE_ENV) {
  envFile = `.env.${process.env.NODE_ENV}`;
} else {
  // Auto-detect: try .env.development first, then .env
  if (fs.existsSync('.env.development')) {
    envFile = '.env.development';
    console.log('Auto-detected: .env.development (exists)');
  } else if (fs.existsSync('.env')) {
    envFile = '.env';
    console.log('Auto-detected: .env (exists)');
  } else {
    envFile = '.env';
    console.log('Looking for: .env (default)');
  }
}
console.log('Will load:', envFile);

// Check if files exist
const files = ['.env', '.env.development', '.env.production', '.env.test'];
console.log('\nExisting .env files:');
files.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`  ${file}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
});

// Load the appropriate file
console.log(`\nLoading: ${envFile}`);
const result = dotenv.config({ path: envFile });
if (result.error) {
  console.log('❌ Error loading:', result.error.message);
  console.log('\nTrying to load base .env...');
  const baseResult = dotenv.config({ path: '.env' });
  if (baseResult.error) {
    console.log('❌ Base .env also not found');
  } else {
    console.log('✅ Loaded base .env');
  }
} else {
  console.log('✅ Successfully loaded', envFile);
}

// Also try base .env (won't override)
dotenv.config({ path: '.env', override: false });

console.log('\nLoaded Environment Variables:');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('  PORT:', process.env.PORT || '❌ NOT SET (default 3000)');
console.log('  ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '❌ NOT SET');
console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET (optional)');

