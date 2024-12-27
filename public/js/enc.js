class SecureFileEncryptor {
    // Generate a secure encryption key
    static async generateKey() {
        try {
            // Create an AES-GCM key for symmetric encryption
            return await window.crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Key generation error:', error);
            throw error;
        }
    }

    // Export the key to a format that can be stored/shared
    static async exportKey(key) {
        try {
            const exportedKey = await window.crypto.subtle.exportKey('raw', key);
            return Array.from(new Uint8Array(exportedKey))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            console.error('Key export error:', error);
            throw error;
        }
    }

    // Import a key from its exported format
    static async importKey(exportedKeyHex) {
        try {
            // Convert hex string back to Uint8Array
            const keyBuffer = new Uint8Array(
                exportedKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
            );

            return await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Key import error:', error);
            throw error;
        }
    }

    // Encrypt a file
    static async encryptFile(file) {
        try {
            // Generate a unique initialization vector (IV)
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Generate encryption key
            const key = await this.generateKey();

            // Read file as ArrayBuffer
            const fileArrayBuffer = await this.readFileAsArrayBuffer(file);

            // Encrypt the file
            const encryptedContent = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                fileArrayBuffer
            );

            // Combine IV and encrypted content
            const encryptedFile = new Uint8Array(iv.length + encryptedContent.byteLength);
            encryptedFile.set(iv);
            encryptedFile.set(new Uint8Array(encryptedContent), iv.length);

            // Export the key for storage/sharing
            const exportedKey = await this.exportKey(key);

            // Create a blob from the encrypted data
            const encryptedBlob = new Blob([encryptedFile], { type: 'application/octet-stream' });

            return {
                encryptedBlob,
                key: exportedKey
            };
        } catch (error) {
            console.error('File encryption error:', error);
            throw error;
        }
    }

    // Decrypt a file
    static async decryptFile(file, exportedKey) {
        try {
            // Import the key
            const key = await this.importKey(exportedKey);

            // Read encrypted file
            const encryptedArrayBuffer = await this.readFileAsArrayBuffer(file);

            // Extract IV (first 12 bytes)
            const iv = new Uint8Array(encryptedArrayBuffer.slice(0, 12));
            
            // Extract encrypted content
            const encryptedContent = encryptedArrayBuffer.slice(12);

            // Decrypt the file
            const decryptedContent = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encryptedContent
            );

            // Create a blob from decrypted data
            return new Blob([decryptedContent], { type: 'application/octet-stream' });
        } catch (error) {
            console.error('File decryption error:', error);
            throw error;
        }
    }

    // Utility method to read file as ArrayBuffer
    static readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
}

// Attach to window for global access
window.SecureFileEncryptor = SecureFileEncryptor;

// Event listeners for demonstration (optional)
document.addEventListener('DOMContentLoaded', () => {
    const encryptForm = document.getElementById('encryptForm');
    const decryptForm = document.getElementById('decryptForm');

    if (encryptForm) {
        encryptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('fileToEncrypt');
            const file = fileInput.files[0];
            const decryptionKeySpan = document.getElementById('decryptionKey');
            const downloadEncryptedFile = document.getElementById('downloadEncryptedFile');
            const encryptResult = document.getElementById('encryptResult');

            try {
                // Encrypt the file
                const { encryptedBlob, key } = await SecureFileEncryptor.encryptFile(file);
                
                // Display the decryption key
                decryptionKeySpan.textContent = key;
                
                // Create a download link for the encrypted file
                const encryptedFileUrl = URL.createObjectURL(encryptedBlob);
                downloadEncryptedFile.href = encryptedFileUrl;
                
                // Show the encryption result
                encryptResult.classList.remove('hidden');
            } catch (error) {
                console.error('Encryption error:', error);
                alert('File encryption failed');
            }
        });
    }

    if (decryptForm) {
        decryptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('fileToDecrypt');
            const decryptionKeyInput = document.getElementById('decryptionKeyInput');
            const file = fileInput.files[0];
            const decryptionKey = decryptionKeyInput.value;
            const downloadDecryptedFile = document.getElementById('downloadDecryptedFile');
            const decryptResult = document.getElementById('decryptResult');

            try {
                // Decrypt the file
                const decryptedBlob = await SecureFileEncryptor.decryptFile(file, decryptionKey);
                
                // Create a download link for the decrypted file
                const decryptedFileUrl = URL.createObjectURL(decryptedBlob);
                downloadDecryptedFile.href = decryptedFileUrl;
                
                // Show the decryption result
                decryptResult.classList.remove('hidden');
            } catch (error) {
                console.error('Decryption error:', error);
                alert('File decryption failed');
            }
        });
    }
});