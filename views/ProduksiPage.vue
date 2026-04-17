<script setup>
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { onMounted, ref, computed } from "vue";
import MenuChoices from "../components/MenuChoices.vue";
import getHeaders from "../utils/headers";
const inputRef = ref(null);
const searchQuery = ref("");
const selectedProduk = ref(null);
const listProduk = ref([]);
const jumlahProduksi = ref(null);
const produksiList = ref([]);
const focusedDropdown = ref(false);
const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(() => {
    flatpickr(inputRef.value, {
        dateFormat: "Y-m-d",
        disableMobile: "true",
    });
    loadProduksi();
    loadBarangs();
});

const loadBarangs = async () => {
    try {
        const res = await fetch("http://localhost:8700/api/barang", {headers:getHeaders()});
        const json = await res.json();
        if (json.success) listProduk.value = json.data;
    } catch (err) {
        console.error(err);
    }
};

const filteredProduk = computed(() => {
    const q = (searchQuery.value || "").toLowerCase();
    if (!q) return listProduk.value;
    return listProduk.value.filter((p) => (p.nama_barang || "").toLowerCase().includes(q));
});

const showDropdown = computed(() => {
    if (!focusedDropdown.value) return false;
    return filteredProduk.value.length > 0;
});

const selectProduk = (p) => {
    selectedProduk.value = p;
    searchQuery.value = p.nama_barang;
    focusedDropdown.value = false;
};

const clearProduk = () => {
    searchQuery.value = "";
    selectedProduk.value = null;
    focusedDropdown.value = true;
};

const onFocusSearch = () => {
    focusedDropdown.value = true;
};

const onBlurSearch = () => {
    setTimeout(() => {
        focusedDropdown.value = false;
    }, 200);
};

const loadProduksi = async () => {
    try {
        const res = await fetch("http://localhost:8700/api/produksi", {headers:getHeaders()});
        const json = await res.json();
        if (json.success) {
            produksiList.value = json.data;
            currentPage.value = 1;
        }
    } catch (err) {
        console.error(err);
    }
};

const kembali = () => window.history.back();

const lanjut = () => {
    if (!selectedProduk.value) {
        alert("Pilih produk terlebih dahulu");
        return;
    }
    if (!inputRef.value?.value) {
        alert("Pilih tanggal produksi");
        return;
    }
    if (!jumlahProduksi.value || jumlahProduksi.value <= 0) {
        alert("Masukkan jumlah produksi yang valid");
        return;
    }
    const pending = {
        barang_id: Number(selectedProduk.value.id),
        barang_nama: selectedProduk.value.nama_barang,
        tanggal_produksi: inputRef.value.value,
        jumlah_produksi: Number(jumlahProduksi.value),
    };
    sessionStorage.setItem("pendingProduksi", JSON.stringify(pending));
    window.location.href = "/detail-produksi";
};

const formatDateLabel = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("id-ID");
};

const produksiLogs = computed(() => {
    return (produksiList.value || [])
        .map((item) => {
            const details = Array.isArray(item.detail_produksi) ? item.detail_produksi : [];
            const total_biaya = details.reduce(
                (sum, detail) => sum + Number(detail.total_harga_bahan || 0),
                0,
            );

            return {
                id: item.id,
                kode_produksi: item.kode_produksi || `PRD-${item.id}`,
                label_tanggal: formatDateLabel(item.tanggal_produksi || item.tanggal),
                jumlah_produksi: Number(item.jumlah_produksi || 0),
                total_biaya,
                timestamp: item.tanggal_produksi ? new Date(item.tanggal_produksi).getTime() : 0,
            };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
});

const totalLogProduksi = computed(() => {
    return produksiLogs.value.reduce(
        (acc, item) => {
            acc.total_biaya += item.total_biaya || 0;
            acc.jumlah_produksi += item.jumlah_produksi || 0;
            return acc;
        },
        { total_biaya: 0, jumlah_produksi: 0 },
    );
});

const totalPages = computed(() => {
    return Math.max(1, Math.ceil(produksiLogs.value.length / itemsPerPage));
});

const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return produksiLogs.value.slice(start, end);
});

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};
</script>

