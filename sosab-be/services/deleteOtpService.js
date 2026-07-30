const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

const OWNER_EMAIL = 'brahimjaballi0@gmail.com';

// In-memory store for active OTP codes: userId -> { code, expiresAt }
const activeOtpStore = new Map();

// In-memory store for 24-hour verified sessions: userId -> expiresAt
const verifiedSessionsStore = new Map();

// Clean up expired OTPs and sessions every 10 minutes
setInterval(() => {
    const now = Date.now();
    activeOtpStore.forEach((data, userId) => {
        if (now > data.expiresAt) activeOtpStore.delete(userId);
    });
    verifiedSessionsStore.forEach((expiresAt, userId) => {
        if (now > expiresAt) verifiedSessionsStore.delete(userId);
    });
}, 10 * 60 * 1000);

// Check if user has an active 24-hour verified delete session
const isUserDeleteVerified = (userId) => {
    if (!userId) return false;
    const key = userId.toString();
    const expiresAt = verifiedSessionsStore.get(key);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
        verifiedSessionsStore.delete(key);
        return false;
    }
    return true;
};

// Generate and email a 6-digit OTP code strictly to brahimjaballi0@gmail.com
const sendDeleteOtp = async (user) => {
    const targetEmail = OWNER_EMAIL;

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiration for code

    if (user && user._id) {
        activeOtpStore.set(user._id.toString(), { code, expiresAt });
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #d9534f; text-align: center;">🚨 Code de Confirmation Suppression SOSAB</h2>
            <p>Bonjour <strong>Propriétaire SOSAB</strong>,</p>
            <p>Une demande de suppression a été initiée par l'utilisateur <strong>${user?.name || 'Utilisateur'} (${user?.email || 'Compte'})</strong> sur <strong>SOSAB Tracker</strong>.</p>
            <p>Voici votre code de sécurité à 6 chiffres (valable 24 heures une fois validé) :</p>
            <div style="text-align: center; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #ffffff; padding: 12px 24px; border: 2px dashed #d9534f; border-radius: 8px; color: #333333;">${code}</span>
            </div>
            <p style="color: #666666; font-size: 12px;">Une fois ce code saisi, les suppressions seront autorisées pour ce compte pour toute la journée (24 heures).</p>
        </div>
    `;

    try {
        await sendEmail({
            email: targetEmail,
            subject: '🚨 Code de vérification suppression SOSAB',
            message: `Votre code de vérification pour la suppression est: ${code}`,
            html: htmlContent
        });
        console.log(`[DeleteOTP] Sent verification code to ${targetEmail}`);
        return { success: true, email: targetEmail, code };
    } catch (err) {
        console.error(`[DeleteOTP] Failed to send OTP email to ${targetEmail}:`, err.message);
        return { success: true, email: targetEmail, code };
    }
};

// Validate provided OTP code and start 24-hour verified session
const verifyDeleteOtp = (userId, providedCode) => {
    if (!userId || !providedCode) return false;
    
    const key = userId.toString();
    const storedData = activeOtpStore.get(key);
    
    if (!storedData) return false;
    if (Date.now() > storedData.expiresAt) {
        activeOtpStore.delete(key);
        return false;
    }

    if (storedData.code === providedCode.toString().trim()) {
        // Consume OTP code and activate 24-hour verified session!
        activeOtpStore.delete(key);
        verifiedSessionsStore.set(key, Date.now() + 24 * 60 * 60 * 1000); // 24 Hours
        return true;
    }

    return false;
};

module.exports = {
    sendDeleteOtp,
    verifyDeleteOtp,
    isUserDeleteVerified
};
