// Tunggu hingga DOM dimuat
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const responseMessage = document.getElementById('responseMessage');

    orderForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Ambil nilai input
        const id_pesanan = document.getElementById('id_pesanan').value.trim();
        const deadline = document.getElementById('deadline').value;
        const qty = document.getElementById('qty').value.trim();
        const nama_ket = document.getElementById('nama_ket').value.trim();
        const link = document.getElementById('link').value.trim();

        // Ambil admin yang dipilih
        const id_admin = document.querySelector('input[name="admin"]:checked')?.value;
        const Platform = document.querySelector('input[name="platform"]:checked')?.value;

        // Validasi input wajib
        if (!id_pesanan) return showMessage('❌ ID Pesanan wajib diisi!', 'error');
        if (!id_admin) return showMessage('❌ Silakan pilih Admin!', 'error');
        if (!deadline) return showMessage('❌ Deadline wajib diisi!', 'error');
        if (!Platform) return showMessage('❌ Silakan pilih Platform!', 'error');

        // Validasi qty (angka positif)
        const parsedQty = qty ? parseInt(qty, 10) : 0;
        if (isNaN(parsedQty) || parsedQty < 1) {
            return showMessage('❌ Jumlah harus angka positif!', 'error');
        }

        // Validasi format link (opsional)
        if (link && !/^https?:\/\/\S+/.test(link)) {
            return showMessage('❌ Format link tidak valid!', 'error');
        }

        // Susun data JSON
        const orderData = {
            id_pesanan,
            id_admin,
            Deadline: deadline,
            Platform,
            qty: parsedQty,
            nama_ket,
            link
        };

        // Kirim data ke API
        await submitOrder(orderData);
    });

    async function submitOrder(orderData) {
        try {
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

            // Cek jika response tidak sukses
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }

            // Ambil data response
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
        }
    }

    function showMessage(message, type) {
        responseMessage.innerHTML = `<span style="color:${type === 'success' ? 'green' : 'red'}">${message}</span>`;
        responseMessage.style.display = 'block';
        responseMessage.scrollIntoView({ behavior: 'smooth' });
    }
});
