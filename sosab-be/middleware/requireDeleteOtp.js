const { sendDeleteOtp, verifyDeleteOtp } = require('../services/deleteOtpService');

// Middleware to enforce 2-Step Verification for all DELETE operations
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

    // Check for OTP code in headers, body, or query params
    const providedOtp = req.headers['x-delete-otp'] || req.body?.deleteOtp || req.body?.confirmCode || req.query?.deleteOtp;

    if (providedOtp) {
        const isValid = verifyDeleteOtp(req.user._id, providedOtp);
        if (isValid) {
            console.log(`[Delete2FA] ✅ Verified 2-Step OTP code for user ${req.user.email}. Proceeding with deletion.`);
            return next();
        } else {
            console.warn(`[Delete2FA] ❌ Invalid or expired 2-Step OTP code attempted by user ${req.user.email}`);
            return res.status(403).json({
                success: false,
                requiresOtp: true,
                message: 'Code de sécurité à 6 chiffres incorrect ou expiré. Un nouveau code vous a été envoyé par email.'
            });
        }
    }

    // No OTP provided -> Automatically generate & send OTP code to user's email
    try {
        await sendDeleteOtp(req.user);
    } catch (err) {
        console.error('[Delete2FA] Error triggering OTP email:', err.message);
    }

    return res.status(428).json({
        success: false,
        requiresOtp: true,
        message: `Validation de sécurité requise (2-Step Verification). Un code de sécurité à 6 chiffres a été envoyé par email à ${req.user.email}. Veuillez saisir ce code pour valider la suppression.`
    });
};

module.exports = requireDeleteOtp;
