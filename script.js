
/* =========================================
   BOOKTRACK - SISTEM INFORMASI PERPUSTAKAAN
   ========================================= */

// =========================================
// 1. DATA DAN LOCAL STORAGE
// =========================================

function loadData(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch {
        return defaultValue;
    }
}

let books = loadData("bt_books", [
    { id: 1, code: "BK001", title: "Pemrograman JavaScript", author: "Abdul Kadir", category: "Teknologi", stock: 5 },
    { id: 2, code: "BK002", title: "Dasar-Dasar Python", author: "Budi Raharjo", category: "Teknologi", stock: 8 },
    { id: 3, code: "BK003", title: "Laskar Pelangi", author: "Andrea Hirata", category: "Novel", stock: 4 },
    { id: 4, code: "BK004", title: "Laut Bercerita", author: "Leila S. Chudori", category: "Novel", stock: 6 }
]);

let members = loadData("bt_members", [
    { id: 1, name: "Andi Saputra", email: "andi@email.com", phone: "08123456789" },
    { id: 2, name: "Siti Amelia", email: "siti@email.com", phone: "08234567890" }
]);

let loans = loadData("bt_loans", []);
let returns = loadData("bt_returns", []);

// Simpan seluruh data
function saveData() {
    localStorage.setItem("bt_books", JSON.stringify(books));
    localStorage.setItem("bt_members", JSON.stringify(members));
    localStorage.setItem("bt_loans", JSON.stringify(loans));
    localStorage.setItem("bt_returns", JSON.stringify(returns));
}

// ID otomatis
function nextId(items) {
    return Math.max(0, ...items.map(item => item.id)) + 1;
}

// Mengamankan teks sebelum dimasukkan ke HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Tanggal lokal YYYY-MM-DD
function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Format tanggal Indonesia
function formatDate(date) {
    if (!date) return "-";

    const [year, month, day] = date.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("id-ID");
}

// Tambah hari pada tanggal
function addDays(date, days) {
    const [year, month, day] = date.split("-").map(Number);

    const result = new Date(year, month - 1, day);
    result.setDate(result.getDate() + days);

    return localDateString(result);
}


// =========================================
// 2. NAVIGASI
// =========================================

function showPage(page) {

    const target = document.getElementById(page + "-page");

    if (!target) return;

    document.querySelectorAll(".page").forEach(item => {
        item.classList.remove("active");
    });

    target.classList.add("active");

    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.toggle("active", item.dataset.page === page);
    });

    const titles = {
        dashboard: "Dashboard",
        books: "Data Buku",
        members: "Data Anggota",
        loans: "Peminjaman",
        returns: "Pengembalian"
    };

    document.getElementById("page-title").textContent = titles[page];

    renderAll();
}

document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", function (event) {
        event.preventDefault();
        showPage(this.dataset.page);
    });
});


// =========================================
// 3. MODAL
// =========================================

function openModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}


// =========================================
// 4. CRUD BUKU
// =========================================

function openBookModal(id = null) {

    document.getElementById("book-form").reset();
    document.getElementById("book-id").value = "";

    document.getElementById("book-modal-title").textContent =
        id ? "Edit Buku" : "Tambah Buku";

    if (id !== null) {

        const book = books.find(item => item.id === id);

        if (!book) return;

        document.getElementById("book-id").value = book.id;
        document.getElementById("book-code").value = book.code;
        document.getElementById("book-title").value = book.title;
        document.getElementById("book-author").value = book.author;
        document.getElementById("book-category").value = book.category;
        document.getElementById("book-stock").value = book.stock;
    }

    openModal("book-modal");
}

