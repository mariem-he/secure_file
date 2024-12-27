// emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        // Verify required environment variables are present
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Missing required email configuration in environment variables');
        }

        this.transporter = nodemailer.createTransport({
            service: 'gmail',  // Simplified Gmail configuration
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS  // This should be an App Password for Gmail
            }
        });

        // Verify transporter configuration
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('SMTP connection error:', error);
            } else {
                console.log('Server is ready to send emails');
            }
        });
    }

    async sendVerificationEmail(email, verificationToken) {
        if (!email || !verificationToken) {
            throw new Error('Email and verification token are required');
        }

        const verificationLink = `https://yourwebsite.com/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: `"Secure File Encryption" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email for Secure File Encryption',
            html: `
                <h1>Email Verification</h1>
                <p>Thank you for registering with Secure File Encryption!</p>
                <p>Please click the link below to verify your email:</p>
                <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>If you didn't create an account, please ignore this email.</p>
                <p>This link will expire in 24 hours.</p>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Verification email sent:', info.messageId);
            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Failed to send verification email:', error);
            throw new Error(`Failed to send verification email: ${error.message}`);
        }
    }
}

// Export as both CommonJS and ES Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = new EmailService();
} else {
    export default new EmailService();
}