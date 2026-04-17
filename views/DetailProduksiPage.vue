<script setup>
import { ref, onMounted, computed } from 'vue';
import MenuChoices from '../components/MenuChoices.vue';
import getHeaders from '../utils/headers';


const barangId = ref(null);
const barangNama = ref('');
const tanggalProduksi = ref('');
const jumlahProduksi = ref(null);
const details = ref([]);
const showKonfirmasi = ref(false);

// Data untuk dropdown
const bahanList = ref([]);
const satuanList = ref([]);

// Search dropdown bahan & focus state
const searchQueryBahan = ref({});
const focusedBahanIndex = ref(null);

const kembali = () => window.history.back();

onMounted(async () => {
    const pending = sessionStorage.getItem('pendingProduksi');
    if (pending) {
        try {
            const parsed = JSON.parse(pending);
            barangId.value = parsed.barang_id || null;
            barangNama.value = parsed.barang_nama || '';
            tanggalProduksi.value = parsed.tanggal_produksi || '';
            jumlahProduksi.value = parsed.jumlah_produksi || null;
        } catch (e) {
            console.error('Invalid pendingProduksi', e);
        }
    }
    loadBahan();
    loadSatuan();
});

const loadBahan = async () => {
    try {
        
        const res = await fetch('http://localhost:8700/api/bahan', {headers: getHeaders()});
        const json = await res.json();
        if (json.success) bahanList.value = json.data;
    } catch (err) {
        console.error('Error loading bahan:', err);
    }
};

const loadSatuan = async () => {
    try {
        const res = await fetch('http://localhost:8700/api/satuan', {headers: getHeaders()});
        const json = await res.json();
        if (json.success) satuanList.value = json.data;
    } catch (err) {
        console.error('Error loading satuan:', err);
    }
};

const filteredBahan = (index) => {
    const query = (searchQueryBahan.value[index] || '').toLowerCase();
    return bahanList.value.filter((b) =>
        (b.nama_bahan || '').toLowerCase().includes(query)
    );
};

const showDropdownBahan = (index) => {
    if (focusedBahanIndex.value !== index) return false;
    return filteredBahan(index).length > 0;
};

const selectBahan = (index, bahan) => {
    searchQueryBahan.value[index] = bahan.nama_bahan;
    details.value[index].selectedBahan = bahan;
    details.value[index].bahan_baku_id = bahan.id;
    focusedBahanIndex.value = null;
};

const clearBahan = (index) => {
    searchQueryBahan.value[index] = '';
    details.value[index].selectedBahan = null;
    details.value[index].bahan_baku_id = null;
    focusedBahanIndex.value = index;
};

const onFocusBahan = (index) => {
    focusedBahanIndex.value = index;
};

const onBlurBahan = () => {
    setTimeout(() => {
        focusedBahanIndex.value = null;
    }, 200);
};

const addDetail = () => {
    details.value.push({
        bahan_baku_id: null,
        selectedBahan: null,
        jumlah_bahan_baku: null,
        satuan_id: null,
        total_harga_bahan: null,
    });
    searchQueryBahan.value[details.value.length - 1] = '';
};

const removeDetail = (index) => {
    details.value.splice(index, 1);
    // Rebuild search query map after removing
    const newSearch = {};
    details.value.forEach((_, i) => {
        newSearch[i] = searchQueryBahan.value[i] || '';
    });
    searchQueryBahan.value = newSearch;
    if (focusedBahanIndex.value === index) {
        focusedBahanIndex.value = null;
    }
};

