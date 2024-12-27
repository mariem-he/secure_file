// passwordUtils.js
const crypto = require('crypto');

class PasswordManager {
    // Generate a secure salt
    static generateSalt(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Hash password using PBKDF2 (Password-Based Key Derivation Function 2)
    static hashPassword(password, salt) {
        const iterations = 100000; // Recommended number of iterations
        const keyLength = 64; // 64 bytes = 512 bits
        const digest = 'sha512';

        const derivedKey = crypto.pbkdf2Sync(
            password, 
            salt, 
            iterations, 
            keyLength, 
            digest
        );

        return derivedKey.toString('hex');
    }

    // Verify password
    static verifyPassword(storedPassword, storedSalt, providedPassword) {
        const hashedProvidedPassword = this.hashPassword(providedPassword, storedSalt);
        return hashedProvidedPassword === storedPassword;
    }

    // Generate a secure random token for email verification
    static generateVerificationToken() {
        return crypto.randomBytes(32).toString('hex');
    }
}

module.exports = PasswordManager;