document.getElementById("book-form").addEventListener("submit", function (event) {

    event.preventDefault();

    const id = Number(document.getElementById("book-id").value);

    const book = {
        id: id || nextId(books),
        code: document.getElementById("book-code").value.trim(),
        title: document.getElementById("book-title").value.trim(),
        author: document.getElementById("book-author").value.trim(),
        category: document.getElementById("book-category").value.trim(),
        stock: Number(document.getElementById("book-stock").value)
    };

    if (!book.code || !book.title || !book.author || !book.category) {
        alert("Semua data buku wajib diisi!");
        return;
    }

    if (!Number.isInteger(book.stock) || book.stock < 0) {
        alert("Stok harus berupa bilangan bulat minimal 0!");
        return;
    }

    const duplicate = books.some(item =>
        item.code.toLowerCase() === book.code.toLowerCase()
        && item.id !== id
    );

    if (duplicate) {
        alert("Kode buku sudah digunakan!");
        return;
    }

    if (id) {
        const oldBook = books.find(item => item.id === id);
        const borrowed = loans
            .filter(loan => loan.bookId === id && loan.status === "Dipinjam")
            .length;

        if (book.stock < borrowed) {
            alert(`Stok tidak boleh kurang dari ${borrowed}, karena masih ada buku yang dipinjam.`);
            return;
        }

        books = books.map(item => item.id === id ? book : item);
    } else {
        books.push(book);
    }

    saveData();
    closeModal("book-modal");
    renderAll();

    alert("Data buku berhasil disimpan!");
});

