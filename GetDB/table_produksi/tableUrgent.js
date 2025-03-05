document.addEventListener("DOMContentLoaded", function () {
    let selectedOrderId = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let allOrders = [];
    let filteredOrders = []; // Data hasil filter
    
    // Define reference data objects
    let adminList = {};
    let desainerList = {};
    let kurirList = {};
    let penjahitList = {};
    let qcList = {};

    // Create loading overlay function
    function showLoadingOverlay() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
        
        loadingOverlay.appendChild(spinner);
        document.body.appendChild(loadingOverlay);
    }

    function hideLoadingOverlay() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    // Initialize the page
    initApp();

    async function initApp() {
        try {
            // Show loading overlay
            showLoadingOverlay();

            // First load reference data
            await fetchReferenceData();
            // Then fetch orders
            await fetchOrders();
            // Add event listeners for filter and search
            setupFilterAndSearch();
            // Setup PDF and Excel buttons
            setupDownloadButtons();

            setupAutoRefresh();
            // setupSSE();
        } catch (error) {
            console.error("Error initializing app:", error);
            showResultPopup("Gagal memuat aplikasi. Silakan refresh halaman.", true);
        } finally {
            // Hide loading overlay once everything is loaded
            hideLoadingOverlay();
        }
    }

    function setupAutoRefresh() {
        const refreshInterval = 10000; // 10 detik
    
        async function autoRefresh() {
            try {
                console.log("Auto refresh triggered");
                await fetchOrders();
            } catch (error) {
                console.error("Auto refresh failed:", error);
                showResultPopup("Gagal melakukan refresh otomatis.", true);
            } finally {
                setTimeout(autoRefresh, refreshInterval); // Memanggil dirinya sendiri
            }
        }
    
        console.log("Auto refresh enabled");
        autoRefresh(); // Mulai auto-refresh pertama kali
    }

    // s
    

// Function to simulate potential longer loading time
    function simulateSlowLoading() {
        return new Promise(resolve => {
            setTimeout(resolve, Math.random() * 1500 + 500); // Random delay between 500-2000ms
        });
    }

    // Fungsi untuk memindahkan data ke table_urgent jika deadline hari ini
async function moveToUrgentTable() {
    try {
        const response = await fetch("http://192.168.0.27:5000/api/move_to_table_urgent", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Move to urgent table result:", result);

        // Setelah data dipindahkan, refresh tampilan tabel
        await fetchOrders();  
    } catch (error) {
        console.error("Error moving orders to urgent table:", error);
        showResultPopup("Gagal memindahkan pesanan ke tabel urgent.", true);
    }
}


    // Setup auto refresh function
    function setupAutoRefresh() {
        // Refresh data every 30 seconds (30000 milliseconds)
        const refreshInterval = 10000;
        setInterval(async () => {
            await moveToUrgentTable(); // Move new urgent orders
            await fetchOrders(); // Refresh orders
            await updateStatusUrgent(); // Update statuses
        }, refreshInterval);
        console.log("Auto refresh enabled - data will update every 30 seconds");
    }

    // New function to update urgent table statuses
    async function updateStatusUrgent() {
        try {
            // Bulk update status for all orders
            const orderIds = allOrders.map(order => order.id_input);
            
            const response = await fetch("http://192.168.0.27:5000/api/update_status_urgent", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_ids: orderIds })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Bulk status update result:", result);
        } catch (error) {
            console.error("Error updating urgent table statuses:", error);
        }
    }

    async function fetchOrders() {
        try {
            const response = await fetch("http://192.168.0.27:5000/api/get_table_urgent");
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log("Data orders:", data); // Debugging
    
            if (data.status === "success" && Array.isArray(data.data)) {
                allOrders = data.data;
                renderOrdersTable(paginateOrders(allOrders));
                updatePagination();
                await updateStatusUrgent(); // Panggil setelah tabel selesai diperbarui
            } else {
                console.error("Gagal mengambil data:", data.message || "Format response salah");
                showResultPopup("Gagal mengambil data pesanan.", true);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            showResultPopup("Terjadi kesalahan saat mengambil data.", true);
        }
    }

    function paginateOrders(orders) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return orders.slice(startIndex, endIndex);
    }

    function updatePagination() {
        const totalPages = Math.ceil(allOrders.length / itemsPerPage);
        const pageInfo = document.getElementById("pageInfo");
        const prevButton = document.getElementById("prevPage");
        const nextButton = document.getElementById("nextPage");
        
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1}`;
        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
    }

    function setupFilterAndSearch() {
        // Search functionality
        const searchInput = document.getElementById("searchInput");
        const searchButton = document.getElementById("searchButton");
        
        searchButton.addEventListener("click", function() {
            searchOrders(searchInput.value);
        });
        
        searchInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                searchOrders(this.value);
            }
        });
        
        // Filter by status
        const filterStatus = document.getElementById("filterStatus");
        filterStatus.addEventListener("change", function() {
            filterOrdersByStatus(this.value);
        });
        
        // Refresh button
        const refreshButton = document.getElementById("refreshButton");
        refreshButton.addEventListener("click", fetchOrders);
        
        // Pagination controls
        document.getElementById("prevPage").addEventListener("click", function() {
            if (currentPage > 1) {
                currentPage--;
                renderOrdersTable(paginateOrders(allOrders));
                updatePagination();
            }
        });
        
        document.getElementById("nextPage").addEventListener("click", function() {
            const totalPages = Math.ceil(allOrders.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderOrdersTable(paginateOrders(allOrders));
                updatePagination();
            }
        });
    }

    function searchOrders(searchTerm) {
        if (!searchTerm.trim()) {
            renderOrdersTable(paginateOrders(allOrders));
            updatePagination();
            return;
        }
        
        const searchTermLower = searchTerm.toLowerCase();
        const filteredOrders = allOrders.filter(order => 
            order.id_input && order.id_input.toLowerCase().includes(searchTermLower)
        );
        
        currentPage = 1;
        renderOrdersTable(paginateOrders(filteredOrders));
        updatePagination();
        
        showResultPopup(`Ditemukan ${filteredOrders.length} hasil pencarian.`);
    }

    function filterOrdersByStatus(status) {
        if (!status) {
            renderOrdersTable(paginateOrders(allOrders));
            updatePagination();
            return;
        }
        
        const filteredOrders = allOrders.filter(order => 
            order.print_status === status
        );
        
        currentPage = 1;
        renderOrdersTable(paginateOrders(filteredOrders));
        updatePagination();
        
        showResultPopup(`Ditemukan ${filteredOrders.length} pesanan dengan status: ${status}`);
    }

    function formatTanggal(dateString) {
        if (!dateString) return "-";
        
        const dateObj = new Date(dateString);
        if (isNaN(dateObj)) return dateString;
    
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
    
        return `${day}-${month}-${year}`;
    }
    
    function renderOrdersTable(orders) {
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = "";
    
        // Sorting berdasarkan deadline terdekat
        orders.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
        orders.forEach(order => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${order.id_input || "-"}</td>
                <td style="color: ${getPlatformColor(order.platform).color}; background-color: ${getPlatformColor(order.platform).backgroundColor}; padding: 5px; border-radius: 5px;">
                    ${order.platform || "-"}
                </td>
                <td>${order.qty || "-"}</td>
                <td>${formatTanggal(order.deadline)}</td>
                <td>${order.status_print || "-"}</td>
                <td>${order.status_produksi || "-"}</td>
                <td>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="desc-table" data-id="${order.id_input}"><i class="fas fa-info-circle"></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    
        addUpdateEventListeners();
        addInputChangeEventListeners();
        addDescriptionEventListeners();
    }

    function getPlatformColor(platform) {
        const colors = {
            "Shopee": { color: "#FFFFFF", backgroundColor: "#EE4D2D" },   // Oranye Shopee
            "TikTok": { color: "#FFFFFF", backgroundColor: "#000000" },   // Hitam TikTok
            "Tokopedia": { color: "#FFFFFF", backgroundColor: "#00AA5B" }, // Hijau Tokopedia
            "Lazada": { color: "#FFFFFF", backgroundColor: "#1A4DBE" },   // Biru Lazada
            "WhatsApp": { color: "#FFFFFF", backgroundColor: "#25D366" }  // Hijau WhatsApp
        };
    
        return colors[platform] || { color: "#FFFFFF", backgroundColor: "#333" }; // Default warna abu-abu gelap
    }


    function addInputChangeEventListeners() {
        // Event listener untuk dropdown status produksi
        document.querySelectorAll(".status-produksi").forEach(select => {
            select.addEventListener("change", function () {
                const id_input = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
    
                updateOrderWithConfirmation(id_input, column, value);
            });
    
            updateSelectColor(select);
        });
    
        // Fungsi untuk mengubah warna berdasarkan status produksi
        function updateSelectColor(select) {
            let selectedValue = select.value.replace(/ /g, "-"); // Ganti spasi dengan "-"
            select.className = `status-produksi option-${selectedValue}`;
        }
    }
    
    async function fetchReferenceData() {
        await simulateSlowLoading(); // Simulate potential slow network

        try {
            const response = await fetch("http://192.168.0.27:5000/api/references");
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
    
            if (data.table_admin) {
                data.table_admin.forEach(a => adminList[a.ID] = a.nama);
            }
            if (data.table_desainer) {
                data.table_desainer.forEach(d => desainerList[d.ID] = d.nama);
            }
            if (data.table_kurir) {
                data.table_kurir.forEach(k => kurirList[k.ID] = k.nama);
            }
            if (data.table_penjahit) {
                data.table_penjahit.forEach(p => penjahitList[p.ID] = p.nama);
            }
            if (data.table_qc) {
                data.table_qc.forEach(q => qcList[q.ID] = q.nama);
            }
    
            console.log("Reference data loaded successfully");
    
        } catch (error) {
            console.error("Gagal mengambil data referensi:", error);
            showResultPopup("Gagal memuat data referensi. Beberapa fitur mungkin tidak berfungsi dengan baik.", true);
        }
    }

    function addDescriptionEventListeners() {
        document.querySelectorAll(".desc-table").forEach(item => {
            item.addEventListener("click", function () {
                const orderId = this.getAttribute("data-id");
                fetchOrderDescription(orderId);
            });
        });
    }
    
    function fetchOrderDescription(orderId) {
        const order = allOrders.find(order => order.id_input == orderId);
        if (order) {
            showDescriptionModal(order);
        } else {
            showResultPopup("Deskripsi pesanan tidak ditemukan.", true);
        }
    }

    async function fetchLinkFoto(id_input) {
        if (!id_input || id_input === "-") {
            console.warn("ID tidak valid:", id_input);
            return "-";
        }
    
        try {
            const response = await fetch(`http://192.168.0.27:5000/api/get_link_foto/${id_input}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
    
            if (!data || !data.data || typeof data.data.link !== "string") {
                console.warn("Format response tidak valid atau link kosong:", data);
                return "-";
            }
            
            return data.data.link;
    
        } catch (error) {
            console.error("Error fetching link foto:", error);
            return "-";
        }
    }

    async function showDescriptionModal(order) {
        if (!order.id_input) {
            console.error("ID Input tidak valid:", order);
            return;
        }
    
        const modalBody = document.getElementById("orderDetails");
        modalBody.innerHTML = '<tr><td colspan="2" class="text-center"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        const nama_ket = await fetchNamaKet(order.id_input)
        
        try {
            const linkFoto = await fetchLinkFoto(order.id_input);
    
            modalBody.innerHTML = `
                <tr><th>ID Input</th><td>${order.id_input || "-"}</td></tr>
                <tr><th>Platform</th><td>${order.platform || "-"}</td></tr>
                <tr><th>Deadline</th><td>${formatTanggal(order.deadline) || "-"}</td></tr>
                <tr><th>Status Print</th><td>${order.status_print || "-"}</td></tr>
                <tr><th>Status Produksi</th><td>${order.status_produksi || "-"}</td></tr>
                <tr><th>Layout Link</th><td>
                    ${order.layout_link ? `<a href="${order.layout_link}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-link"></i> Buka Link</a>` : "-"}
                </td></tr>
                <tr><th>Link Foto</th><td>
                ${linkFoto && linkFoto !== "-" ? `<a href="${linkFoto}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-image"></i> Lihat Foto</a>` : "Tidak Tersedia"}
                </td></tr>
                <tr><th>Quantity</th><td>${order.qty || "-"}</td></tr>
                <tr>
                    <th>Detail Pesanan</th>
                    <td style="white-space: pre-line;">${nama_ket || "-"}</td>
                </tr>
            `;
    
            window.currentOrder = order;
            const orderModal = document.getElementById("orderModal");
            const modal = new bootstrap.Modal(orderModal);
            modal.show();
            
        } catch (error) {
            console.error("Error showing modal:", error);
            modalBody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">Gagal memuat data pesanan: ${error.message}</td></tr>`;
        }
    }

    async function fetchNamaKet(idInput) {
        const baseUrl = "http://192.168.0.27:5000"; // Sesuaikan dengan URL API kamu
        const url = `${baseUrl}/api/get_nama_ket/${idInput}`;
    
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            
            // Pastikan mengembalikan hanya `nama_ket` agar tidak error
            return data.nama_ket || "Tidak ada keterangan"; 
    
        } catch (error) {
            console.error("Gagal mengambil keterangan pesanan:", error);
            return "Error mengambil data"; 
        }
    }
    
    function showResultPopup(message, isError = false) {
        const popup = document.getElementById("resultPopup");
        const resultMessage = document.getElementById("resultMessage");
        
        resultMessage.innerText = message;
        if (isError) {
            popup.style.backgroundColor = "#ff3f5b";
        } else {
            popup.style.backgroundColor = "#1a73e8";
        }
        
        popup.classList.add("show");
    
        setTimeout(() => {
            popup.classList.remove("show");
        }, 3000);
    }
    
    function updateOrderWithConfirmation(id_input, column, value) {
        const confirmPopup = document.getElementById("confirmUpdatePopup");
        const confirmMessage = document.getElementById("confirmUpdateMessage");
        
        // Get the display name for the column based on selected value
        let displayValue = value;
        if (column === "penjahit" && penjahitList[value]) {
            displayValue = penjahitList[value];
        } else if (column === "qc" && qcList[value]) {
            displayValue = qcList[value];
        }

        
        // Column display name
        let columnDisplay = column;
        switch(column) {
            case "penjahit": columnDisplay = "Penjahit"; break;
            case "qc": columnDisplay = "QC"; break;
            case "status_produksi": columnDisplay = "Status Produksi"; break;
        }
        
        confirmMessage.innerText = `Yakin ingin update ${columnDisplay} menjadi "${displayValue}" untuk ID Pesanan ${id_input}?`;
        confirmPopup.classList.add("active");
        
        // Store the update details for use in event handlers
        confirmPopup.dataset.id = id_input;
        confirmPopup.dataset.column = column;
        confirmPopup.dataset.value = value;
    }
    
    function addUpdateEventListeners() {
        // For all dropdowns with data-column attribute
        document.querySelectorAll("select[data-column]").forEach(select => {
            select.addEventListener("change", function () {
                const id_input = this.dataset.id;
                const column = this.dataset.column;
                let value = this.value;
        
                // Update with confirmation dialog
                updateOrderWithConfirmation(id_input, column, value);
            });
        });
        
        // Confirm update button
        document.getElementById("confirmUpdateBtn").addEventListener("click", function() {
            const popup = document.getElementById("confirmUpdatePopup");
            const id_input = popup.dataset.id;
            const column = popup.dataset.column;
            const value = popup.dataset.value;
            
            updateOrder(id_input, column, value);
            popup.classList.remove("active");
        });
        
        // Cancel update button
        document.getElementById("cancelUpdateBtn").addEventListener("click", function() {
            const popup = document.getElementById("confirmUpdatePopup");
            popup.classList.remove("active");
            
            // Reset the dropdown/input to its original value
            const selector = `[data-id="${popup.dataset.id}"][data-column="${popup.dataset.column}"]`;
            const element = document.querySelector(selector);
            
            if (element) {
                const originalOrder = allOrders.find(order => order.id_input == popup.dataset.id);
                if (originalOrder && element.tagName === "SELECT") {
                    element.value = originalOrder[popup.dataset.column] || "";
                } else if (originalOrder && element.tagName === "INPUT") {
                    element.value = originalOrder[popup.dataset.column] || "";
                }
            }
        });
    }
    
    function updateOrder(id_input, column, value) {
        const endpoint = "http://192.168.0.27:5000/api/sync-prod-to-pesanan";
        
        if (!id_input || !column) {
            console.error("❌ Gagal mengirim update: id_input atau column tidak valid");
            showResultPopup("ID Input atau Column tidak valid!", true);
            return;
        }
    
        const confirmUpdateBtn = document.getElementById("confirmUpdateBtn");
        confirmUpdateBtn.disabled = true;
        confirmUpdateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
        // Map frontend column names to API parameter names
        const columnMapping = {
            "penjahit": "id_penjahit",
            "qc": "id_qc",
            "status_produksi": "status_produksi"
        };
        
        // Get the correct parameter name for the API
        const apiParam = columnMapping[column];
        
        if (!apiParam) {
            console.error("❌ Kolom tidak valid untuk update:", column);
            showResultPopup(`Kolom tidak valid: ${column}`, true);
            confirmUpdateBtn.disabled = false;
            confirmUpdateBtn.innerHTML = 'Ya, Update';
            return;
        }
    
        // Create request body according to API format
        const requestBody = { "id_input": id_input };
        requestBody[apiParam] = value;
    
        console.log("📤 JSON yang dikirim:", JSON.stringify(requestBody));
    
        fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        })
        .then(response => {
            console.log("📥 Response status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("📥 Response JSON:", data);
            if (data.status === "success") {
                showResultPopup(`✅ Update berhasil: ${column} -> ${value}`);
    
                // Auto refresh data after successful update
                fetchOrders();
            } else {
                showResultPopup(`⚠️ Update gagal: ${data.message}`, true);
            }
        })
        .catch(error => {
            console.error("❌ Error:", error);
            showResultPopup(`Terjadi kesalahan saat update: ${error.message}`, true);
        })
        .finally(() => {
            confirmUpdateBtn.disabled = false;
            confirmUpdateBtn.innerHTML = 'Ya, Update';
        });
    }

    // Setup download buttons if they exist
    function setupDownloadButtons() {
        const pdfButton = document.getElementById("downloadPDF");
        const excelButton = document.getElementById("downloadExcel");
        
        if (pdfButton) {
            pdfButton.addEventListener("click", function() {
                // Implement PDF download functionality
                showResultPopup("Downloading PDF...");
            });
        }
        
        if (excelButton) {
            excelButton.addEventListener("click", function() {
                // Implement Excel download functionality
                showResultPopup("Downloading Excel...");
            });
        }
    }
});