<template>
    <MenuChoices />
    <div class="input-group">
        <div class="input-wrapper">
            <input
                type="text"
                v-model="searchQuery"
                @focus="onFocusSearch"
                @blur="onBlurSearch"
                placeholder="Cari Produk ..."
                class="search-input"
            />
            <button
                v-if="selectedProduk"
                @click="clearProduk"
                class="btn-clear"
                type="button"
                title="Hapus pilihan"
            >
                ✕
            </button>
        </div>
        <ul v-if="showDropdown" class="dropdown">
            <li v-for="p in filteredProduk" :key="p.id" @click="selectProduk(p)">
                {{ p.nama_barang }}
            </li>
        </ul>

        <div v-if="selectedProduk">
            <p>Produk Terpilih: {{ selectedProduk.nama_barang }}</p>
        </div>

        <div class="date-wrapper">
            <input ref="inputRef" class="date-input" placeholder="Tanggal Produksi" />
            <span class="icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" class="icon-svg" focusable="false">
                    <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10ZM6 7a1 1 0 0 0-1 1v1h14V8a1 1 0 0 0-1-1H6Z" />
                </svg>
            </span>
        </div>
        <input type="number" v-model.number="jumlahProduksi" placeholder="Jumlah Produksi" />
    </div>
    <div class="button-group">
        <button @click="kembali">Kembali</button>
        <button @click="lanjut">Lanjut</button>
    </div>

    <div v-if="produksiLogs.length > 0" class="table-container">
        <div class="table-header">
            <h2>📋 Log Produksi (POST API)</h2>
        </div>

        <div class="table-info">
            <div class="info-item">
                <span class="info-label">Total Biaya Bahan Log:</span>
                <span class="info-value">{{ formatCurrency(totalLogProduksi.total_biaya) }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Total Unit Produksi Log:</span>
                <span class="info-value">{{ formatNumber(totalLogProduksi.jumlah_produksi) }} unit</span>
            </div>
        </div>

        <table class="sales-table">
            <thead>
                <tr>
                    <th>Kode Produksi</th>
                    <th>Tanggal Produksi</th>
                    <th>Total Biaya Bahan</th>
                    <th>Jumlah Produksi</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in paginatedData" :key="item.id" class="table-row">
                    <td class="code-cell">{{ item.kode_produksi }}</td>
                    <td class="date-cell">{{ item.label_tanggal }}</td>
                    <td class="amount-cell">{{ formatCurrency(item.total_biaya) }}</td>
                    <td class="unit-cell">{{ formatNumber(item.jumlah_produksi) }} unit</td>
                </tr>
            </tbody>
        </table>

        <div v-if="produksiLogs.length > itemsPerPage" class="pagination">
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="pagination-btn">
                ← Sebelumnya
            </button>
            <div class="pagination-info">Halaman {{ currentPage }} dari {{ totalPages }}</div>
            <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
            >
                Berikutnya →
            </button>
        </div>
    </div>

    <div v-else class="no-data">
        <p>Belum ada log produksi. Tabel akan muncul setelah ada POST ke API produksi.</p>
    </div>
</template>

<style scoped>
.date-wrapper {
  position: relative;
    display: block;
  width: 100%;
}

.date-input {
    width: 100%;
    display: block;
    box-sizing: border-box;
    padding-right: 40px;
}

.date-wrapper .icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
    color: #9ca3af;
    opacity: 0.8;
}

.icon-svg {
    width: 18px;
    height: 18px;
    display: block;
    fill: currentColor;
}
.input-group {
    width: 100%;
    max-width: 420px;
    margin: 50px auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
}

.search-input,
.date-input,
input[type="number"] {
    box-sizing: border-box;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    font-size: 14px;
    transition: all 0.2s ease;
    outline: none;
}

.search-input:focus,
.date-input:focus,
input[type="number"]:focus {
    border-color: #9ca3af;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
    position: relative;
}

.search-input {
    width: 100%;
    padding-right: 38px;
}

.btn-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    transition: color 0.2s ease;
}

.btn-clear:hover {
    color: #dc2626;
}

.dropdown {
    position: absolute;
    top: 50px;
    width: 100%;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    z-index: 10;
}

.dropdown li {
    padding: 10px 14px;
    margin-left: 0;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s ease;
    list-style: none;
}

.dropdown li:hover {
    background: #f3f4f6;
}

.button-group {
    max-width: 420px;
    margin: 10px auto 0;
    display: flex;
    gap: 10px;
}

.button-group > button {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    border: none;
    background: #111827;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.button-group > button:active {
    transform: scale(0.97);
}

.konfirmasiLanjut {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(45, 15, 15, 0.2);
    z-index: 1000;
}

.konfirmasi {
    width: 100%;
    max-width: 420px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 16px;
    padding: 18px;
    color: rgb(45, 15, 15);
    box-shadow: 0 12px 24px rgba(45, 15, 15, 0.12);
}

.konfirmasi h3 {
    margin: 0 0 8px;
    font-size: 16px;
}

.konfirmasi p {
    margin: 6px 0;
    font-size: 14px;
}

.konfirmasi-actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
}

.btn {
    flex: 1;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid transparent;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
}

.btn:hover {
    filter: brightness(0.98);
}

.btn-secondary {
    background: #dde7f0;
    color: rgb(45, 15, 15);
    border-color: #e9ecef;
}

.btn-primary {
    background: rgb(45, 15, 15);
    color: #f8f9fa;
}

.table-container {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    margin: 40px auto;
    width: 100%;
    max-width: 1100px;
}

.table-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

.table-info {
    display: flex;
    gap: 30px;
    margin: 20px 0 30px 0;
    padding: 15px 20px;
    background: #f9fafb;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
    flex-wrap: wrap;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.info-label {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-value {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
}

.sales-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.sales-table thead {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
}

.sales-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sales-table tbody tr {
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.2s ease;
}

.sales-table tbody tr:hover {
    background-color: #f9fafb;
}

.sales-table td {
    padding: 16px;
    font-size: 14px;
    color: #1f2937;
}

.code-cell {
    font-weight: 600;
    color: #1d4ed8;
}

.date-cell {
    font-weight: 500;
    color: #374151;
}

.amount-cell {
    font-weight: 600;
    color: #10b981;
}

.unit-cell {
    color: #6b7280;
}

.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 20px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
}

.pagination-btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: 2px solid #e5e7eb;
    background: white;
    color: #6b7280;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
}

.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination-info {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    min-width: 120px;
    text-align: center;
}

.no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    font-size: 16px;
    color: #9ca3af;
}

@media (max-width: 768px) {
    .table-container {
        padding: 18px;
        margin: 24px 12px;
    }

    .table-info {
        gap: 16px;
    }

    .sales-table th,
    .sales-table td {
        padding: 10px;
        font-size: 12px;
    }
}
</style>
