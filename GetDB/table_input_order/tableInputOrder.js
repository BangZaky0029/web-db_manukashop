document.addEventListener("DOMContentLoaded", function () {
    const ordersTable = document.getElementById("ordersTable").querySelector("tbody");
    const pageInfo = document.getElementById("pageInfo");
    let currentPage = 1;
    let totalPages = 1;
    let ordersData = [];

    function fetchOrders() {
        fetch("http://127.0.0.1:5000/api/input-table")  // Sesuaikan dengan API kamu
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    ordersData = data.data;
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
            let row = `<tr>
                <td>${order.TimeTemp}</td>
                <td>${order.id_input}</td>
                <td>${order.id_pesanan}</td>
                <td>${adminList[order.ID]}</td>
                <td>${order.Platform}</td>
                <td>${order.qty}</td>
                <td>${order.nama_ket}</td>
                <td><a href="${order.link}" target="_blank">Lihat</a></td>
                <td>${order.Deadline}</td>
            </tr>`;
            ordersTable.innerHTML += row;
        });

        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
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
        let filteredOrders = ordersData.filter(order => order.id_pesanan.toLowerCase().includes(searchValue));
        ordersData = filteredOrders;
        renderTable();
    });

    document.getElementById("refreshBtn").addEventListener("click", function () {
        fetchOrders();
    });

    document.getElementById("platformFilter").addEventListener("change", function () {
        let selectedPlatform = this.value;
        if (selectedPlatform === "all") {
            fetchOrders();
        } else {
            ordersData = ordersData.filter(order => order.Platform === selectedPlatform);
            renderTable();
        }
    });

    fetchOrders();
});
