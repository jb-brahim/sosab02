const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

// In-memory store for active OTP codes: userId -> { code, expiresAt }
const activeOtpStore = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
    const now = Date.now();
    activeOtpStore.forEach((data, userId) => {
        if (now > data.expiresAt) {
            activeOtpStore.delete(userId);
        }
    });
}, 5 * 60 * 1000);

// Generate and email a 6-digit OTP code
const sendDeleteOtp = async (user) => {
    const targetEmail = user?.email || process.env.SECURITY_EMAIL || 'brahimjaballi0@gmail.com';

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    if (user && user._id) {
        activeOtpStore.set(user._id.toString(), { code, expiresAt });
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #d9534f; text-align: center;">🚨 Code de Confirmation de Suppression</h2>
            <p>Bonjour <strong>${user?.name || targetEmail}</strong>,</p>
            <p>Une demande de suppression de données a été initiée sur votre compte <strong>SOSAB Tracker</strong>.</p>
            <p>Voici votre code de sécurité à 6 chiffres (valable 5 minutes) :</p>
            <div style="text-align: center; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #ffffff; padding: 12px 24px; border: 2px dashed #d9534f; border-radius: 8px; color: #333333;">${code}</span>
            </div>
            <p style="color: #666666; font-size: 12px;">Si vous n'êtes pas à l'origine de cette suppression, changez votre mot de passe immédiatement et contactez l'administrateur.</p>
        </div>
    `;

    try {
        await sendEmail({
            email: targetEmail,
            subject: '🚨 Code de vérification suppression SOSAB',
            message: `Votre code de vérification pour la suppression est: ${code}`,
            html: htmlContent
        });
        console.log(`[DeleteOTP] Sent verification code to ${user.email}`);
        return { success: true, email: user.email };
    } catch (err) {
        console.error(`[DeleteOTP] Failed to send OTP email to ${user.email}:`, err.message);
        // Return code in log fallback if SMTP is not configured in dev
        return { success: true, email: user.email, fallbackCode: code };
    }
};

// Validate provided OTP code
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
        // Consume OTP code on successful verification
        activeOtpStore.delete(key);
        return true;
    }

    return false;
};

module.exports = {
    sendDeleteOtp,
    verifyDeleteOtp
};
