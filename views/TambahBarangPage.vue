<script setup>
import { onMounted, ref } from 'vue';
import MenuChoices from '../components/MenuChoices.vue';

const namaBarang = ref('');
const isSubmitting = ref(false);
const barangList = ref([]);

onMounted(() => {
  loadBarang();
});

const loadBarang = async () => {
  try {
    const res = await fetch('http://localhost:8700/api/barang');
    const json = await res.json();
    if (json.success) {
      barangList.value = json.data || [];
    }
  } catch (err) {
    console.error('Error loading barang:', err);
  }
};

const simpanBarang = async () => {
  const value = (namaBarang.value || '').trim();
  if (!value) {
    alert('Nama barang harus diisi.');
    return;
  }

  try {
    isSubmitting.value = true;
    const res = await fetch('http://localhost:8700/api/barang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_barang: value }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      alert('Barang berhasil ditambahkan.');
      namaBarang.value = '';
      await loadBarang();
      return;
    }

    throw new Error(json.message || 'Gagal menambahkan barang.');
  } catch (err) {
    alert(`Gagal menambahkan barang: ${err.message || err}`);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <MenuChoices />

  <div class="page-wrap">
    <section class="form-card">
      <h1>Tambah Barang</h1>
      <p class="subtitle">Input barang baru yang akan diproduksi atau dijual.</p>

      <form @submit.prevent="simpanBarang" class="form-grid">
        <label for="namaBarang" class="label">Nama Barang</label>
        <input
          id="namaBarang"
          v-model="namaBarang"
          type="text"
          placeholder="Contoh: Roti Cokelat"
          class="input-field"
          autocomplete="off"
        />

        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Barang' }}
        </button>
      </form>
    </section>

    <section class="list-card">
      <h2>Daftar Barang</h2>
      <table v-if="barangList.length > 0" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama Barang</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in barangList" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.nama_barang }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-state">Belum ada data barang.</p>
    </section>
  </div>
</template>

<style scoped>
.page-wrap {
  max-width: 960px;
  margin: 24px auto;
  padding: 0 16px 24px;
  display: grid;
  gap: 20px;
}

.form-card,
.list-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

h1 {
  margin: 0;
  font-size: 24px;
  color: #111827;
}

.subtitle {
  margin: 8px 0 18px;
  color: #6b7280;
  font-size: 14px;
}

h2 {
  margin: 0 0 14px;
  font-size: 18px;
  color: #111827;
}

.form-grid {
  display: grid;
  gap: 10px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #4b5563;
}

.input-field {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.input-field:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.btn-primary {
  margin-top: 6px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: #111827;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.data-table th {
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-state {
  margin: 0;
  color: #9ca3af;
  font-size: 14px;
}
</style>
