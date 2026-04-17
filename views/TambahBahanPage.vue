<script setup>
import { onMounted, ref } from 'vue';
import MenuChoices from '../components/MenuChoices.vue';
import getHeaders from '../utils/headers';

const namaBahan = ref('');
const isSubmitting = ref(false);
const bahanList = ref([]);

onMounted(() => {
  loadBahan();
});

const loadBahan = async () => {
  try {
    const res = await fetch('http://localhost:8700/api/bahan', {headers:getHeaders()});
    const json = await res.json();
    if (json.success) {
      bahanList.value = json.data || [];
    }
  } catch (err) {
    console.error('Error loading bahan:', err);
  }
};

const simpanBahan = async () => {
  const value = (namaBahan.value || '').trim();
  if (!value) {
    alert('Nama bahan harus diisi.');
    return;
  }

  try {
    isSubmitting.value = true;
    const res = await fetch('http://localhost:8700/api/bahan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_bahan: value }),
    }, {headers:getHeaders()});

    const json = await res.json();
    if (res.ok && json.success) {
      alert('Bahan berhasil ditambahkan.');
      namaBahan.value = '';
      await loadBahan();
      return;
    }

    throw new Error(json.message || 'Gagal menambahkan bahan.');
  } catch (err) {
    alert(`Gagal menambahkan bahan: ${err.message || err}`);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <MenuChoices />

  <div class="page-wrap">
    <section class="form-card">
      <h1>Tambah Bahan</h1>
      <p class="subtitle">Input bahan baku baru untuk kebutuhan produksi.</p>

      <form @submit.prevent="simpanBahan" class="form-grid">
        <label for="namaBahan" class="label">Nama Bahan</label>
        <input
          id="namaBahan"
          v-model="namaBahan"
          type="text"
          placeholder="Contoh: Tepung Terigu"
          class="input-field"
          autocomplete="off"
        />

        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Bahan' }}
        </button>
      </form>
    </section>

    <section class="list-card">
      <h2>Daftar Bahan</h2>
      <table v-if="bahanList.length > 0" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama Bahan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in bahanList" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.nama_bahan }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-state">Belum ada data bahan.</p>
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
