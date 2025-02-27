// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const orderForm = document.getElementById('orderForm');
    const responseMessage = document.getElementById('responseMessage');
    
    // Add submit event listener to form
    orderForm.addEventListener('submit', function(event) {
        // Prevent default form submission
        event.preventDefault();
        
        // Get form values
        const id_pesanan = document.getElementById('id_pesanan').value.trim();
        const deadline = document.getElementById('deadline').value;
        const qty = document.getElementById('qty').value.trim();
        const nama_ket = document.getElementById('nama_ket').value.trim();
        const link = document.getElementById('link').value.trim();
        
        // Get selected admin radio button
        const adminRadios = document.getElementsByName('admin');
        let ID = '';
        for (let i = 0; i < adminRadios.length; i++) {
            if (adminRadios[i].checked) {
                ID = adminRadios[i].value;
                break;
            }
        }
        
        // Get selected platform radio button
        const platformRadios = document.getElementsByName('platform');
        let Platform = '';
        for (let i = 0; i < platformRadios.length; i++) {
            if (platformRadios[i].checked) {
                Platform = platformRadios[i].value;
                break;
            }
        }
        
        // Validate required fields
        if (!id_pesanan) {
            showMessage('ID Pesanan wajib diisi!', 'error');
            return;
        }
        
        if (!ID) {
            showMessage('Silakan pilih Admin!', 'error');
            return;
        }
        
        if (!deadline) {
            showMessage('Deadline wajib diisi!', 'error');
            return;
        }
        
        // Create order data object
        const orderData = {
            id_pesanan: id_pesanan,
            ID: ID,
            Deadline: deadline,
            Platform: Platform,
            qty: qty ? parseInt(qty) : 0,
            nama_ket: nama_ket,
            link: link
        };
        
        // Submit order data
        submitOrder(orderData);
    });
    
    // Function to submit order data to API
    async function submitOrder(orderData) {
        try {
            // Show loading message
            showMessage('Sedang memproses...', 'loading');
            
            // Send API request with correct CORS settings
            const response = await fetch('http://127.0.0.1:5000/api/input-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors', // Explicitly set CORS mode
                body: JSON.stringify(orderData)
            });
            
            // Check for non-2xx responses and handle accordingly
            if (!response.ok) {
                // Try to get error message from response
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }
            
            // Parse response
            const data = await response.json();
            
            // Show success message
            showMessage(`Data pesanan berhasil disimpan dengan ID: ${data.data.id_input}`, 'success');
            // Reset form
            orderForm.reset();
            
        } catch (error) {
            // Show detailed error message
            console.error('Error details:', error);
            
            // Provide more helpful error message based on error type
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showMessage('Error: Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda atau pastikan server API berjalan di http://127.0.0.1:5000', 'error');
            } else if (error.name === 'SyntaxError') {
                showMessage('Error: Format response tidak valid.', 'error');
            } else if (error.message.includes('blocked by CORS policy')) {
                showMessage('Error: CORS policy. Pastikan server API mengizinkan permintaan dari origin ini.', 'error');
            } else {
                showMessage(`Error: ${error.message || 'Terjadi kesalahan, coba lagi nanti.'}`, 'error');
            }
        }
    }
    
    // Function to display messages
    function showMessage(message, type) {
        if (type === 'success') {
            responseMessage.innerHTML = `<span style="color:green">${message}</span>`;
        } else if (type === 'error') {
            responseMessage.innerHTML = `<span style="color:red">${message}</span>`;
        } else if (type === 'loading') {
            responseMessage.innerHTML = `<span>${message}</span>`;
        }
        
        // Make sure message is visible
        responseMessage.style.display = 'block';
        // Scroll to message
        responseMessage.scrollIntoView({ behavior: 'smooth' });
    }
});