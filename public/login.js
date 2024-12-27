// login.js
import PasswordManager from 'passwordUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validate inputs
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        try {
            // Fetch user data from server
            const response = await fetch(`/api/user/${email}`);
            
            if (!response.ok) {
                alert('User not found');
                return;
            }

            const userData = await response.json();

            // Check if email is verified
            if (!userData.isVerified) {
                alert('Please verify your email before logging in');
                return;
            }

            // Verify password
            const isPasswordValid = PasswordManager.verifyPassword(
                userData.passwordHash, 
                userData.passwordSalt, 
                password
            );

            if (isPasswordValid) {
                // Redirect to dashboard or home page
                window.location.href = '/dashboard-html.html';
            } else {
                alert('Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        }
    });
});