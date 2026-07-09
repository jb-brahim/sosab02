const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const ReminderSetting = require('../models/ReminderSetting');

const check = async () => {
  await connectDB();
  
  console.log('\n--- 1. CONFIGURATION DES RAPPELS ---');
  const setting = await ReminderSetting.findOne();
  if (!setting) {
    console.log('Aucun paramètre de rappel trouvé dans la base de données.');
  } else {
    console.log(`Activé: ${setting.enabled}`);
    console.log(`Heure: ${setting.time}`);
    console.log(`Son: ${setting.sound}`);
    console.log(`Vibration: ${setting.vibration}`);
    console.log(`Date dernier envoi (lastSentDate): "${setting.lastSentDate}"`);
    console.log(`Managers ciblés (IDs):`, setting.managers);
  }

  console.log('\n--- 2. ANALYSE DU MANAGER: HOUCINE JABALLI ---');
  // Find Houcine by name case-insensitive
  const houcine = await User.findOne({ name: /houcine/i });
  if (!houcine) {
    console.log('Manager "houcine" non trouvé.');
    process.exit(0);
  }

  console.log(`ID: ${houcine._id}`);
  console.log(`Nom: ${houcine.name}`);
  console.log(`Rôle: ${houcine.role}`);
  console.log(`Actif: ${houcine.active}`);
  console.log(`Nombre de push subscriptions: ${houcine.pushSubscriptions ? houcine.pushSubscriptions.length : 0}`);
  if (houcine.pushSubscriptions && houcine.pushSubscriptions.length > 0) {
    houcine.pushSubscriptions.forEach((sub, i) => {
      console.log(`  Sub [${i}]: endpoint: ${sub.endpoint.substring(0, 40)}...`);
    });
  } else {
    console.log('⚠ ATTENTION: Houcine n\'a AUCUN abonnement push enregistré ! Les notifications push ne peuvent pas arriver sur son téléphone.');
  }

  console.log('\n--- 3. CHANTIERS ASSIGNÉS ET ÉTAT DU POINTAGE ---');
  const activeProjects = await Project.find({ status: 'Active', managers: houcine._id });
  console.log(`Nombre de chantiers actifs assignés: ${activeProjects.length}`);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  for (const project of activeProjects) {
    const workerCount = await Worker.countDocuments({ projectId: project._id, active: true });
    const attendanceCount = await Attendance.countDocuments({
      projectId: project._id,
      date: { $gte: startOfToday, $lte: endOfToday }
    });
    console.log(`- Chantier: "${project.name}" (ID: ${project._id})`);
    console.log(`  Ouvriers actifs assignés: ${workerCount}`);
    console.log(`  Fiches de présence aujourd'hui: ${attendanceCount}`);
    if (workerCount > 0 && attendanceCount === 0) {
      console.log('  -> Statut: RAPPEL REQUIS');
    } else if (workerCount === 0) {
      console.log('  -> Statut: Ignoré (Aucun ouvrier)');
    } else {
      console.log('  -> Statut: Pointage déjà fait aujourd\'hui');
    }
  }

  process.exit(0);
};

check();
