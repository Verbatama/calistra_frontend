<script setup>
import { ref, computed, onMounted } from 'vue';
import MenuChoices from '../components/MenuChoices.vue';
import flatpickr from 'flatpickr';
import "flatpickr/dist/flatpickr.css";
import getHeaders from '../utils/headers';

const inputRef = ref(null);
const searchQuery = ref('');
const selectedProduk = ref(null);
const listProduk = ref([]);
const penjualanList = ref([]);
const showKonfirmasi = ref(false);

// Focus state untuk dropdown
const focusedDropdown = ref(false);

const jumlahTerjual = ref(null);
const hargaPerPCS = ref(null);

onMounted(() => {
  flatpickr(inputRef.value, {
    dateFormat: "Y-m-d",
    disableMobile: "true",
  });
  loadBarangs();
  loadPenjualan();
});

const loadBarangs = async () => {
  try {
    const res = await fetch('http://localhost:8700/api/barang/stok/all', {headers:getHeaders()});
    const json = await res.json();
    if (json.success) listProduk.value = json.data;
  } catch (err) {
    console.error('Error loading barang:', err);
  }
};

const loadPenjualan = async () => {
  try {
    const res = await fetch('http://localhost:8700/api/penjualan', {headers:getHeaders()});
    const json = await res.json();
    if (json.success) penjualanList.value = json.data;
  } catch (err) {
    console.error('Error loading penjualan:', err);
  }
};

const filteredProduk = computed(() => {
  const query = (searchQuery.value || '').toLowerCase();
  return listProduk.value.filter((produk) =>
    (produk.nama_barang || '').toLowerCase().includes(query)
  );
});

const showDropdown = computed(() => {
  if (!focusedDropdown.value) return false;
  return filteredProduk.value.length > 0;
});

const selectProduk = (produk) => {
  selectedProduk.value = produk;
  searchQuery.value = produk.nama_barang;
  focusedDropdown.value = false;
};

