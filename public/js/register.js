// register.js
import PasswordManager from 'passwutil.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form inputs
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate inputs
        if (!firstName || !lastName || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Check password match
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        // Generate salt and hash password
        const salt = PasswordManager.generateSalt();
        const hashedPassword = PasswordManager.hashPassword(password, salt);

        // Generate verification token
        const verificationToken = PasswordManager.generateVerificationToken();

        try {
            // Prepare user registration data
            const userData = {
                firstName,
                lastName,
                email,
                passwordHash: hashedPassword,
                passwordSalt: salt,
                verificationToken,
                isVerified: false
            };

            // Send registration data to server
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                // Redirect to verification page
                window.location.href = '/verify-email.html';
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration');
        }
    });
});