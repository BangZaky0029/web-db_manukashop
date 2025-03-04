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
            // First load reference data
            await fetchReferenceData();
            // Then fetch orders
            await fetchOrders();
            // Add event listeners for filter and search
            setupFilterAndSearch();
            // Setup PDF and Excel buttons
        } catch (error) {
            console.error("Error initializing app:", error);
            showResultPopup("Gagal memuat aplikasi. Silakan refresh halaman.", true);
        }
    }

    document.getElementById("inputForm").addEventListener("submit", async function (event) {
        event.preventDefault(); // Hindari reload form
    
        const formData = new FormData(this);
        const response = await fetch("http://127.0.0.1:5000/api/get_table_design", {
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
            const response = await fetch("http://127.0.0.1:5000/api/get_table_design");
            
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
    
        orders.forEach(order => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${order.timestamp || "-"}</td>
                <td>${order.id_input || "-"}</td>
                <td>${order.platform || "-"}</td>
                <td>${order.qty || "-"}</td>
                <td>
                    <select class="desainer-dropdown" data-id="${order.id_input}" data-column="desainer">
                        <option value="">Pilih Desainer</option>
                        ${Object.entries(desainerList).map(([id, nama]) =>
                            `<option value="${id}" ${order.id_designer == id ? 'selected' : ''}>${nama}</option>`
                        ).join('')}
                    </select>
                </td>
                <td>
                    <input type="text" class="layout-link-input" data-id="${order.id_input}" data-column="layout_link"
                        value="${order.layout_link || ''}" placeholder="Masukkan link" />
                    <button class="submit-link-btn" data-id="${order.id_input}">Submit</button>
                    <button class="open-link-btn" data-id="${order.id_input}">🔗</button>
                </td>
                <td>${formatTanggal(order.deadline)}</td>
                <td>
                    <select class="status-print option" data-id="${order.id_input}" data-column="print_status">
                        <option value="-" ${order.status_print === '-' ? 'selected' : ''}>-</option>
                        <option value="EDITING" ${order.status_print === 'EDITING' ? 'selected' : ''}>EDITING</option>
                        <option value="PRINT VENDOR" ${order.status_print === 'PRINT VENDOR' ? 'selected' : ''}>PRINT VENDOR</option>
                        <option value="PROSES PRINT" ${order.status_print === 'PROSES PRINT' ? 'selected' : ''}>PROSES PRINT</option>
                        <option value="SELESAI PRINT" ${order.status_print === 'SELESAI PRINT' ? 'selected' : ''}>SELESAI PRINT</option>
                    </select>
                </td>
                <td>
                    <div style="display: flex; gap: 10px; justify-content: center;">
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
    
    function addInputChangeEventListeners() {
        // ✅ Event listener untuk input layout link (diperbarui saat blur)
        document.querySelectorAll(".layout-link-input").forEach(input => {
            input.addEventListener("blur", function() {
                const id_pesanan = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
    
                updateOrderWithConfirmation(id_pesanan, column, value);
            });
        });
    
        // ✅ Event listener untuk tombol submit link
        document.querySelectorAll(".submit-link-btn").forEach(button => {
            button.addEventListener("click", function() {
                const id_pesanan = this.dataset.id;
                const input = document.querySelector(`.layout-link-input[data-id="${id_pesanan}"]`);
                const value = input.value.trim();
    
                if (value) {
                    updateOrderWithConfirmation(id_pesanan, "layout_link", value);
                } else {
                    alert("Masukkan link sebelum submit.");
                }
            });
        });
    
        // ✅ Event listener untuk tombol membuka link di tab baru
        document.querySelectorAll(".open-link-btn").forEach(button => {
            button.addEventListener("click", function() {
                const id_pesanan = this.dataset.id;
                const input = document.querySelector(`.layout-link-input[data-id="${id_pesanan}"]`);
                const link = input.value.trim();
    
                if (link) {
                    window.open(link, "_blank");
                } else {
                    alert("Link belum tersedia.");
                }
            });
        });
    
        // ✅ Event listener untuk dropdown status produksi (diperbarui saat diubah)
        document.querySelectorAll(".status-print").forEach(select => {
            select.addEventListener("change", function () {
                const id_input = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
    
                updateOrder(id_input, column, value); // Pastikan fungsi dipanggil dengan parameter yang benar
            });
    
            updateSelectColor(select); // ✅ Pindahkan ini agar dijalankan setelah event listener ditambahkan
        });
    
        // ✅ Fungsi untuk mengubah warna berdasarkan status print
        function updateSelectColor(select) {
            let selectedValue = select.value.replace(/ /g, "-"); // Ganti spasi dengan "-"
            select.className = `status-print option-${selectedValue}`;
        }
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
        const adminName = await fetchAdminId(order.id_input);
        const ketNama = await fetchNamaKet(order.id_input); 

        const modalBody = document.getElementById("orderDetails");
        modalBody.innerHTML = '<tr><td colspan="2" class="text-center"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        try {
            const linkFoto = await fetchLinkFoto(order.id_input);
            
            modalBody.innerHTML = `
                <tr><th>ID INPUT</th><td>${order.id_input || "-"}</td></tr>
                <tr><th>Admin</th><td>${adminName}</td></tr>
                <tr><th>Timestamp</th><td>${order.timestamp || "-"}</td></tr>
                <tr><th>Deadline</th><td>${formatTanggal(order.deadline) || "-"}</td></tr>
                <tr><th>Quantity</th><td>${order.qty || "-"}</td></tr>
                <tr><th>Platform</th><td>${order.platform || "-"}</td></tr>
                <tr><th>Desainer</th><td>${desainerList[order.id_designer] || "-"}</td></tr>
                <tr><th>Status Print</th><td><span class="badge ${getBadgeClass(order.status_print)}">${order.status_print || "-"}</span></td></tr>
                <tr><th>Layout Link</th><td>${
                    order.layout_link 
                    ? `<a href="${order.layout_link}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-link"></i> Buka Link</a>`
                    : "-"
                }</td></tr>
                <tr><th>Link Foto</th><td>${
                    linkFoto && linkFoto !== "-" 
                    ? `<a href="${linkFoto}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-image"></i> Lihat Foto</a>` 
                    : "Tidak Tersedia"
                }</td></tr>
                <tr><th>Keterangan Pesanan</th><td>${ketNama}</td></tr>
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
        const baseUrl = "http://127.0.0.1:5000"; // Sesuaikan dengan URL API kamu
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
    

    async function fetchAdminId(id_input) {
        if (!id_input || id_input === "-") {
            console.warn("❌ ID Input tidak valid:", id_input);
            return "-";
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/get_id_admin/${id_input}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
    
            if (!data || !data.id_admin) {
                console.warn("⚠️ ID Admin tidak ditemukan untuk:", id_input);
                return "-";
            }
            
            return adminList[data.id_admin] || data.id_admin; // Ambil nama admin atau ID jika tidak ada di list
        
        } catch (error) {
            console.error("❌ Error fetching ID Admin:", error);
            return "-";
        }
    }
    
    
    function getBadgeClass(status) {
        switch(status) {
            case '-': return 'bg-primary text-white';
            case 'SEDANG DI-PRESS': return 'bg-indigo text-white';
            case 'SEDANG DI-JAHIT': return 'bg-success text-white';
            case 'TAS SUDAH DI-JAHIT': return 'bg-teal text-white';
            case 'REJECT : PRINT ULANG': return 'bg-danger text-white';
            case 'TAS BLM ADA': return 'bg-danger text-white';
            case 'DONE': return 'bg-success text-white';
            default: return 'bg-secondary text-white';
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
        if (column === "id_designer" && desainerList[value]) {
            displayValue = desainerList[value];
        }
        
        // Column display name for user interface
        let columnDisplay = column;
        switch(column) {
            case "id_designer": columnDisplay = "Desainer"; break;
            case "status_print": columnDisplay = "Status Print"; break;
            case "layout_link": columnDisplay = "Layout Link"; break;
        }
        
        confirmMessage.innerText = `Yakin ingin update ${columnDisplay} menjadi "${displayValue}" untuk ID Pesanan ${id_input}?`;
        confirmPopup.classList.add("active");
        
        // Store the update details for use in event handlers
        confirmPopup.dataset.id = id_input;
        confirmPopup.dataset.column = column;
        confirmPopup.dataset.value = value;
    }
    
    function addUpdateEventListeners() {
        // For all dropdowns with data-column attribute (print-status and desainer)
        document.querySelectorAll("select[data-column]").forEach(select => {
            select.addEventListener("change", function () {
                const id_input = this.dataset.id;
                let column = this.dataset.column;
                const value = this.value;
                
                // Map the column names to match the API expectations
                if (column === "print_status") {
                    column = "status_print";
                } else if (column === "desainer") {
                    column = "id_designer";
                }
                
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
                    // Map back from API field names to UI field names
                    let fieldName = popup.dataset.column;
                    if (fieldName === "status_print") {
                        fieldName = "print_status";
                    } else if (fieldName === "id_designer") {
                        fieldName = "desainer";
                    }
                    element.value = originalOrder[fieldName] || "";
                } else if (originalOrder && element.tagName === "INPUT") {
                    let fieldName = popup.dataset.column;
                    if (fieldName === "layout_link") {
                        fieldName = "layout_link"; // Note capital L in "Layout_link"
                    }
                    element.value = originalOrder[fieldName] || "";
                }
            }
        });
    }
    
    function updateOrder(id_input, column, value) {
        const endpoint = "http://127.0.0.1:5000/api/update-design";
    
        const confirmUpdateBtn = document.getElementById("confirmUpdateBtn");
        confirmUpdateBtn.disabled = true;
        confirmUpdateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
        // Buat format JSON sesuai yang diharapkan API
        const payload = {
            id_input: id_input,
            id_designer: null,
            layout_link: null,
            status_print: null
        };
    
        // Pastikan field yang diubah dimasukkan ke dalam JSON
        if (column === "id_designer") {
            payload.id_designer = value;
        } else if (column === "layout_link") {
            payload.layout_link = value;
        } else if (column === "status_print") {
            payload.status_print = value;
        }
    
        fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Gagal update! Status: ${response.status}`);
            } 
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                showResultPopup(`Update berhasil: ${column} -> ${value}`);
                fetchOrders(); // Ambil data terbaru setelah update sukses
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
    
    
});