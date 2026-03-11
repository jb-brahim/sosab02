const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();
const envPath = path.join(__dirname, '../.env.development');
let content = fs.readFileSync(envPath, 'utf8');

if (!content.includes('VAPID_PUBLIC_KEY')) {
    content += `\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
    content += `\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
    fs.writeFileSync(envPath, content);
    console.log('Keys added to .env.development');
} else {
    console.log('Keys already exist in .env.development');
}
console.log('PUBLIC_KEY_FOR_FRONTEND=' + vapidKeys.publicKey);
