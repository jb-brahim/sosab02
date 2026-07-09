const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  await connectDB();
  const users = await User.find({ active: true });
  console.log(`\n--- ABONNEMENTS PUSH PAR UTILISATEUR ---`);
  users.forEach(u => {
    console.log(`- Nom: ${u.name} (Rôle: ${u.role})`);
    console.log(`  ID: ${u._id}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Abonnements push: ${u.pushSubscriptions ? u.pushSubscriptions.length : 0}`);
    if (u.pushSubscriptions && u.pushSubscriptions.length > 0) {
      u.pushSubscriptions.forEach((sub, i) => {
        console.log(`    [${i}]: ${sub.endpoint.substring(0, 50)}...`);
      });
    }
  });
  process.exit(0);
};

run();