const clearProduk = () => {
  searchQuery.value = '';
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

const isStokCukup = computed(() => {
  if (!selectedProduk.value || !jumlahTerjual.value) return true;
  return jumlahTerjual.value <= (selectedProduk.value.stok_tersedia || 0);
});

const stokWarning = computed(() => {
  if (!selectedProduk.value) return '';
  const stok = selectedProduk.value.stok_tersedia || 0;
  if (jumlahTerjual.value > stok) {
    return `⚠ Jumlah penjualan (${jumlahTerjual.value}) melebihi stok teersedia (${stok})`;
  }
  return '';
});

const kembali = () => window.history.back();

const handleKonfirmasi = async () => {
  // Validasi pilih produk
  if (!selectedProduk.value) {
    alert('Silakan pilih produk terlebih dahulu.');
    return;
  }

  // Validasi jumlah terjual
  if (
    jumlahTerjual.value === null || 
    jumlahTerjual.value === undefined
  ) {
    alert('Jumlah produk terjual harus diisi.');
    return;
  }
  if (jumlahTerjual.value <= 0) {
    alert('Jumlah produk terjual harus lebih dari 0.');
    return;
  }

  // Validasi stok tersedia
  const stokTersedia = selectedProduk.value.stok_tersedia || 0;
  if (jumlahTerjual.value > stokTersedia) {
    alert(`Jumlah penjualan (${jumlahTerjual.value}) melebihi stok tersedia (${stokTersedia}). Transaksi dibatalkan.`);
    return;
  }

  // Validasi harga per PCS
  if (
    hargaPerPCS.value === null || 
    hargaPerPCS.value === undefined
  ) {
    alert('Harga per PCS harus diisi.');
    return;
  }
  if (hargaPerPCS.value < 0) {
    alert('Harga per PCS tidak boleh negatif.');
    return;
  }

  // Validasi tanggal
  if (!inputRef.value?.value) {
    alert('Pilih tanggal penjualan');
    return;
  }

  const payload = {
    barang_id: Number(selectedProduk.value.id),
    tanggal_penjualan: inputRef.value.value,
    detail_penjualan: [
      {
        jumlah_barang_terjual: Number(jumlahTerjual.value),
        harga_jual: Number(hargaPerPCS.value),
      },
    ],
  };

  try {
    const res = await fetch('http://localhost:8700/api/penjualan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, {headers:getHeaders()});
    const json = await res.json();
    if (res.ok && json.success) {
      alert('Penjualan berhasil dicatat!');
      // reset form
      searchQuery.value = '';
      selectedProduk.value = null;
      jumlahTerjual.value = null;
      hargaPerPCS.value = null;
      showKonfirmasi.value = false;
      loadPenjualan();
      loadBarangs();
    } else {
      throw new Error(json.message || 'Gagal menyimpan penjualan');
    }
  } catch (err) {
    alert('Gagal menyimpan penjualan: ' + (err.message || err));
  }
};
</script>

<template>
  <MenuChoices />
  <div class="input-group">
    <h4 style="margin-bottom: 12px; font-size: 15px; font-weight: 600;">Input Penjualan</h4>

    <!-- Search Produk -->
    <div class="detail-group">
      <label class="label">Pilih Produk</label>
      <div class="input-wrapper">
        <input 
          type="text" 
          v-model="searchQuery" 
          @focus="onFocusSearch"
          @blur="onBlurSearch"
          placeholder="Cari produk..."
          class="search-input"
        >
        <button 
          v-if="selectedProduk"
          @click="clearProduk"
          class="btn-clear"
          type="button"
          title="Hapus pilihan"
        >
          ✕
        </button>
        <ul v-if="showDropdown" class="dropdown">
          <li v-for="produk in filteredProduk" :key="produk.id" @click="selectProduk(produk)">
            {{ produk.nama_barang }}
          </li>
        </ul>
      </div>
      <p v-if="selectedProduk" class="selected-info">
        ✓ {{ selectedProduk.nama_barang }}
      </p>
    </div>

    <!-- Info Produk Terpilih -->
    <div v-if="selectedProduk" class="info-section">
      <p><strong>Stok Tersedia:</strong> <span class="stok-value">{{ selectedProduk.stok_tersedia || 0 }} unit</span></p>
      <p v-if="selectedProduk.harga"><strong>Harga Dasar:</strong> Rp {{ selectedProduk.harga.toLocaleString() }}</p>
    </div>

    <!-- Jumlah Terjual -->
    <div class="detail-group">
      <label class="label">Jumlah Produk Terjual</label>
      <input 
        type="number" 
        v-model.number="jumlahTerjual" 
        placeholder="Jumlah produk terjual"
        min="1"
        class="input-field"
      >
      <p v-if="stokWarning" class="stok-warning">{{ stokWarning }}</p>
    </div>

    <!-- Tanggal Penjualan -->
    <div class="detail-group">
      <label class="label">Tanggal Penjualan</label>
      <div class="date-wrapper">
        <input 
          ref="inputRef" 
          class="date-input" 
          placeholder="Tanggal Penjualan"
        >
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="icon-svg" focusable="false">
            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10ZM6 7a1 1 0 0 0-1 1v1h14V8a1 1 0 0 0-1-1H6Z" />
          </svg>
        </span>
      </div>
    </div>

    <!-- Harga Per PCS -->
    <div class="detail-group">
      <label class="label">Harga Per PCS</label>
      <input 
        type="number" 
        v-model.number="hargaPerPCS" 
        placeholder="Harga per PCS"
        min="0"
        class="input-field"
      >
    </div>
  </div>

  <div class="button-group">
    <button @click="kembali" class="btn-secondary">Kembali</button>
    <button 
      @click="showKonfirmasi = true" 
      class="btn-primary"
      :disabled="!isStokCukup"
      :title="!isStokCukup ? 'Stok tidak cukup. Periksa kembali jumlah penjualan.' : 'Simpan data penjualan'"
    >
      Simpan Penjualan
    </button>
  </div>

  <div v-if="showKonfirmasi === true" class="konfirmasiLanjut" @click.self="showKonfirmasi = false">
    <div class="konfirmasi">
      <h3>Konfirmasi Penjualan</h3>
      <p>Apakah Anda yakin ingin menyimpan data penjualan ini?</p>
      <p style="font-size: 13px; color: #6b7280; margin-top: 8px;">
        Aksi tidak dapat dibatalkan atau diubah setelah disimpan.
      </p>
      <div class="konfirmasi-actions">
        <button class="btn btn-secondary" @click="showKonfirmasi = false">Batal</button>
        <button class="btn btn-primary" @click="handleKonfirmasi">Ya, Simpan</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base Layout */
.input-group {
  width: 100%;
  max-width: 420px;
  margin: 50px auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  padding-bottom: 20px;
}

/* Info Section */
.info-section {
  background: #F0F4F8;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  margin-bottom: 12px;
}

.info-section p {
  margin: 6px 0;
  font-size: 14px;
  color: #2d0f0f;
}

.info-section strong {
  color: #1f2937;
}

.stok-value {
  font-weight: 700;
  color: #047857;
  font-size: 15px;
}

/* Detail Group */
.detail-group {
  margin-bottom: 12px;
  position: relative;
}

.detail-group:last-of-type {
  margin-bottom: 0;
}

.label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Input Wrapper for Dropdown */
.input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  padding-right: 38px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 14px;
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: #9ca3af;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

/* Clear Button */
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-clear:hover {
  color: #dc2626;
}

/* Dropdown */
.dropdown {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  z-index: 20;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown li {
  padding: 10px 14px;
  margin-left: 0;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  list-style: none;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown li:last-child {
  border-bottom: none;
}

.dropdown li:hover {
  background: #f3f4f6;
}

/* Selected Info */
.selected-info {
  font-size: 12px;
  color: #059669;
  margin-top: 6px;
  font-weight: 500;
}

/* Stok Warning */
.stok-warning {
  font-size: 12px;
  color: #dc2626;
  margin-top: 6px;
  font-weight: 500;
  background: #fee2e2;
  padding: 8px;
  border-radius: 8px;
  border-left: 3px solid #dc2626;
}

/* Input & Date Field */
.input-field,
.date-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 14px;
  transition: all 0.2s ease;
  outline: none;
  font-family: inherit;
}

.input-field:focus,
.date-input:focus {
  border-color: #9ca3af;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

/* Date Wrapper */
.date-wrapper {
  position: relative;
  display: block;
  width: 100%;
}

.date-input {
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

/* Button Group */
.button-group {
  max-width: 420px;
  margin: 20px auto 0;
  display: flex;
  gap: 10px;
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 400px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #111827;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1f2937;
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background: #DDE7F0;
  color: rgb(45, 15, 15);
  border: 1px solid #E9ECEF;
}

.btn-secondary:hover {
  background: #E4EEF5;
}

.btn-secondary:active {
  transform: scale(0.97);
}

/* Konfirmasi Modal */
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
  background: #F8F9FA;
  border: 1px solid #E9ECEF;
  border-radius: 16px;
  padding: 20px;
  color: rgb(45, 15, 15);
  box-shadow: 0 12px 24px rgba(45, 15, 15, 0.12);
}

.konfirmasi h3 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.konfirmasi p {
  margin: 8px 0;
  font-size: 14px;
  color: #4b5563;
}

.konfirmasi-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
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

/* Responsive */
@media (max-width: 480px) {
  .input-group {
    margin: 40px auto 120px;
    max-width: 100%;
    padding: 0 20px;
  }

  .button-group {
    width: calc(100% - 40px);
    bottom: 20px;
  }
}
</style>