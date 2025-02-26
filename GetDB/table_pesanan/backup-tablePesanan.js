document.addEventListener("DOMContentLoaded", function () {
    let selectedOrderId = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let allOrders = [];

    let adminList = {};
    let desainerList = {};
    let penjahitList = {};
    let qcList = {};

    initApp();

    async function initApp() {
        try {
            await syncOrdersFromInputTable(); // Sinkronisasi data otomatis
            await fetchReferenceData();
            await fetchOrders();
            setupFilterAndSearch();
        } catch (error) {
            console.error("Error initializing app:", error);
            showResultPopup("Gagal memuat aplikasi. Silakan refresh halaman.", true);
        }
    }

    async function syncOrdersFromInputTable() {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/sync-orders", { method: "POST" });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            console.log("Sync Result:", data);
        } catch (error) {
            console.error("Error syncing orders:", error);
        }
    }

    async function fetchOrders() {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/get-orders");
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            if (data.status === "success") {
                allOrders = data.data;
                renderOrdersTable(paginateOrders(allOrders));
                updatePagination();
            } else {
                showResultPopup("Gagal mengambil data pesanan.", true);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            showResultPopup("Terjadi kesalahan saat mengambil data.", true);
        }
    }

    function paginateOrders(orders) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return orders.slice(startIndex, startIndex + itemsPerPage);
    }

    function updatePagination() {
        const totalPages = Math.ceil(allOrders.length / itemsPerPage);
        document.getElementById("pageInfo").textContent = `Halaman ${currentPage} dari ${totalPages || 1}`;
        document.getElementById("prevPage").disabled = currentPage <= 1;
        document.getElementById("nextPage").disabled = currentPage >= totalPages;
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
                <td>${order.qty || "-"}</td>
                <td>${order.deadline || "-"}</td>
                <td>${desainerList[order.desainer] || "-"}</td>
                <td>${order.print_status || "Pending"}</td>
                <td>${order.layout_link ? `<a href="${order.layout_link}" target="_blank">Link</a>` : "-"}</td>
                <td>${penjahitList[order.penjahit] || "-"}</td>
                <td>${qcList[order.qc] || "-"}</td>
                <td>${order.platform || "-"}</td>
                <td>
                    <button class="delete-icon" data-id="${order.id_input}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        addDeleteEventListeners();
    }

    async function fetchReferenceData() {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/references");
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            data.table_admin.forEach(a => adminList[a.ID] = a.Nama);
            data.table_desainer.forEach(d => desainerList[d.ID] = d.Nama);
            data.table_penjahit.forEach(p => penjahitList[p.ID] = p.Nama);
            data.table_qc.forEach(q => qcList[q.ID] = q.Nama);
        } catch (error) {
            console.error("Gagal mengambil data referensi:", error);
        }
    }

    function showResultPopup(message, isError = false) {
        const popup = document.getElementById("resultPopup");
        popup.textContent = message;
        popup.style.backgroundColor = isError ? "#ff3f5b" : "#1a73e8";
        popup.classList.add("show");
        setTimeout(() => popup.classList.remove("show"), 3000);
    }
});
