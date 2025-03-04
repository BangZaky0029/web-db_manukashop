document.addEventListener("DOMContentLoaded", function () {
    const ordersTable = document.getElementById("ordersTable").querySelector("tbody");
    const pageInfo = document.getElementById("pageInfo");
    let currentPage = 1;
    let totalPages = 1;
    let ordersData = [];
    let allOrdersData = [];

    function fetchOrders() {
        fetch("http://127.0.0.1:5000/api/get-input-table")  // Sesuaikan dengan API kamu
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    allOrdersData = data.data;
                    ordersData = [...allOrdersData];
                    totalPages = Math.ceil(ordersData.length / 10);
                    renderTable();
                }
            })
            .catch(error => console.error("Error fetching data:", error));
    }

    let adminList = {
        1001: "LILIS",
        1002: "INA"
    };

    function renderTable() {
        ordersTable.innerHTML = "";
        let start = (currentPage - 1) * 10;
        let end = start + 10;
        let paginatedOrders = ordersData.slice(start, end);

        paginatedOrders.forEach(order => {
            // Add platform-specific class
            let platformClass = order.Platform.toLowerCase().replace(/\s/g, '');
            
            let row = `<tr>
                <td>${order.TimeTemp}</td>
                <td>${order.id_input}</td>
                <td>${order.id_pesanan}</td>
                <td>${adminList[order.id_admin] || order.id_admin}</td>
                <td class="platform-${platformClass}">${order.Platform}</td>
                <td>${order.qty}</td>
                <td>${order.nama_ket}</td>
                <td><a href="${order.link}" target="_blank">Lihat</a></td>
                <td>${order.Deadline}</td>
            </tr>`;
            ordersTable.innerHTML += row;
        });

        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        
        // Disable/enable pagination buttons
        document.getElementById("prevPage").disabled = currentPage === 1;
        document.getElementById("nextPage").disabled = currentPage === totalPages;
    }

    let isUpdating = false;

    function updateData() {
        if (isUpdating) return;
        isUpdating = true;
    
        fetch("/api/update-print-status-layout", { method: "PUT" })
            .then(response => response.json())
            .then(data => console.log("Update sukses:", data))
            .finally(() => isUpdating = false);
    }

    document.getElementById("prevPage").addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById("nextPage").addEventListener("click", function () {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    document.getElementById("searchBtn").addEventListener("click", function () {
        let searchValue = document.getElementById("searchInput").value.toLowerCase();
        ordersData = allOrdersData.filter(order => 
            order.id_pesanan.toLowerCase().includes(searchValue) ||
            order.id_input.toLowerCase().includes(searchValue)
        );
        currentPage = 1;
        totalPages = Math.ceil(ordersData.length / 10);
        renderTable();
    });

    document.getElementById("refreshBtn").addEventListener("click", function () {
        document.getElementById("searchInput").value = "";
        document.getElementById("platformFilter").value = "all";
        fetchOrders();
    });

    document.getElementById("platformFilter").addEventListener("change", function () {
        let selectedPlatform = this.value;
        if (selectedPlatform === "all") {
            ordersData = [...allOrdersData];
        } else {
            ordersData = allOrdersData.filter(order => order.Platform === selectedPlatform);
        }
        currentPage = 1;
        totalPages = Math.ceil(ordersData.length / 10);
        renderTable();
    });

    // Search on key press (Enter)
    document.getElementById("searchInput").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            document.getElementById("searchBtn").click();
        }
    });
    // Auto Refresh Data Tanpa Mengganggu Interaksi
    setInterval(updateData, 5000);  // Update setiap 5 detik tanpa blocking

    fetchOrders();
});