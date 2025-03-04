document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    // Admin credentials (in a real app, this would be securely stored on the server)
    const adminCredentials = {
        '1001': '12341234',   // Lilis's password
        '1002': '123123'      // Ina's password
    };

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const adminId = document.getElementById('admin').value;
        const password = document.getElementById('password').value;

        // Validate credentials
        if (adminCredentials[adminId] === password) {
            // Successful login
            showMessage('✅ Login berhasil! Mengalihkan...', 'success');
            
            // Store admin ID in localStorage for session management
            localStorage.setItem('currentAdminId', adminId);
            
            // Redirect to input order page after a short delay
            setTimeout(() => {
                window.location.href = 'inputOrder.html';
            }, 1500);
        } else {
            // Failed login
            showMessage('❌ Password salah. Silakan coba lagi.', 'error');
            document.getElementById('password').value = ''; // Clear password field
        }
    });

    function showMessage(message, type) {
        loginMessage.innerHTML = `<span class="${type}-message">${message}</span>`;
    }
});