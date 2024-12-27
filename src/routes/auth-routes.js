const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('../models/user-model');

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Registration Route
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;

        // Validate input
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate encryption key
        const encryptionKey = crypto.randomBytes(32).toString('hex');

        // Create verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password,
            verificationToken,
            verificationTokenExpires: Date.now() + 3600000, // 1 hour
            encryptionKey
        });

        await newUser.save();

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Account',
            html: `
                <h1>Account Verification</h1>
                <p>Click the link below to verify your account:</p>
                <a href="${verificationUrl}">Verify Account</a>
            `
        });

        res.status(201).json({ 
            message: 'User registered successfully. Check your email for verification.',
            userId: newUser._id 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email first' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: `${user.firstName} ${user.lastName}`,
                email: user.email 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// Email Verification Route
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with token and not expired
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;

        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during verification', error: error.message });
    }
});
router.get('/user/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
