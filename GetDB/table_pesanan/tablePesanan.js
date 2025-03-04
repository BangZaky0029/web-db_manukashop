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

    // Initialize the page
    initApp();

    async function initApp() {
        try {
            // setupEventListeners();
            // First load reference data
            await fetchReferenceData();
            // Then fetch orders
            await fetchOrders();
            // Add event listeners for filter and search
            setupFilterAndSearch();
            // Setup PDF and Excel buttons
            setupDownloadButtons();
        } catch (error) {
            console.error("Error initializing app:", error);
            showResultPopup("Gagal memuat aplikasi. Silakan refresh halaman.", true);
        }
    }

    document.getElementById("inputForm").addEventListener("submit", async function (event) {
        event.preventDefault(); // Hindari reload form
    
        const formData = new FormData(this);
        const response = await fetch("http://127.0.0.1:5000/api/input-order", {
            method: "POST",
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: { "Content-Type": "application/json" },
        });
    
        const result = await response.json();
        if (result.status === "success") {
            fetchOrders();  // Panggil ulang data jika sukses
        }
        
    });
    

    async function fetchOrders() {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/get-orders");
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Data orders:", data); // Cek di console

            if (data.status === "success") {
                allOrders = data.data;
                renderOrdersTable(paginateOrders(allOrders));
                updatePagination();
            } else {
                console.error("Gagal mengambil data:", data.message);
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
    
    // ✅ Function untuk mencari berdasarkan `id_pesanan`
    function searchOrders(searchQuery) {
        if (!searchQuery.trim()) {
            renderOrdersTable(allOrders); // Jika kosong, tampilkan semua data
            return;
        }
    
        const filteredOrders = allOrders.filter(order =>
            order.id_pesanan.toString().includes(searchQuery) // Cari berdasarkan ID pesanan
        );
    
        renderOrdersTable(filteredOrders); // Tampilkan hasil pencarian
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
    
        return `${day}-${month}`;
    }
    
    function getColorByID(id, table) {
        // Mengembalikan warna teks dan background berdasarkan ID dan tabelnya (admin, desainer, kurir, dll)
        let color = "white"; // Warna teks tetap putih

        if (table === 'admin') {
            if (id === 1001) return { color, backgroundColor: "pink" }; // Admin Lilis
            if (id === 1002) return { color, backgroundColor: "olive" }; // Admin Ina
        } else if (table === 'desainer') {
            if (id === 1101) return { color, backgroundColor: "purple" }; // Desainer IMAM
            if (id === 1102) return { color, backgroundColor: "red" }; // Desainer JHODI
        } else if (table === 'kurir') {
            if (id === 1501) return { color, backgroundColor: "orange" }; // Kurir teddy
            if (id === 1502) return { color, backgroundColor: "coral" }; // Kurir Mas Nur
            if (id === 1503) return { color, backgroundColor: "tomato" }; // Kurir Jhodi
        } else if (table === 'penjahit') {
            if (id === 1301) return { color, backgroundColor: "green" }; // Penjahit Mas Ari
            if (id === 1302) return { color, backgroundColor: "indigo" }; // Penjahit Mas Saep
            if (id === 1303) return { color, backgroundColor: "violet" }; // Penjahit Mas Egeng
            if (id === 1304) return { color, backgroundColor: "fireBrick" };
            if (id === 1305) return { color, backgroundColor: "darkOrchid" };
        } else if (table === 'qc') {
            if (id === 1401) return { color, backgroundColor: "yellowgreen" }; // QC tita
            if (id === 1402) return { color, backgroundColor: "olive" }; // QC ina
            if (id === 1403) return { color, backgroundColor: "pink" }; // QC lilis
        }
    
        return { color, backgroundColor: "white" }; // Default color
    }
    
    
    function renderOrdersTable(orders) {
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = "";
    
        orders.forEach(order => {
            const row = document.createElement("tr");
            
            // Dapatkan warna teks dan background berdasarkan ID
            const adminColor = getColorByID(order.id_admin, 'admin');
            const desainerColor = getColorByID(order.id_desainer, 'desainer');
            const penjahitColor = getColorByID(order.id_penjahit, 'penjahit');
            const qcColor = getColorByID(order.id_qc, 'qc');
            
            row.innerHTML = `
                <td>${order.timestamp || "-"}</td>
                <td>${order.id_input || "-"}</td>
                <td>${order.id_pesanan || "-"}</td>
                <td>${order.platform || "-"}</td>
                <td style="color: ${adminColor.color}; background-color: ${adminColor.backgroundColor}; padding: 5px; border-radius: 5px;">${adminList[order.id_admin] || "-"}</td>
                <td>${order.qty || "-"}</td>
                <td>${formatTanggal(order.deadline)}</td>
                <td style="color: ${desainerColor.color}; background-color: ${desainerColor.backgroundColor}; padding: 5px; border-radius: 5px;">${desainerList[order.id_desainer] || "-"}</td>
                <td>${formatTimestamp(order.timestamp_designer) || "-"}</td>
                <td>
                    ${order.layout_link ? `<a href="${order.layout_link}" target="_blank">Lihat Layout</a>` : "-"}
                </td>
                <td style="color: ${penjahitColor.color}; background-color: ${penjahitColor.backgroundColor}; padding: 5px; border-radius: 5px;">${penjahitList[order.id_penjahit] || "-"}</td>
                <td>${formatTimestamp(order.timestamp_penjahit) || "-"}</td>
                <td style="color: ${qcColor.color}; background-color: ${qcColor.backgroundColor}; padding: 5px; border-radius: 5px;">${qcList[order.id_qc] || "-"}</td>
                <td>${formatTimestamp(order.timestamp_qc) || "-"}</td>
                <td><span class="badge_input ${getBadgeClass(order.status_print)}">${order.status_print || "-"}</span></td>
                <td><span class="badge_input ${getBadgeClass(order.status_produksi)}">${order.status_produksi || "-"}</span></td>

                <td>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="delete-icon" data-id="${order.id_input}"><i class="fas fa-trash-alt"></i></button>
                        <button class="desc-table" data-id="${order.id_input}"><i class="fas fa-info-circle"></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    
        addDeleteEventListeners();
        addUpdateEventListeners();
        addInputChangeEventListeners();
        addDescriptionEventListeners();
    }
    

    function formatTimestamp(timestamp) {
        // Jika timestamp kosong, return string kosong
        if (!timestamp) return "";
    
        // Ubah timestamp menjadi objek Date
        let date = new Date(timestamp);
    
        // Format jam dan menit
        let hours = String(date.getHours()).padStart(2, "0");
        let minutes = String(date.getMinutes()).padStart(2, "0");
    
        // Format tanggal dan bulan
        let day = String(date.getDate()).padStart(2, "0");
        let month = String(date.getMonth() + 1).padStart(2, "0"); // Ingat! Bulan di JS dimulai dari 0
    
        return `${hours}:${minutes} / ${day}-${month}`;
    }
    
    // Contoh data dari database
    const timestamps = [
        "2025-03-03T16:28:00Z",
        "2025-01-01T07:00:00Z",
        null, // Field kosong di database
        "2025-03-03T16:23:00Z",
        "2025-03-03T16:24:00Z"
    ];
    
    function addInputChangeEventListeners() {
        document.querySelectorAll(".layout-link-input").forEach(input => {
            input.addEventListener("blur", function() {
                const id_input = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
                
                updateOrderWithConfirmation(id_input, column, value);
            });
        document.querySelectorAll(".print-status-dropdown").forEach(select => {
            updateSelectColor(select);
    
            select.addEventListener("change", function () {
                updateSelectColor(select);
            });
        });
    
        function updateSelectColor(select) {
            let selectedValue = select.value.replace(/ /g, "-"); // Ganti spasi dengan "-"
            select.className = `print-status-dropdown option-${selectedValue}`;
        }
        
        
        });
    }

    async function fetchReferenceData() {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/references");
            
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
            const response = await fetch(`http://127.0.0.1:5000/api/get_link_foto/${id_input}`);
            
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
        
        try {
            const linkFoto = await fetchLinkFoto(order.id_input);
            
            function applyColor(id, table) {
                const style = getColorByID(id, table);
                return `style="
                    color: ${style.color}; 
                    background-color: ${style.backgroundColor}; 
                    padding: 2px 8px; 
                    border-radius: 5px; 
                    font-size: 13px; 
                    font-family: 'Poppins', sans-serif; 
                    font-weight: 500;
                    letter-spacing: -0.3px; 
                    display: inline-flex; 
                    margin: 4px 7px;
                    align-items: center;"`;
            }
            
    
            modalBody.innerHTML = `
                <tr><th>ID Pesanan</th><td>${order.id_pesanan || "-"}</td></tr>
                <tr><th>Admin</th><td ${applyColor(order.id_admin, 'admin')}>${adminList[order.id_admin] || "-"}</td></tr>
                <tr><th>Timestamp</th><td>${order.timestamp || "-"}</td></tr>
                <tr><th>Deadline</th><td>${formatTanggal(order.deadline) || "-"}</td></tr>
                <tr><th>Quantity</th><td>${order.qty || "-"}</td></tr>
                <tr><th>Platform</th><td>${order.platform || "-"}</td></tr>
                <tr><th>Desainer</th><td ${applyColor(order.id_desainer, 'desainer')}>${desainerList[order.id_desainer] || "-"}</td></tr>
                <tr><th>Status Print</th><td><span class="badge ${getBadgeClass(order.status_print)}">${order.status_print || "-"}</span></td></tr>
                <tr><th>Status Produksi</th><td><span class="badge ${getBadgeClass(order.status_produksi)}">${order.status_produksi || "-"}</span></td></tr>
                <tr><th>Layout Link</th><td>
                    ${order.layout_link ? `<a href="${order.layout_link}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-link"></i> Buka Link</a>` : "-"}
                </td></tr>
                <tr><th>Penjahit</th><td ${applyColor(order.id_penjahit, 'penjahit')}>${penjahitList[order.id_penjahit] || "-"}</td></tr>
                <tr><th>QC</th><td ${applyColor(order.id_qc, 'qc')}>${qcList[order.id_qc] || "-"}</td></tr>
                <tr><th>Link Foto</th><td>
                    ${linkFoto && linkFoto !== "-" 
                        ? `<a href="${linkFoto}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-image"></i> Lihat Foto</a>`
                        : "Tidak Tersedia"}
                </td></tr>
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
    
    function getBadgeClass(status) {
        switch(status) {
            case '-': return 'option-default';
            case 'EDITING': return 'option-EDITING';
            case 'PRINT VENDOR': return 'option-PRINT-VENDOR';
            case 'PROSES PRINT': return 'option-PROSES-PRINT';
            case 'SELESAI PRINT': return 'option-SELESAI-PRINT';
            case 'SEDANG DI PRESS': return 'option-SEDANG-DI-PRESS';
            case 'SEDANG DI JAHIT': return 'option-SEDANG-DI-JAHIT';
            case 'TAS SUDAH DI JAHIT': return 'option-TAS-SUDAH-DI-JAHIT';
            case 'REJECT PRINT ULANG': return 'option-REJECT-PRINT-ULANG';
            case 'TAS BLM ADA': return 'option-TAS-BLM-ADA';
            case 'DONE': return 'option-DONE';
            default: return 'option-default';
        }
    }
    
    
    
    
    function addDeleteEventListeners() {
        document.querySelectorAll(".delete-icon").forEach(icon => {
            icon.addEventListener("click", function() {
                selectedOrderId = this.getAttribute("data-id");
                
                const deletePopup = document.getElementById("deletePopup");
                deletePopup.classList.add("active");
            });
        });
        
        // Add event listeners for popup buttons
        document.getElementById("confirmDelete").addEventListener("click", handleConfirmDelete);
        document.getElementById("cancelDelete").addEventListener("click", handleCancelDelete);
    }
    
    function handleConfirmDelete() {
        if (!selectedOrderId) {
            showResultPopup("Error: ID pesanan tidak valid.", true);
            return;
        }
    
        const confirmDeleteBtn = document.getElementById("confirmDelete");
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
    
        // Corrected endpoint to use id_input instead of id_pesanan
        fetch(`http://127.0.0.1:5000/api/delete-order/${encodeURIComponent(selectedOrderId.trim())}`, { 
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                showResultPopup("Pesanan berhasil dihapus!");
                fetchOrders(); // Refresh the order list
            } else {
                showResultPopup(`Gagal menghapus: ${data.message || "Unknown error"}`, true);
            }
        })
        .catch(error => {
            console.error("Error saat menghapus pesanan:", error);
            showResultPopup(`Terjadi kesalahan: ${error.message}`, true);
        })
        .finally(() => {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Ya, Hapus';
            document.getElementById("deletePopup").classList.remove("active");
            selectedOrderId = null;
        });
    }
    
    function handleCancelDelete() {
        document.getElementById("deletePopup").classList.remove("active");
        selectedOrderId = null;
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
        if (column === "desainer" && desainerList[value]) {
            displayValue = desainerList[value];
        } else if (column === "penjahit" && penjahitList[value]) {
            displayValue = penjahitList[value];
        } else if (column === "qc" && qcList[value]) {
            displayValue = qcList[value];
        }
        
        // Column display name
        let columnDisplay = column;
        switch(column) {
            case "desainer": columnDisplay = "Desainer"; break;
            case "penjahit": columnDisplay = "Penjahit"; break;
            case "print_status": columnDisplay = "Status Print"; break;
            case "layout_link": columnDisplay = "Link Layout"; break;
            case "qc": columnDisplay = "QC"; break;
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
                const value = this.value;
    
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
        // Use the correct endpoint based on the Python API
        const endpoint = "http://127.0.0.1:5000/api/update-print-status-layout";
    
        const confirmUpdateBtn = document.getElementById("confirmUpdateBtn");
        confirmUpdateBtn.disabled = true;
        confirmUpdateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
        // Send the PUT request with the correct parameter names
        fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_input, column, value })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                showResultPopup(`Update berhasil: ${column} -> ${value}`);
                // In the updateOrder function, look at this part:
                const orderIndex = allOrders.findIndex(order => order.id_input == id_input);
                if (orderIndex !== -1) {
                    allOrders[orderIndex][column] = value;
                    renderOrdersTable(paginateOrders(allOrders));
                } else {
                    fetchOrders();
                }
            } else {
                showResultPopup(`Update gagal: ${data.message}`, true);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showResultPopup(`Terjadi kesalahan saat update: ${error.message}`, true);
        })
        .finally(() => {
            confirmUpdateBtn.disabled = false;
            confirmUpdateBtn.innerHTML = 'Ya, Update';
        });
    }
    
    function setupDownloadButtons() {
        // PDF Download button
        document.getElementById("downloadPDF").addEventListener("click", function() {
            handleDownloadPDF();
        });
        
        // Excel Download button
        document.getElementById("downloadExcel").addEventListener("click", function() {
            handleDownloadExcel();
        });
    }
    
    function handleDownloadPDF() {
        if (!window.currentOrder) {
            showResultPopup("Tidak ada data pesanan untuk di-download.", true);
            return;
        }
        
        const downloadBtn = document.getElementById("downloadPDF");
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        
        // Check if jsPDF is loaded
        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
            loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
                .then(() => {
                    generatePDF(window.currentOrder);
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = 'Download PDF';
                })
                .catch(error => {
                    console.error("Failed to load jsPDF:", error);
                    showResultPopup("Gagal memuat library PDF.", true);
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = 'Download PDF';
                });
        } else {
            generatePDF(window.currentOrder);
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = 'Download PDF';
        }
    }
    
    function generatePDF(order) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add header
        doc.setFontSize(18);
        doc.setTextColor(26, 115, 232); // #1a73e8
        doc.text("Detail Pesanan", 105, 15, { align: "center" });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`ID Pesanan: ${order.id_pesanan || "-"}`, 105, 25, { align: "center" });
        
        // Add line
        doc.setDrawColor(26, 115, 232);
        doc.setLineWidth(0.5);
        doc.line(20, 30, 190, 30);
        
        // Set initial position
        let y = 40;
        
        // Function to add a row
        function addRow(key, value) {
            const keyFormatted = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            
            // Format value if it's from a reference list
            let valueFormatted = value || "-";
            
            if (key === "deadline") {
                valueFormatted = formatTanggal(value);
            } else if (key === "id_desainer" && desainerList[value]) {
                valueFormatted = desainerList[value];
            } else if (key === "id_penjahit" && penjahitList[value]) {
                valueFormatted = penjahitList[value];
            } else if (key === "id_qc" && qcList[value]) {
                valueFormatted = qcList[value];
            } else if (key === "id_admin" && adminList[value]) {
                valueFormatted = adminList[value];
            }
            
            doc.setFont(undefined, "bold");
            doc.text(`${keyFormatted}:`, 20, y);
            doc.setFont(undefined, "normal");
            doc.text(`${valueFormatted}`, 80, y);
            y += 10;
            
            // Add page if we're near the bottom
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        }
        
        // Add data rows in a specific order
        const orderedKeys = [
            "id_input", "id_pesanan", "timestamp", "id_admin", "deadline", "qty",
            "platform", "id_desainer", "status_print", "layout_link", "status_produksi",
            "id_penjahit", "id_qc", "timestamp_designer", "timestamp_penjahit", "timestamp_qc"
        ];        
        
        orderedKeys.forEach(key => {
            if (order.hasOwnProperty(key)) {
                addRow(key, order[key]);
            }
        });
        
        // Add other properties that weren't in the ordered list
        Object.entries(order).forEach(([key, value]) => {
            if (!orderedKeys.includes(key)) {
                addRow(key, value);
            }
        });
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFont(undefined, "italic");
        doc.setFontSize(10);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
        }
    
        doc.save(`Order_${order.id_pesanan}.pdf`);
        showResultPopup("PDF berhasil didownload!");
    }
    
    function handleDownloadExcel() {
        if (!window.currentOrder) {
            showResultPopup("Tidak ada data pesanan untuk di-download.", true);
            return;
        }
        
        const downloadBtn = document.getElementById("downloadExcel");
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Excel...';
        
        // Check if XLSX is loaded
        if (typeof XLSX === 'undefined') {
            loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js")
                .then(() => {
                    generateExcel(window.currentOrder);
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = 'Download Excel';
                })
                .catch(error => {
                    console.error("Failed to load XLSX:", error);
                    showResultPopup("Gagal memuat library Excel.", true);
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = 'Download Excel';
                });
        } else {
            generateExcel(window.currentOrder);
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = 'Download Excel';
        }
    }
    
    function generateExcel(order) {
        const processedOrder = {...order};
        
        // Format values for better readability
        if (processedOrder.deadline) {
            processedOrder.deadline = formatTanggal(processedOrder.deadline);
        }
        if (processedOrder.id_desainer && desainerList[processedOrder.id_desainer]) {
            processedOrder.id_desainer = desainerList[processedOrder.id_desainer];
        }
        if (processedOrder.id_penjahit && penjahitList[processedOrder.id_penjahit]) {
            processedOrder.id_penjahit = penjahitList[processedOrder.id_penjahit];
        }
        if (processedOrder.qc && qcList[processedOrder.qc]) {
            processedOrder.qc = qcList[processedOrder.qc];
        }
        if (processedOrder.id_admin && adminList[processedOrder.id_admin]) {
            processedOrder.id_admin = adminList[processedOrder.id_admin];
        }
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet([processedOrder]);
        
        XLSX.utils.book_append_sheet(wb, ws, "OrderDetails");
        XLSX.writeFile(wb, `Order_${order.id_pesanan}.xlsx`);
        showResultPopup("Excel berhasil didownload!");
    }
    
    // Load external scripts dynamically
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(function addDeleteEventListeners() {
                    const tableBody = document.querySelector('table tbody');
                    const deletePopup = document.getElementById("deletePopup");
                    const confirmDeleteBtn = document.getElementById("confirmDelete");
                    const cancelDeleteBtn = document.getElementById("cancelDelete");
                
                    // Use event delegation for better performance
                    tableBody.addEventListener('click', function(event) {
                        const deleteIcon = event.target.closest('.delete-icon');
                        if (deleteIcon) {
                            event.preventDefault();
                            const orderId = deleteIcon.getAttribute("data-id");
                            if (orderId) {
                                showDeleteConfirmation(orderId);
                            } else {
                                console.error("Invalid order ID for deletion");
                            }
                        }
                    });
                
                    function showDeleteConfirmation(orderId) {
                        selectedOrderId = orderId;
                        deletePopup.classList.add("active");
                    }
                
                    // Add event listeners for the popup buttons
                    confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
                    cancelDeleteBtn.addEventListener("click", handleCancelDelete);
                
                    // Keyboard accessibility
                    deletePopup.addEventListener('keydown', function(event) {
                        if (event.key === 'Escape') {
                            handleCancelDelete();
                        } else if (event.key === 'Enter' && event.target === confirmDeleteBtn) {
                            handleConfirmDelete();
                        }
                    });
                });
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }
    
    // Preload external libraries
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
});