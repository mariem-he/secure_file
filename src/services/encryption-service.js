const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class EncryptionService {
    // Encrypt a file
    static async encryptFile(file, userEncryptionKey) {
        try {
            // Read file
            const fileBuffer = await fs.readFile(file.path);

            // Generate initialization vector
            const iv = crypto.randomBytes(16);

            // Create cipher
            const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(userEncryptionKey, 'hex'), iv);

            // Encrypt the file
            const encryptedBuffer = Buffer.concat([
                cipher.update(fileBuffer),
                cipher.final()
            ]);

            // Get authentication tag
            const authTag = cipher.getAuthTag();

            // Construct encrypted file metadata
            const encryptedFileData = {
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                encryptedFile: encryptedBuffer.toString('base64')
            };

            // Save encrypted file
            const encryptedFilePath = path.join('uploads', `encrypted_${file.originalname}`);
            await fs.writeFile(encryptedFilePath, JSON.stringify(encryptedFileData));

            return encryptedFilePath;
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('File encryption failed');
        }
    }

    // Decrypt a file
    static async decryptFile(encryptedFilePath, userEncryptionKey) {
        try {
            // Read encrypted file
            const encryptedFileContent = await fs.readFile(encryptedFilePath, 'utf8');
            const encryptedFileData = JSON.parse(encryptedFileContent);

            // Prepare decryption parameters
            const iv = Buffer.from(encryptedFileData.iv, 'hex');
            const authTag = Buffer.from(encryptedFileData.authTag, 'hex');
            const encryptedBuffer = Buffer.from(encryptedFileData.encryptedFile, 'base64');

            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(userEncryptionKey, 'hex'), iv);
            decipher.setAuthTag(authTag);

            // Decrypt the file
            const decryptedBuffer = Buffer.concat([
                decipher.update(encryptedBuffer),
                decipher.final()
            ]);

            // Save decrypted file
            const decryptedFilePath = path.join('uploads', `decrypted_${path.basename(encryptedFilePath)}`);
            await fs.writeFile(decryptedFilePath, decryptedBuffer);

            return decryptedFilePath;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('File decryption failed');
        }
    }
}

module.exports = EncryptionService;
