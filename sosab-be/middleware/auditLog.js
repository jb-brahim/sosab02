const AuditLog = require('../models/AuditLog');

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
            await AuditLog.create({
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

