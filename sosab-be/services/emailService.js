const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Send email with PDF attachment
exports.sendReportEmail = async (to, subject, reportPath, reportName) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.SMTP_FROM || '"SOSAB System" <noreply@sosab.com>',
            to,
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">SOSAB - Rapport Prêt</h2>
          <p>Bonjour,</p>
          <p>Votre rapport <strong>${reportName}</strong> est prêt et disponible en pièce jointe.</p>
          <p>Vous pouvez également le télécharger depuis le système SOSAB.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Ceci est un email automatique, merci de ne pas répondre.
          </p>
        </div>
      `,
            attachments: reportPath ? [
                {
                    filename: `${reportName}.pdf`,
                    path: reportPath,
                },
            ] : [],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email send error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Send notification email (no attachment)
exports.sendNotificationEmail = async (to, subject, message) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.SMTP_FROM || '"SOSAB System" <noreply@sosab.com>',
            to,
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ${message}
          </div>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Ceci est un email automatique du système SOSAB.
          </p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email notification error:', error);
        throw new Error(`Failed to send notification: ${error.message}`);
    }
};

// Send weekly summary email
exports.sendWeeklySummary = async (to, projectName, week, summaryData) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.SMTP_FROM || '"SOSAB System" <noreply@sosab.com>',
            to,
            subject: `Résumé Hebdomadaire - ${projectName} - Semaine ${week}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Résumé Hebdomadaire</h2>
          <h3>${projectName} - Semaine ${week}</h3>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>Statistiques:</h4>
            <ul>
              <li>Ouvriers présents: ${summaryData.workersPresent || 0}</li>
              <li>Jours travaillés: ${summaryData.daysWorked || 0}</li>
              <li>Progression: ${summaryData.progress || 0}%</li>
              <li>Matériaux utilisés: ${summaryData.materialsUsed || 0} articles</li>
            </ul>
          </div>
          
          <p>Consultez le système pour plus de détails.</p>
          
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Ceci est un email automatique hebdomadaire.
          </p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Weekly summary email error:', error);
        throw new Error(`Failed to send weekly summary: ${error.message}`);
    }
};

module.exports = exports;