const konfirmasi = async () => {
    if (!barangId.value) {
        alert('barang_id tidak ditemukan. Kembali dan pilih produk.');
        return;
    }
    if (!tanggalProduksi.value) {
        alert('tanggal_produksi diperlukan');
        return;
    }
    if (!jumlahProduksi.value) {
        alert('jumlah_produksi diperlukan');
        return;
    }
    if (!details.value.length) {
        alert('Tambahkan minimal 1 detail produksi');
        return;
    }

    // basic validation for details - gunakan explicit null check
    for (let i = 0; i < details.value.length; i++) {
        const d = details.value[i];
        if (
            d.bahan_baku_id === null || d.bahan_baku_id === undefined ||
            d.jumlah_bahan_baku === null || d.jumlah_bahan_baku === undefined ||
            d.satuan_id === null || d.satuan_id === undefined ||
            d.total_harga_bahan === null || d.total_harga_bahan === undefined
        ) {
            alert(`Isi semua field pada detail produksi (baris ${i + 1})`);
            return;
        }
        // Cek nilai > 0 untuk jumlah dan harga
        if (d.jumlah_bahan_baku <= 0) {
            alert(`Jumlah bahan harus lebih dari 0 (baris ${i + 1})`);
            return;
        }
        if (d.total_harga_bahan < 0) {
            alert(`Total harga bahan tidak boleh negatif (baris ${i + 1})`);
            return;
        }
    }

    const payload = {
        barang_id: Number(barangId.value),
        tanggal_produksi: tanggalProduksi.value,
        jumlah_produksi: Number(jumlahProduksi.value),
        detail_produksi: details.value.map((d) => ({
            bahan_baku_id: Number(d.bahan_baku_id),
            jumlah_bahan_baku: Number(d.jumlah_bahan_baku),
            satuan_id: Number(d.satuan_id),
            total_harga_bahan: Number(d.total_harga_bahan),
        })),
    };

    try {
        const res = await fetch('http://localhost:8700/api/produksi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }, {headers:getHeaders()});
        const json = await res.json();
        if (res.ok && json.success) {
            sessionStorage.removeItem('pendingProduksi');
            alert('Produksi berhasil disimpan');
            window.location.href = '/produksi';
        } else {
            throw new Error(json.message || 'Gagal menyimpan produksi');
        }
    } catch (err) {
        alert('Error: ' + (err.message || err));
    }
};
</script>
<template>
    <MenuChoices />
    <div class="input-group">
        <div class="info-section">
            <p><strong>Produk:</strong> {{ barangNama || '—' }}</p>
            <p><strong>Tanggal Produksi:</strong> {{ tanggalProduksi || '—' }}</p>
            <p><strong>Jumlah Produksi:</strong> {{ jumlahProduksi || '—' }} unit</p>
        </div>

        <h4 style="margin-top: 20px; margin-bottom: 12px; font-size: 15px; font-weight: 600;">Detail Bahan Baku</h4>
        
        <div v-for="(d, i) in details" :key="i" class="detail-card">
            <!-- Bahan Baku dengan Dropdown Search -->
            <div class="detail-group">
                <label for="bahan" class="label">Bahan Baku</label>
                <div class="input-wrapper">
                    <input 
                        type="text" 
                        placeholder="Cari bahan baku..."
                        v-model="searchQueryBahan[i]"
                        @focus="onFocusBahan(i)"
                        @blur="onBlurBahan"
                        class="search-input"
                    />
                    <button 
                        v-if="d.selectedBahan"
                        @click="clearBahan(i)"
                        class="btn-clear"
                        type="button"
                        title="Hapus pilihan"
                    >
                        ✕
                    </button>
                    <ul v-if="showDropdownBahan(i)" class="dropdown">
                        <li v-for="bahan in filteredBahan(i)" :key="bahan.id" @click="selectBahan(i, bahan)">
                            {{ bahan.nama_bahan }}
                        </li>
                    </ul>
                </div>
                <p v-if="d.selectedBahan" class="selected-info">
                    ✓ {{ d.selectedBahan.nama_bahan }}
                </p>
            </div>

          

            <!-- Satuan dengan Dropdown Select -->
            <div class="detail-group">
                <label for="satuan" class="label">Satuan</label>
                <select v-model.number="d.satuan_id" class="select-field">
                    <option :value="null">Pilih Satuan</option>
                    <option v-for="satuan in satuanList" :key="satuan.id" :value="satuan.id">
                        {{ satuan.nama_satuan }}
                    </option>
                </select>
            </div>
              <!-- Jumlah Bahan per stuan -->
            <div class="detail-group">
                <label for="jumlah" class="label">Jumlah Bahan Per Satuan</label>
                <input 
                    type="number" 
                    v-model.number="d.jumlah_bahan_baku" 
                    placeholder="Jumlah bahan"
                    min="1"
                    class="input-field"
                />
            </div>

            <!-- Total Harga Bahan -->
            <div class="detail-group">
                <label for="total" class="label">Total Harga Bahan</label>
                <input 
                    type="number" 
                    v-model.number="d.total_harga_bahan" 
                    placeholder="Total harga bahan"
                    min="0"
                    class="input-field"
                />
            </div>

            <!-- Tombol Hapus -->
            <button class="btn-remove" @click="removeDetail(i)">
                <span>🗑 Hapus</span>
            </button>
        </div>

        <!-- Tombol Tambah Detail -->
        <button class="btn-add-detail" @click="addDetail">
            <span>+ Tambah Bahan</span>
        </button>
    </div>
    <div class="button-group">
        <button @click="kembali" class="btn-secondary">Kembali</button>
        <button @click="showKonfirmasi = true" class="btn-primary">Simpan Produksi</button>
    </div>

    <div v-if="showKonfirmasi === true" class="konfirmasiLanjut" @click.self="showKonfirmasi = false">
        <div class="konfirmasi">
            <h3>Konfirmasi Penyimpanan</h3>
            <p>Apakah Anda yakin ingin menyimpan data produksi ini?</p>
            <p style="font-size: 13px; color: #6b7280; margin-top: 8px;">
                Aksi tidak dapat dibatalkan atau diubah setelah disimpan.
            </p>
            <div class="konfirmasi-actions">
                <button class="btn btn-secondary" @click="showKonfirmasi = false">Batal</button>
                <button class="btn btn-primary" @click="konfirmasi">Ya, Simpan</button>
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

/* Detail Card */
.detail-card {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 12px;
    position: relative;
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

/* Input & Select Field */
.input-field,
.select-field {
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
.select-field:focus {
    border-color: #9ca3af;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.select-field {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 18px;
    padding-right: 38px;
    color: #1f2937;
}

/* Remove Button */
.btn-remove {
    width: 100%;
    margin-top: 12px;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #FCA5A5;
    background: #FEE2E2;
    color: #DC2626;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.btn-remove:hover {
    background: #FEE2E2;
    border-color: #F87171;
}

.btn-remove:active {
    transform: scale(0.97);
}

/* Add Detail Button */
.btn-add-detail {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: 2px dashed #E5E7EB;
    background: #FFFFFF;
    color: #4b5563;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 12px;
}

.btn-add-detail:hover {
    border-color: #1f2937;
    background: #F9FAFB;
    color: #1f2937;
}

.btn-add-detail:active {
    transform: scale(0.97);
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

.btn-primary:hover {
    background: #1f2937;
}

.btn-primary:active {
    transform: scale(0.97);
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


    .button-group {
        width: calc(100% - 40px);
        bottom: 20px;
    }
.btn-primary {
    background: rgb(45, 15, 15);
    color: #F8F9FA;
}

    </style>