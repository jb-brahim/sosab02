// In-memory rate limiting counters
const loginAttempts = new Map();
const deleteAttempts = new Map();

// Clean up expired entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    
    loginAttempts.forEach((data, ip) => {
        if (now - data.firstAttempt > 15 * 60 * 1000) loginAttempts.delete(ip);
    });
    
    deleteAttempts.forEach((data, ip) => {
        if (now - data.firstAttempt > 60 * 60 * 1000) deleteAttempts.delete(ip);
    });
}, 10 * 60 * 1000);

// 1. Rate limiter for /api/auth/login (Max 10 login attempts per 15 minutes)
const loginLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxLoginAttempts = 10;

    if (!loginAttempts.has(ip)) {
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
        return next();
    }

    const data = loginAttempts.get(ip);
    if (now - data.firstAttempt > windowMs) {
        // Reset window
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
        return next();
    }

    data.count++;
    if (data.count > maxLoginAttempts) {
        console.warn(`[Security Alert] 🚨 Rate limit exceeded for login from IP: ${ip}`);
        return res.status(429).json({
            success: false,
            message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
        });
    }

    next();
};

// 2. Anti-Sabotage Mass Deletion Limiter (Max 15 DELETE requests per 1 hour)
const antiDeletionLimiter = (req, res, next) => {
    if (req.method !== 'DELETE') {
        return next();
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxDeletes = 15;

    if (!deleteAttempts.has(ip)) {
        deleteAttempts.set(ip, { count: 1, firstAttempt: now });
        return next();
    }

    const data = deleteAttempts.get(ip);
    if (now - data.firstAttempt > windowMs) {
        deleteAttempts.set(ip, { count: 1, firstAttempt: now });
        return next();
    }

    data.count++;
    if (data.count > maxDeletes) {
        console.error(`[Security Alert] 🚨 MASS DELETION ATTEMPT BLOCKED from IP: ${ip} (Attempted ${data.count} deletes)`);
        return res.status(429).json({
            success: false,
            message: 'Action bloquée par le système de sécurité. Trop de suppressions effectuées en un court intervalle.'
        });
    }

    next();
};

module.exports = {
    loginLimiter,
    antiDeletionLimiter
};
