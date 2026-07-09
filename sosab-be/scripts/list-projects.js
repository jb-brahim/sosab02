const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Project = require('../models/Project');
const User = require('../models/User');

const run = async () => {
  await connectDB();
  const projects = await Project.find().populate('managers', 'name role');
  console.log(`\n--- TOUS LES PROJETS (${projects.length}) ---`);
  projects.forEach((p, i) => {
    console.log(`[${i+1}] Nom: "${p.name}"`);
    console.log(`    Status: "${p.status}"`);
    console.log(`    Managers assignés:`, p.managers.map(m => `${m.name} (${m.role})`));
  });
  process.exit(0);
};

run();