function deleteBook(id) {

    const hasActiveLoan = loans.some(loan =>
        loan.bookId === id && loan.status === "Dipinjam"
    );

    if (hasActiveLoan) {
        alert("Buku tidak dapat dihapus karena masih dipinjam!");
        return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus buku ini?")) return;

    books = books.filter(item => item.id !== id);

    saveData();
    renderAll();
}


// =========================================
// 5. CRUD ANGGOTA
// =========================================

function openMemberModal(id = null) {

    document.getElementById("member-form").reset();
    document.getElementById("member-id").value = "";

    document.getElementById("member-modal-title").textContent =
        id ? "Edit Anggota" : "Tambah Anggota";

    if (id !== null) {

        const member = members.find(item => item.id === id);

        if (!member) return;

        document.getElementById("member-id").value = member.id;
        document.getElementById("member-name").value = member.name;
        document.getElementById("member-email").value = member.email;
        document.getElementById("member-phone").value = member.phone;
    }

    openModal("member-modal");
}

document.getElementById("member-form").addEventListener("submit", function (event) {

    event.preventDefault();

    const id = Number(document.getElementById("member-id").value);

    const member = {
        id: id || nextId(members),
        name: document.getElementById("member-name").value.trim(),
        email: document.getElementById("member-email").value.trim(),
        phone: document.getElementById("member-phone").value.trim()
    };

    if (!member.name || !member.email || !member.phone) {
        alert("Semua data anggota wajib diisi!");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
        alert("Format email tidak valid!");
        return;
    }

    if (!/^[0-9+\-\s]{8,15}$/.test(member.phone)) {
        alert("Nomor telepon harus berisi 8-15 karakter angka atau tanda +!");
        return;
    }

    const duplicate = members.some(item =>
        item.email.toLowerCase() === member.email.toLowerCase()
        && item.id !== id
    );

    if (duplicate) {
        alert("Email sudah terdaftar!");
        return;
    }

    if (id) {
        members = members.map(item => item.id === id ? member : item);
    } else {
        members.push(member);
    }

    saveData();
    closeModal("member-modal");
    renderAll();

    alert("Data anggota berhasil disimpan!");
});

function deleteMember(id) {

    const hasActiveLoan = loans.some(loan =>
        loan.memberId === id && loan.status === "Dipinjam"
    );

    if (hasActiveLoan) {
        alert("Anggota masih memiliki peminjaman aktif!");
        return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus anggota ini?")) return;

    members = members.filter(item => item.id !== id);

    saveData();
    renderAll();
}


// =========================================
// 6. PEMINJAMAN BUKU
// =========================================

function openLoanModal() {

    if (members.length === 0) {
        alert("Belum ada anggota terdaftar!");
        return;
    }

    if (!books.some(book => book.stock > 0)) {
        alert("Tidak ada buku yang tersedia!");
        return;
    }

    document.getElementById("loan-member").innerHTML =
        members.map(member => `
            <option value="${member.id}">
                ${escapeHTML(member.name)}
            </option>
        `).join("");

    document.getElementById("loan-book").innerHTML =
        books.filter(book => book.stock > 0)
            .map(book => `
            <option value="${book.id}">
                ${escapeHTML(book.title)} (Stok: ${book.stock})
            </option>
        `).join("");

    const today = localDateString();

    document.getElementById("loan-date").value = today;
    document.getElementById("loan-date").max = today;
    document.getElementById("loan-duration").value = 7;

    openModal("loan-modal");
}

document.getElementById("loan-form").addEventListener("submit", function (event) {

    event.preventDefault();

    const memberId = Number(document.getElementById("loan-member").value);
    const bookId = Number(document.getElementById("loan-book").value);
    const date = document.getElementById("loan-date").value;
    const duration = Number(document.getElementById("loan-duration").value);

    const member = members.find(item => item.id === memberId);
    const book = books.find(item => item.id === bookId);

    if (!member || !book) {
        alert("Data anggota atau buku tidak ditemukan!");
        return;
    }

    if (book.stock < 1) {
        alert("Stok buku tidak tersedia!");
        return;
    }

    if (date > localDateString() || !date) {
        alert("Tanggal peminjaman tidak valid!");
        return;
    }

    if (!Number.isInteger(duration) || duration < 1 || duration > 30) {
        alert("Lama peminjaman harus antara 1 sampai 30 hari!");
        return;
    }

    const dueDate = addDays(date, duration);

    loans.push({
        id: nextId(loans),
        memberId,
        bookId,
        date,
        dueDate,
        status: "Dipinjam"
    });

    book.stock--;

    saveData();
    closeModal("loan-modal");
    renderAll();

    alert("Peminjaman berhasil dicatat!");
});


// =========================================
// 7. PENGEMBALIAN BUKU
// =========================================

function returnBook(id) {

    const loan = loans.find(item => item.id === id);

    if (!loan || loan.status !== "Dipinjam") return;

    if (!confirm("Konfirmasi pengembalian buku?")) return;

    const returnDate = localDateString();

    loan.status = "Dikembalikan";
    loan.returnDate = returnDate;

    const book = books.find(item => item.id === loan.bookId);

    if (book) {
        book.stock++;
    }

    returns.push({
        id: loan.id,
        memberId: loan.memberId,
        bookId: loan.bookId,
        date: returnDate
    });

    saveData();
    renderAll();

    alert("Buku berhasil dikembalikan!");
}


// =========================================
// 8. STATUS PEMINJAMAN
// =========================================

function getLoanStatus(loan) {

    if (loan.status === "Dikembalikan") {
        return `<span class="status status-returned">Dikembalikan</span>`;
    }

    if (localDateString() > loan.dueDate) {
        return `<span class="status status-late">Terlambat</span>`;
    }

    return `<span class="status status-active">Dipinjam</span>`;
}


// =========================================
// 9. DASHBOARD
// =========================================

function renderDashboard() {

    document.getElementById("total-books").textContent =
        books.reduce((total, book) => total + book.stock, 0);

    document.getElementById("total-members").textContent =
        members.length;

    document.getElementById("total-loans").textContent =
        loans.filter(loan => loan.status === "Dipinjam").length;

    document.getElementById("total-returns").textContent =
        returns.length;

    document.getElementById("dashboard-book-list").innerHTML =

        books.slice(-5).reverse().map(book => `
            <tr>
                <td>${escapeHTML(book.code)}</td>
                <td>${escapeHTML(book.title)}</td>
                <td>${escapeHTML(book.author)}</td>
                <td>${escapeHTML(book.category)}</td>
                <td>${book.stock}</td>
            </tr>
        `).join("") ||

        `<tr>
            <td colspan="5" class="empty-state">
                Belum ada buku.
            </td>
        </tr>`;
}


// =========================================
// 10. TAMPIL DATA BUKU
// =========================================

function renderBooks(keyword = "") {

    const search = keyword.toLowerCase();

    const filtered = books.filter(book =>
        [book.code, book.title, book.author, book.category]
            .some(value => value.toLowerCase().includes(search))
    );

    document.getElementById("book-list").innerHTML =

        filtered.map(book => `
            <tr>
                <td>${escapeHTML(book.code)}</td>
                <td>${escapeHTML(book.title)}</td>
                <td>${escapeHTML(book.author)}</td>
                <td>${escapeHTML(book.category)}</td>
                <td>${book.stock}</td>
                <td>
                    <button class="action-btn edit-btn"
                        onclick="openBookModal(${book.id})">
                        Edit
                    </button>

                    <button class="action-btn delete-btn"
                        onclick="deleteBook(${book.id})">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join("") ||

        `<tr>
            <td colspan="6" class="empty-state">
                Data buku tidak ditemukan.
            </td>
        </tr>`;
}


// =========================================
// 11. TAMPIL DATA ANGGOTA
// =========================================

function renderMembers() {

    document.getElementById("member-list").innerHTML =

        members.map(member => `
            <tr>
                <td>AG${String(member.id).padStart(3, "0")}</td>
                <td>${escapeHTML(member.name)}</td>
                <td>${escapeHTML(member.email)}</td>
                <td>${escapeHTML(member.phone)}</td>
                <td>
                    <button class="action-btn edit-btn"
                        onclick="openMemberModal(${member.id})">
                        Edit
                    </button>

                    <button class="action-btn delete-btn"
                        onclick="deleteMember(${member.id})">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join("") ||

        `<tr>
            <td colspan="5" class="empty-state">
                Belum ada anggota.
            </td>
        </tr>`;
}


// =========================================
// 12. TAMPIL DATA PEMINJAMAN
// =========================================

function renderLoans() {

    document.getElementById("loan-list").innerHTML =

        loans.map(loan => {

            const member = members.find(item => item.id === loan.memberId);
            const book = books.find(item => item.id === loan.bookId);

            return `
                <tr>
                    <td>PN${String(loan.id).padStart(3, "0")}</td>
                    <td>${escapeHTML(member?.name || "Anggota dihapus")}</td>
                    <td>${escapeHTML(book?.title || "Buku dihapus")}</td>
                    <td>${formatDate(loan.date)}</td>
                    <td>${formatDate(loan.dueDate)}</td>
                    <td>${getLoanStatus(loan)}</td>
                    <td>
                        ${loan.status === "Dipinjam" ?
                    `<button class="action-btn return-btn"
                                onclick="returnBook(${loan.id})">
                                Kembalikan
                            </button>`
                    : "-"}
                    </td>
                </tr>
            `;

        }).join("") ||

        `<tr>
            <td colspan="7" class="empty-state">
                Belum ada peminjaman.
            </td>
        </tr>`;
}


// =========================================
// 13. RIWAYAT PENGEMBALIAN
// =========================================

function renderReturns() {

    document.getElementById("return-list").innerHTML =

        returns.map(item => {

            const member = members.find(member => member.id === item.memberId);
            const book = books.find(book => book.id === item.bookId);

            return `
                <tr>
                    <td>PN${String(item.id).padStart(3, "0")}</td>
                    <td>${escapeHTML(member?.name || "Anggota")}</td>
                    <td>${escapeHTML(book?.title || "Buku")}</td>
                    <td>${formatDate(item.date)}</td>
                    <td>
                        <span class="status status-returned">
                            Dikembalikan
                        </span>
                    </td>
                </tr>
            `;

        }).join("") ||

        `<tr>
            <td colspan="5" class="empty-state">
                Belum ada pengembalian.
            </td>
        </tr>`;
}


// =========================================
// 14. RENDER SELURUH HALAMAN
// =========================================

function renderAll() {

    renderDashboard();

    renderBooks(
        document.getElementById("search-book").value
    );

    renderMembers();

    renderLoans();

    renderReturns();
}


// =========================================
// 15. PENCARIAN BUKU
// =========================================

document.getElementById("search-book").addEventListener("input", function () {
    renderBooks(this.value);
});


// =========================================
// 16. TANGGAL DASHBOARD
// =========================================

document.getElementById("current-date").textContent =

    new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });


// =========================================
// 17. INISIALISASI APLIKASI
// =========================================

saveData();
renderAll();

console.log("BookTrack berhasil dijalankan!");
