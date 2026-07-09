const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Project = require('../models/Project');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const ReminderSetting = require('../models/ReminderSetting');
const { createNotification } = require('../services/notificationService');
const webpush = require('web-push');

const run = async () => {
  await connectDB();
  
  console.log('1. Recherche du manager Houcine Jaballi...');
  const houcine = await User.findOne({ name: /houcine/i });
  if (!houcine) {
    console.error('Manager Houcine non trouvé.');
    process.exit(1);
  }
  
  console.log('2. Recherche du projet École Primaire El Akerma...');
  let project = await Project.findOne({ name: /El Akerma/i });
  if (!project) {
    console.error('Projet El Akerma non trouvé.');
    process.exit(1);
  }

  // Ensure project is Active
  if (project.status !== 'Active') {
    console.log(`Le projet était en status "${project.status}". Passage en status "Active"...`);
    project.status = 'Active';
    await project.save();
  }

  // Check if project has workers
  let workerCount = await Worker.countDocuments({ projectId: project._id, active: true });
  if (workerCount === 0) {
    console.log('Aucun ouvrier trouvé dans ce projet. Ajout d\'un ouvrier fictif pour le test...');
    await Worker.create({
      name: 'Ouvrier Test',
      trade: 'Maçon',
      projectId: project._id,
      dailySalary: 40,
      active: true
    });
    workerCount = 1;
  }

  console.log(`Le projet a maintenant ${workerCount} ouvrier(s) actif(s).`);

  // Clear today's attendance records for this project if any exists
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  
  const deleted = await Attendance.deleteMany({
    projectId: project._id,
    date: { $gte: startOfToday, $lte: endOfToday }
  });
  console.log(`Suppression de ${deleted.deletedCount} pointage(s) existant(s) pour aujourd'hui pour libérer le rappel.`);

  console.log('3. Réinitialisation de la date d\'envoi (lastSentDate)...');
  const setting = await ReminderSetting.findOne();
  if (setting) {
    setting.lastSentDate = '';
    await setting.save();
    console.log('lastSentDate réinitialisé avec succès.');
  } else {
    console.log('ReminderSetting non trouvé. Veuillez en créer un depuis l\'interface d\'abord.');
    process.exit(1);
  }

  console.log('\n--- DÉCLENCHEMENT DE L\'ALERTE ---');
  console.log(`Destinataire: ${houcine.name}`);
  console.log(`Mode sonnerie: ${setting.sound}`);
  
  if (!houcine.pushSubscriptions || houcine.pushSubscriptions.length === 0) {
    console.log('⚠ ERREUR: Le manager n\'a aucun push subscription enregistré. Il ne recevra pas de push sur son téléphone.');
    process.exit(1);
  }

  // Create in-app notification
  await createNotification(
    houcine._id,
    'attendance',
    'Rappel Présence',
    `Veuillez enregistrer les présences pour vos chantiers d'aujourd'hui.`,
    { customSound: setting.sound, customVibration: setting.vibration },
    '/app',
    'high'
  );

  // Send push notification directly
  const payload = JSON.stringify({
    title: '🚨 Rappel Présence',
    body: `Veuillez enregistrer les présences pour vos chantiers d'aujourd'hui.`,
    link: '/app',
    type: 'attendance',
    icon: '/logo.png',
    sound: `/sounds/${setting.sound}.wav`,
    vibrate: setting.vibration ? [300, 100, 300, 100, 400] : [100],
    color: '#FF0000'
  });

  console.log('Envoi du push aux abonnements...');
  for (const sub of houcine.pushSubscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      console.log('✅ Push envoyé avec succès !');
    } catch (pushErr) {
      console.error('Échec d\'envoi du push:', pushErr.message);
    }
  }

  // Lock lastSentDate to today
  const now = new Date();
  const tunisDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Tunis', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  setting.lastSentDate = tunisDate;
  await setting.save();

  console.log('\nTest terminé !');
  process.exit(0);
};

run();
