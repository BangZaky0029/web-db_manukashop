document.getElementById("orderForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    // Ambil nilai radio button yang dipilih untuk admin
    const adminValue = document.querySelector('input[name="admin"]:checked');
    if (!adminValue) {
        document.getElementById("responseMessage").innerHTML = "<span style='color: red;'>Pilih admin terlebih dahulu!</span>";
        return;
    }

    // Ambil nilai radio button yang dipilih untuk platform
    const platformValue = document.querySelector('input[name="platform"]:checked');
    if (!platformValue) {
        document.getElementById("responseMessage").innerHTML = "<span style='color: red;'>Pilih platform terlebih dahulu!</span>";
        return;
    }

    // Ambil data dari form
    const id_pesanan = document.getElementById("id_pesanan").value;
    const deadline = document.getElementById("deadline").value;
    const qty = document.getElementById("qty").value || "";
    const nama_ket = document.getElementById("nama_ket").value || "";
    const link = document.getElementById("link").value || "";

    // Validasi input wajib
    if (!id_pesanan || !deadline) {
        document.getElementById("responseMessage").innerHTML = "<span style='color: red;'>ID Pesanan dan Deadline wajib diisi!</span>";
        return;
    }

    // Buat objek data untuk dikirim sebagai JSON
    const jsonData = {
        "id_pesanan": id_pesanan,
        "ID": adminValue.value,
        "Deadline": deadline,
        "Platform": platformValue.value,
        "qty": qty,
        "nama_ket": nama_ket,
        "link": link
    };

    try {
        const response = await fetch("http://127.0.0.1:5000/api/input-order", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            credentials: "same-origin", // Jika backend tidak butuh session, pakai "same-origin" atau hapus
            body: JSON.stringify(jsonData)
        });
        
        

        const result = await response.json();

        if (response.ok) {
            document.getElementById("responseMessage").innerHTML = `<span style="color: green;">${result.message}</span>`;
            document.getElementById("orderForm").reset();
        } else {
            document.getElementById("responseMessage").innerHTML = `<span style="color: red;">${result.message}</span>`;
        }

    } catch (error) {
        console.error("Error:", error);
        document.getElementById("responseMessage").innerHTML = `<span style="color: red;">Gagal mengirim data. Coba lagi.</span>`;
    }
});