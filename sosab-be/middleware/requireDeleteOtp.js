const { sendDeleteOtp, verifyDeleteOtp, isUserDeleteVerified } = require('../services/deleteOtpService');

// Middleware to enforce 2-Step Verification (Once Per 24 Hours) for all DELETE operations
const requireDeleteOtp = async (req, res, next) => {
    // Only intercept HTTP DELETE requests
    if (req.method !== 'DELETE') {
        return next();
    }

    // Require authenticated user
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Non autorisé'
        });
    }

    // Only enforce 2-Step OTP verification strictly for the Owner account (brahimjaballi0@gmail.com)
    const isOwner = req.user.email === 'brahimjaballi0@gmail.com' || req.user.role === 'Owner' || req.user.isOwner === true;
    if (!isOwner) {
        return next();
    }

    // 1. Check if user already verified 2FA OTP within the last 24 hours
    if (isUserDeleteVerified(req.user._id)) {
        console.log(`[Delete2FA] ✅ Active 24-hour verified delete session for user ${req.user.email}. Proceeding with deletion.`);
        return next();
    }

    // 2. Check for OTP code in headers, body, or query params
    const providedOtp = req.headers['x-delete-otp'] || req.body?.deleteOtp || req.body?.confirmCode || req.query?.deleteOtp;

    if (providedOtp) {
        const isValid = verifyDeleteOtp(req.user._id, providedOtp);
        if (isValid) {
            console.log(`[Delete2FA] ✅ Verified 2-Step OTP code for user ${req.user.email}. Activated 24-hour delete session.`);
            return next();
        } else {
            console.warn(`[Delete2FA] ❌ Invalid or expired 2-Step OTP code attempted by user ${req.user.email}`);
            return res.status(403).json({
                success: false,
                requiresOtp: true,
                message: 'Code de sécurité à 6 chiffres incorrect ou expiré. Un nouveau code a été envoyé par email à brahimjaballi0@gmail.com.'
            });
        }
    }

    // 3. No active 24h session & no OTP provided -> Automatically generate & send OTP code strictly to brahimjaballi0@gmail.com
    try {
        await sendDeleteOtp(req.user);
    } catch (err) {
        console.error('[Delete2FA] Error triggering OTP email:', err.message);
    }

    return res.status(428).json({
        success: false,
        requiresOtp: true,
        message: 'Validation de sécurité requise (1 fois par 24h). Un code de sécurité à 6 chiffres a été envoyé par email à brahimjaballi0@gmail.com. Veuillez le saisir pour valider les suppressions d\'aujourd\'hui.'
    });
};

module.exports = requireDeleteOtp;
