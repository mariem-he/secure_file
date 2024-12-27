const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const EncryptionService = require('../services/encryption-service');
const User = require('../models/user-model');
const authMiddleware = require('../middleware/auth-middleware');

// Multer configuration for file upload
const upload = multer({
    dest: 'uploads/',
    limits: { 
        fileSize: 50 * 1024 * 1024 // 50MB file size limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// File Encryption Route
router.post('/encrypt', 
    authMiddleware, 
    upload.array('files'), 
    async (req, res) => {
        try {
            // Get user's encryption key
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Encrypt each uploaded file
            const encryptedFiles = await Promise.all(
                req.files.map(file => 
                    EncryptionService.encryptFile(file, user.encryptionKey)
                )
            );

            res.json({ 
                message: 'Files encrypted successfully',
                encryptedFiles 
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error encrypting files', 
                error: error.message 
            });
        }
    }
);

// File Decryption Route
router.post('/decrypt', 
    authMiddleware, 
    upload.array('files'), 
    async (req, res) => {
        try {
            // Get user's encryption key
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Decrypt each uploaded file
            const decryptedFiles = await Promise.all(
                req.files.map(file => 
                    EncryptionService.decryptFile(file.path, user.encryptionKey)
                )
            );

            res.json({ 
                message: 'Files decrypted successfully',
                decryptedFiles 
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error decrypting files', 
                error: error.message 
            });
        }
    }
);
// Download Route
router.get('/download', authMiddleware, async (req, res) => {
    try {
        const filePath = req.query.path;
        
        if (!filePath) {
            return res.status(400).json({ message: 'No file path provided' });
        }

        res.download(filePath);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error downloading file', 
            error: error.message 
        });
    }
});

module.exports = router;
