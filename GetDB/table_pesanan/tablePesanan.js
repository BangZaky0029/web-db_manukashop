document.addEventListener("DOMContentLoaded", function () {
    let selectedOrderId = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let allOrders = [];

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
            setupDownloadButtons();
        } catch (error) {
            console.error("Error initializing app:", error);
            showResultPopup("Gagal memuat aplikasi. Silakan refresh halaman.", true);
        }
    }

    async function fetchOrders() {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/get-orders");
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
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
            order.id_pesanan && order.id_pesanan.toLowerCase().includes(searchTermLower)
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
                <td>${order.id_pesanan || "-"}</td>
                <td>${order.id_input || "-"}</td>
                <td>${adminList[order.admin] || "-"}</td>
                <td>${order.quantity || "-"}</td>
                <td>${formatTanggal(order.deadline)}</td>
                
                <td>
                    <select class="desainer-dropdown" data-id="${order.id_pesanan}" data-column="desainer">
                        <option value="">Pilih Desainer</option>
                        ${Object.entries(desainerList).map(([id, nama]) =>
                            `<option value="${id}" ${order.desainer == id ? 'selected' : ''}>${nama}</option>`
                        ).join('')}
                    </select>
                </td>
    
                <td>
                    <select class="print-status-dropdown" data-id="${order.id_pesanan}" data-column="print_status">
                        <option value="Pending" ${order.print_status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Selesai" ${order.print_status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                        <option value="Dibatalkan" ${order.print_status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
                    </select>
                </td>
    
                <td>
                    <input type="text" class="layout-link-input" data-id="${order.id_pesanan}" data-column="layout_link"
                           value="${order.layout_link || ''}" placeholder="Masukkan link" />
                </td>
    
                <td>
                    <select class="penjahit-dropdown" data-id="${order.id_pesanan}" data-column="penjahit">
                        <option value="">Pilih Penjahit</option>
                        ${Object.entries(penjahitList).map(([id, nama]) =>
                            `<option value="${id}" ${order.penjahit == id ? 'selected' : ''}>${nama}</option>`
                        ).join('')}
                    </select>
                </td>
    
                <td>
                    <select class="qc-dropdown" data-id="${order.id_pesanan}" data-column="qc">
                        <option value="">Pilih QC</option>
                        ${Object.entries(qcList).map(([id, nama]) =>
                            `<option value="${id}" ${order.qc == id ? 'selected' : ''}>${nama}</option>`
                        ).join('')}
                    </select>
                </td>
    
                <td>${order.platform || "-"}</td>
    
                <td>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="delete-icon" data-id="${order.id_pesanan}"><i class="fas fa-trash-alt"></i></button>
                        <button class="desc-table" data-id="${order.id_pesanan}"><i class="fas fa-info-circle"></i></button>
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
        document.querySelectorAll(".layout-link-input").forEach(input => {
            input.addEventListener("blur", function() {
                const id_pesanan = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
                
                updateOrderWithConfirmation(id_pesanan, column, value);
            });
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
                data.table_admin.forEach(a => adminList[a.ID] = a.Nama);
            }
            if (data.table_desainer) {
                data.table_desainer.forEach(d => desainerList[d.ID] = d.Nama);
            }
            if (data.table_kurir) {
                data.table_kurir.forEach(k => kurirList[k.ID] = k.Nama);
            }
            if (data.table_penjahit) {
                data.table_penjahit.forEach(p => penjahitList[p.ID] = p.Nama);
            }
            if (data.table_qc) {
                data.table_qc.forEach(q => qcList[q.ID] = q.Nama);
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
        const order = allOrders.find(order => order.id_pesanan == orderId);
        if (order) {
            showDescriptionModal(order);
        } else {
            showResultPopup("Deskripsi pesanan tidak ditemukan.", true);
        }
    }

    async function fetchLinkFoto(id_pesanan) {
        if (!id_pesanan || id_pesanan === "-") {
            console.warn("ID tidak valid:", id_pesanan);
            return "-";
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/get_link_foto/${id_pesanan}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
    
            if (!data || !data.data || typeof data.data.link_foto !== "string") {
                console.warn("Format response tidak valid atau link_foto kosong:", data);
                return "-";
            }
            
            return data.data.link_foto;
    
        } catch (error) {
            console.error("Error fetching link foto:", error);
            return "-";
        }
    }

    async function showDescriptionModal(order) {
        if (!order.id_pesanan) {
            console.error("ID Pesanan tidak valid:", order);
            return;
        }

        const modalBody = document.getElementById("orderDetails");
        modalBody.innerHTML = '<tr><td colspan="2" class="text-center"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';
        
        try {
            const linkFoto = await fetchLinkFoto(order.id_pesanan);
            
            modalBody.innerHTML = `
                <tr><th>ID Pesanan</th><td>${order.id_pesanan || "-"}</td></tr>
                <tr><th>Admin</th><td>${adminList[order.admin] || "-"}</td></tr>
                <tr><th>Timestamp</th><td>${order.timestamp || "-"}</td></tr>
                <tr><th>Deadline</th><td>${formatTanggal(order.deadline) || "-"}</td></tr>
                <tr><th>Quantity</th><td>${order.quantity || "-"}</td></tr>
                <tr><th>Platform</th><td>${order.platform || "-"}</td></tr>
                <tr><th>Desainer</th><td>${desainerList[order.desainer] || "-"}</td></tr>
                <tr><th>Status Print</th><td><span class="badge ${getBadgeClass(order.print_status)}">${order.print_status || "Pending"}</span></td></tr>
                <tr><th>Layout Link</th><td>${
                    order.layout_link 
                    ? `<a href="${order.layout_link}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-link"></i> Buka Link</a>`
                    : "-"
                }</td></tr>
                <tr><th>Penjahit</th><td>${penjahitList[order.penjahit] || "-"}</td></tr>
                <tr><th>QC</th><td>${qcList[order.qc] || "-"}</td></tr>
                <tr><th>Link Foto</th><td>${
                    linkFoto && linkFoto !== "-" 
                    ? `<a href="${linkFoto}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-image"></i> Lihat Foto</a>` 
                    : "Tidak Tersedia"
                }</td></tr>
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
            case 'Selesai': return 'bg-success';
            case 'Pending': return 'bg-warning text-dark';
            case 'Dibatalkan': return 'bg-danger';
            default: return 'bg-secondary';
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
        
        // Add event listeners for the popup buttons
        document.getElementById("confirmDelete").addEventListener("click", handleConfirmDelete);
        document.getElementById("cancelDelete").addEventListener("click", handleCancelDelete);
    }
    
    function handleConfirmDelete() {
        if (!selectedOrderId) {
            showResultPopup("Error: ID pesanan tidak valid.", true);
            return;
        }
    
        const confirmDeleteBtn = document.getElementById("confirmDelete");
        confirmDeleteBtn.disabled = true; // Disable tombol sementara
        confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
    
        fetch(`http://127.0.0.1:5000/api/delete-order/${selectedOrderId}`, { method: "DELETE" })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === "success") {
                    showResultPopup("Pesanan berhasil dihapus!");
                    fetchOrders(); // Refresh data after deletion
                } else {
                    showResultPopup(`Gagal menghapus: ${data.message}`, true);
                }
            })
            .catch(error => {
                console.error("Error saat menghapus pesanan:", error);
                showResultPopup(`Terjadi kesalahan saat menghapus pesanan: ${error.message}`, true);
            })
            .finally(() => {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.innerHTML = 'Ya, Hapus';
                const deletePopup = document.getElementById("deletePopup");
                deletePopup.classList.remove("active");
            });
    }
    
    function handleCancelDelete() {
        const deletePopup = document.getElementById("deletePopup");
        deletePopup.classList.remove("active");
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
    
    function updateOrderWithConfirmation(id_pesanan, column, value) {
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
        
        confirmMessage.innerText = `Yakin ingin update ${columnDisplay} menjadi "${displayValue}" untuk ID Pesanan ${id_pesanan}?`;
        confirmPopup.classList.add("active");
        
        // Store the update details for use in event handlers
        confirmPopup.dataset.id = id_pesanan;
        confirmPopup.dataset.column = column;
        confirmPopup.dataset.value = value;
    }
    
    function addUpdateEventListeners() {
        // For all dropdowns with data-column attribute
        document.querySelectorAll("select[data-column]").forEach(select => {
            select.addEventListener("change", function () {
                const id_pesanan = this.dataset.id;
                const column = this.dataset.column;
                const value = this.value;
    
                updateOrderWithConfirmation(id_pesanan, column, value);
            });
        });
        
        // Confirm update button
        document.getElementById("confirmUpdateBtn").addEventListener("click", function() {
            const popup = document.getElementById("confirmUpdatePopup");
            const id_pesanan = popup.dataset.id;
            const column = popup.dataset.column;
            const value = popup.dataset.value;
            
            updateOrder(id_pesanan, column, value);
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
                const originalOrder = allOrders.find(order => order.id_pesanan == popup.dataset.id);
                if (originalOrder && element.tagName === "SELECT") {
                    element.value = originalOrder[popup.dataset.column] || "";
                } else if (originalOrder && element.tagName === "INPUT") {
                    element.value = originalOrder[popup.dataset.column] || "";
                }
            }
        });
    }
    
    function updateOrder(id_pesanan, column, value) {
        console.log(`Updating order ${id_pesanan}: ${column} = ${value}`);
        
        // Determine which endpoint to use based on column
        let endpoint = "http://127.0.0.1:5000/api/update-order";
        
        if (column === "print_status" || column === "layout_link") {
            endpoint = "http://127.0.0.1:5000/api/update-print-status-layout";
        }
        
        const confirmUpdateBtn = document.getElementById("confirmUpdateBtn");
        confirmUpdateBtn.disabled = true;
        confirmUpdateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        
        fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_pesanan, column, value })
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
                // Update the local data
                const orderIndex = allOrders.findIndex(order => order.id_pesanan == id_pesanan);
                if (orderIndex !== -1) {
                    allOrders[orderIndex][column] = value;
                    renderOrdersTable(paginateOrders(allOrders));
                } else {
                    // If local update fails, fetch all orders again
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
            } else if (key === "desainer" && desainerList[value]) {
                valueFormatted = desainerList[value];
            } else if (key === "penjahit" && penjahitList[value]) {
                valueFormatted = penjahitList[value];
            } else if (key === "qc" && qcList[value]) {
                valueFormatted = qcList[value];
            } else if (key === "admin" && adminList[value]) {
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
            "id_pesanan", "timestamp", "admin", "deadline", "quantity", 
            "platform", "desainer", "print_status", "layout_link", 
            "penjahit", "qc"
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
        if (processedOrder.desainer && desainerList[processedOrder.desainer]) {
            processedOrder.desainer = desainerList[processedOrder.desainer];
        }
        if (processedOrder.penjahit && penjahitList[processedOrder.penjahit]) {
            processedOrder.penjahit = penjahitList[processedOrder.penjahit];
        }
        if (processedOrder.qc && qcList[processedOrder.qc]) {
            processedOrder.qc = qcList[processedOrder.qc];
        }
        if (processedOrder.admin && adminList[processedOrder.admin]) {
            processedOrder.admin = adminList[processedOrder.admin];
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
                resolve();
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