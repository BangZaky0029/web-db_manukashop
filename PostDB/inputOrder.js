document.addEventListener('DOMContentLoaded', function() {
    // Debugging: Cek apakah elemen form sudah ada di DOM
    console.log(document.getElementById('id_pesanan'));  
    console.log(document.getElementById('deadline'));
    console.log(document.querySelector('input[name="platform"]:checked')); 

    // Mapping nama admin
    const adminNames = {
        '1001': 'Lilis',
        '1002': 'Ina'
    };

    // Ambil admin yang sedang login dari localStorage
    const currentAdminId = localStorage.getItem('currentAdminId');
    if (!currentAdminId) {
        window.location.href = 'login.html'; // Redirect kalau belum login
        return;
    }

    // Tampilkan nama admin yang login
    const adminNameElement = document.getElementById('adminName');
    const logoutBtn = document.getElementById('logoutBtn');
    adminNameElement.textContent = `Logged in as: ${adminNames[currentAdminId]}`;

    // Logout
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentAdminId');
        window.location.href = 'login.html';
    });

    const orderForm = document.getElementById('orderForm');
    const responseMessage = document.getElementById('responseMessage');
    const submitBtn = document.getElementById('submitBtn');

    // **🛠 Form Validation**
    function validateForm() {
        const idPesanan = document.getElementById("id_pesanan").value.trim();
        const deadline = document.getElementById("deadline").value;
        const qty = document.getElementById("qty").value.trim();
        const namaKet = document.getElementById("nama_ket").value.trim();
        const link = document.getElementById("link").value.trim();
        const platformChecked = document.querySelector('input[name="platform"]:checked');

        if (!idPesanan) return showMessage('❌ ID Pesanan wajib diisi!', 'error');
        if (!deadline) return showMessage('❌ Deadline wajib diisi!', 'error');
        if (!platformChecked) return showMessage('❌ Silakan pilih Platform!', 'error');

        const parsedQty = qty ? parseInt(qty, 10) : 0;
        if (isNaN(parsedQty) || parsedQty < 1) return showMessage('❌ Jumlah harus angka positif!', 'error');

        if (link && !/^https?:\/\/\S+/.test(link)) {
            return showMessage('❌ Format link tidak valid!', 'error');
        }

        return true;
    }

    orderForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        if (!validateForm()) return;
        submitBtn.disabled = true;
        responseMessage.innerHTML = '';

        try {
            const orderData = {
                id_pesanan: document.getElementById('id_pesanan').value.trim(),
                id_admin: currentAdminId,
                Deadline: document.getElementById('deadline').value,
                Platform: document.querySelector('input[name="platform"]:checked').value,
                qty: parseInt(document.getElementById('qty').value.trim(), 10),
                nama_ket: document.getElementById('nama_ket').value.trim(),
                link: document.getElementById('link').value.trim()
            };

            showMessage('⏳ Sedang mengirim data...', 'loading');

            const response = await fetch('http://127.0.0.1:5000/api/input-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Gagal mengirim data. Status: ${response.status}`);
            }

            const data = await response.json();
            showMessage(`✅ Data berhasil disimpan dengan ID: ${data?.data?.id_input || 'N/A'}`, 'success');
            orderForm.reset();

        } catch (error) {
            console.error('Error details:', error);
            if (error.message.includes('fetch')) {
                showMessage('❌ Tidak dapat terhubung ke server. Periksa koneksi API.', 'error');
            } else if (error.message.includes('blocked by CORS policy')) {
                showMessage('❌ CORS error. Pastikan API mengizinkan origin ini.', 'error');
            } else {
                showMessage(`❌ ${error.message}`, 'error');
            }
        } finally {
            submitBtn.disabled = false;
        }
    });

    function showMessage(message, type) {
        responseMessage.innerHTML = `<span style="color:${type === 'success' ? 'green' : 'red'}">${message}</span>`;
        responseMessage.style.display = 'block';
        responseMessage.scrollIntoView({ behavior: 'smooth' });
    }
});