document.addEventListener('DOMContentLoaded', function() {
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
    const imageUpload = document.getElementById('imageUpload');
    const previewImage = document.getElementById('previewImage');
    const linkInput = document.getElementById('link');

    // Handle clipboard paste events (for screenshots)
    document.addEventListener('paste', function(event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    // Create a blob URL for the pasted image
                    const imageUrl = URL.createObjectURL(file);
                    
                    // Update the preview image
                    previewImage.src = imageUrl;
                    previewImage.style.display = 'block';
                    
                    // Handle the image file
                    handleImageUpload(file);
                    
                    // Prevent default paste behavior 
                    event.preventDefault();
                    break;
                }
            }
        }
    });

    // Handle image upload via file input
    imageUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            // Create a blob URL for the selected file
            const imageUrl = URL.createObjectURL(file);
            
            // Update the preview image
            previewImage.src = imageUrl;
            previewImage.style.display = 'block';
            
            // Handle the image file
            handleImageUpload(file);
        }
    });

    // Function to handle the image (works for both uploaded and pasted images)
    function handleImageUpload(file) {
        // Clear the link input visually, but we'll still use the base64 for the actual link value
        linkInput.value = 'Image will be uploaded (preview shown above)';
        linkInput.disabled = true; // Optional: disable the link input when an image is selected
    
        const reader = new FileReader();
        reader.onload = function(e) {
            // Store the base64 data to send to API later
            window.uploadedImageBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Handle link input for image preview
    linkInput.addEventListener('input', function() {
        const input = this.value;
        
        if (input.match(/\.(jpeg|jpg|png|gif)$/i)) {
            previewImage.src = input; 
            previewImage.style.display = 'block';
            
            // Clear any file upload when URL is entered
            imageUpload.value = '';
            window.uploadedImageBase64 = null;
            linkInput.disabled = false;
        } else {
            // If input doesn't look like an image URL, hide the preview
            if (!window.uploadedImageBase64) {
                previewImage.style.display = 'none';
            }
        }
    });

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

        // Check if either link or image is provided
        if (!link && !window.uploadedImageBase64) {
            return showMessage('❌ Link atau gambar wajib diisi!', 'error');
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
                link: window.uploadedImageBase64 || document.getElementById('link').value.trim()
            };

            showMessage('⏳ Sedang mengirim data...', 'loading');

            const response = await fetch('http://192.168.0.27:5000/api/input-order', {
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
            resetForm();

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

    function resetForm() {
        orderForm.reset();
        previewImage.style.display = 'none';
        window.uploadedImageBase64 = null;
        linkInput.disabled = false;
    }

    function showMessage(message, type) {
        responseMessage.innerHTML = `<span style="color:${type === 'success' ? 'green' : type === 'loading' ? 'blue' : 'red'}">${message}</span>`;
        responseMessage.style.display = 'block';
        responseMessage.scrollIntoView({ behavior: 'smooth' });
    }
});