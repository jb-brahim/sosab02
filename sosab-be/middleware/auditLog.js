const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Project = require('../models/Project');
const Worker = require('../models/Worker');
const Notification = require('../models/Notification');
const webpush = require('web-push');
const https = require('https');

// Configure VAPID keys for web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@sosab.tn',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Audit logging middleware
exports.logAction = (action, resource) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to capture response
    res.json = function(data) {
      // Log after response is sent
      setImmediate(async () => {
        try {
          if (req.user) {
            // Clean IP address (supporting x-forwarded-for for proxies)
            let cleanIp = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || '';
            if (cleanIp.includes(',')) {
              cleanIp = cleanIp.split(',')[0].trim();
            }
            if (cleanIp.startsWith('::ffff:')) {
              cleanIp = cleanIp.substring(7);
            }

            // Resolve IP location and coordinates
            let ipLocation = 'Inconnue';
            let lat = null;
            let lon = null;

            const isLocal = !cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost';
            if (isLocal) {
              ipLocation = 'Localhost';
            }

            // Check if exact GPS coordinates were sent in request headers
            if (req.headers['x-latitude'] && req.headers['x-longitude']) {
              lat = parseFloat(req.headers['x-latitude']);
              lon = parseFloat(req.headers['x-longitude']);
            }

            if (!isLocal) {
              const geoData = await new Promise((resolve) => {
                https.get(`https://freeipapi.com/api/json/${cleanIp}`, (res) => {
                  let data = '';
                  res.on('data', (chunk) => data += chunk);
                  res.on('end', () => {
                    try {
                      resolve(JSON.parse(data));
                    } catch {
                      resolve(null);
                    }
                  });
                }).on('error', () => {
                  resolve(null);
                });
              });

              if (geoData) {
                if (geoData.cityName && geoData.countryName) {
                  ipLocation = `${geoData.cityName}, ${geoData.countryName}`;
                } else if (geoData.countryName) {
                  ipLocation = geoData.countryName;
                }

                // Only use IP-based coordinates if browser GPS coordinates weren't sent
                if (lat === null || lon === null) {
                  lat = geoData.latitude || null;
                  lon = geoData.longitude || null;
                }
              }
            }

            const auditLog = await AuditLog.create({
              userId: req.user._id,
              action: action,
              resource: resource,
              resourceId: req.params.id || req.body.id || null,
              changes: {
                body: req.body,
                params: req.params,
                query: req.query
              },
              ipAddress: cleanIp,
              location: ipLocation,
              latitude: lat,
              longitude: lon,
              userAgent: req.get('user-agent')
            });

            // Send push notification to Admins about the new log
            try {
              let title = 'SOSAB';
              let bodyText = '';

              const body = req.body || {};
              const userName = req.user.name;

              // Clean, social-network-style formatting (like Facebook/YouTube)
              if (resource === 'Attendance') {
                const worker = await Worker.findById(body.workerId);
                const project = await Project.findById(body.projectId);
                const wName = worker ? worker.name : 'un ouvrier';
                const pName = project ? project.name : 'un chantier';
                const isPresent = body.present === true || body.present === 'true' || body.present === 1;

                title = `Présence: ${wName}`;
                bodyText = `${userName} a marqué ${wName} comme ${isPresent ? 'Présent' : 'Absent'} sur le chantier ${pName}.`;
              } else if (resource === 'User' && action === 'update') {
                const targetUser = await User.findById(req.params.id);
                const tName = targetUser ? targetUser.name : 'un utilisateur';

                title = `Sécurité: ${tName}`;
                if (body.active === true || body.active === 'true') {
                  bodyText = `${userName} a activé le compte de ${tName}.`;
                } else if (body.active === false || body.active === 'false') {
                  bodyText = `${userName} a bloqué le compte de ${tName}.`;
                } else if (body.password) {
                  bodyText = `${userName} a réinitialisé le mot de passe de ${tName}.`;
                } else {
                  bodyText = `${userName} a mis à jour les informations de ${tName}.`;
                }
              } else if (resource === 'User' && action === 'create') {
                const tName = body.name || 'un utilisateur';
                title = 'Nouvel Utilisateur';
                bodyText = `${userName} a créé le compte de ${tName}.`;
              } else if (resource === 'Project') {
                const pName = body.name || (await Project.findById(req.params.id || req.body.id))?.name || 'un chantier';
                title = `Chantier: ${pName}`;
                bodyText = `${userName} a ${action === 'create' ? 'créé' : action === 'delete' ? 'supprimé' : 'mis à jour'} le chantier ${pName}.`;
              } else if (resource === 'Worker') {
                const wName = body.name || (await Worker.findById(req.params.id || req.body.id))?.name || 'un ouvrier';
                title = `Ouvrier: ${wName}`;
                bodyText = `${userName} a ${action === 'create' ? 'ajouté' : action === 'delete' ? 'retiré' : 'mis à jour'} l'ouvrier ${wName}.`;
              } else {
                // Fallback for other resources
                const actionLabels = {
                  create: 'créé',
                  update: 'modifié',
                  delete: 'supprimé',
                  login: 'connecté',
                  logout: 'déconnecté'
                };
                const actionStr = actionLabels[action] || action;
                title = `Activité: ${resource}`;
                bodyText = `${userName} a ${actionStr} la ressource ${resource}.`;
              }

              // Find all active Admins
              const admins = await User.find({ role: 'Admin', active: true });

              if (admins.length > 0) {
                // 1. Create in-app notification in database for the bell icon
                const notifications = admins.map(admin => ({
                  userId: admin._id,
                  type: 'system',
                  title,
                  message: bodyText,
                  link: '/owner/logs',
                  read: false
                }));
                await Notification.insertMany(notifications);

                // 2. Send Web Push notification to subscribed devices (phone/PC)
                const payload = JSON.stringify({
                  title,
                  body: bodyText,
                  link: '/owner/logs',
                  icon: '/logo.png'
                });

                for (const admin of admins) {
                  if (admin.pushSubscriptions && admin.pushSubscriptions.length > 0) {
                    for (const sub of admin.pushSubscriptions) {
                      try {
                        await webpush.sendNotification(sub, payload);
                      } catch (error) {
                        console.error('Error sending audit push notification:', error);
                        // Remove invalid subscriptions
                        if (error.statusCode === 410 || error.statusCode === 404) {
                          admin.pushSubscriptions = admin.pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
                          await admin.save();
                        }
                      }
                    }
                  }
                }
              }
            } catch (pushError) {
              console.error('Failed to process audit log push notification:', pushError);
            }
          }
        } catch (error) {
          console.error('Audit log error:', error);
        }
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

