const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const webpush = require('web-push');

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
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent')
            });

            // Send push notification to Admins about the new log
            try {
              const actionLabels = {
                create: 'Création',
                update: 'Modification',
                delete: 'Suppression',
                login: 'Connexion',
                logout: 'Déconnexion',
                approve: 'Approbation',
                reject: 'Rejet'
              };

              const resourceLabels = {
                Attendance: 'Présence',
                DailyReport: 'Rapport Journalier',
                User: 'Utilisateur',
                Project: 'Chantier',
                Material: 'Matériau',
                Task: 'Tâche',
                Notification: 'Notification',
                Salary: 'Salaire',
                Supplier: 'Fournisseur'
              };

              const actionStr = actionLabels[action] || action;
              const resourceStr = resourceLabels[resource] || resource;

              const title = `Activité: ${actionStr} ${resourceStr}`;
              const body = `${req.user.name} (${req.user.role}) a effectué une action de ${actionStr.toLowerCase()} sur: ${resourceStr}.`;

              // Find all Admins who have push subscriptions
              const admins = await User.find({
                role: 'Admin',
                pushSubscriptions: { $exists: true, $not: { $size: 0 } }
              });

              if (admins.length > 0) {
                const payload = JSON.stringify({
                  title,
                  body,
                  link: '/owner/logs',
                  icon: '/logo.png'
                });

                for (const admin of admins) {
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

