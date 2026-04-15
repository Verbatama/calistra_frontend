<script setup>
import { ref, onMounted, computed } from 'vue';
import Card from '../components/Card.vue';
import MenuChoices from '../components/MenuChoices.vue';

const summaryData = ref(null);
const penjualanLogs = ref([]);
const isLoading = ref(false);
const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(() => {
  loadDashboardData();
});

const loadDashboardData = async () => {
  isLoading.value = true;
  currentPage.value = 1; // Reset ke page 1
  try {
    const [summaryRes, logsRes] = await Promise.all([
      fetch('http://localhost:8700/api/penjualan/summary/dashboard'),
      fetch('http://localhost:8700/api/penjualan'),
    ]);

    const summaryJson = await summaryRes.json();
    if (summaryJson.success) {
      summaryData.value = summaryJson.data;
    }

    const logsJson = await logsRes.json();
    if (logsJson.success) {
      penjualanLogs.value = (logsJson.data || [])
        .map((item) => {
          const details = Array.isArray(item.detail_penjualan) ? item.detail_penjualan : [];
          const total = details.reduce(
            (sum, detail) => sum + (Number(detail.harga_jual) * Number(detail.jumlah_barang_terjual)),
            0,
          );
          const jumlah_terjual = details.reduce(
            (sum, detail) => sum + Number(detail.jumlah_barang_terjual),
            0,
          );
          const tanggal = item.tanggal_penjualan ? new Date(item.tanggal_penjualan) : null;

          return {
            id: item.id,
            kode_penjualan: item.kode_penjualan || `PJ-${item.id}`,
            label_tanggal: formatDateLabel(tanggal),
            total,
            jumlah_terjual,
            timestamp: tanggal ? tanggal.getTime() : 0,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
    } else {
      penjualanLogs.value = [];
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    penjualanLogs.value = [];
  } finally {
    isLoading.value = false;
  }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDateTime = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
};

const formatDateLabel = (value) => {
  if (!value || Number.isNaN(value.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
};

const formatUnitTerjual = (value) => {
  // Ensure it's a number and format properly
  const num = parseInt(value) || 0;
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0 });
};

const totalLogPenjualan = computed(() => {
  return penjualanLogs.value.reduce(
    (acc, item) => {
      acc.total += item.total || 0;
      acc.jumlah_terjual += item.jumlah_terjual || 0;
      return acc;
    },
    { total: 0, jumlah_terjual: 0 },
  );
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(penjualanLogs.value.length / itemsPerPage));
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return penjualanLogs.value.slice(start, end);
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};
</script>

<template>
  <MenuChoices />
  
  <div class="dashboard-container">
    <div class="header">
      <h1>📊 Dashboard Penjualan</h1>
      <p v-if="summaryData" class="update-time">Update terakhir: {{ formatDateTime() }}</p>
    </div>

    <!-- Summary Cards -->
    <div v-if="summaryData" class="stats-grid">
      <!-- Hari ini -->
      <div class="stat-card card-blue">
        <div class="stat-header">
          <h3>📅 Hari Ini</h3>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(summaryData.hari_ini.total) }}</div>
          <!-- error update <div class="stat-subtitle">{{ formatUnitTerjual(summaryData.hari_ini.jumlah_terjual) }} unit terjual</div> -->
        </div>
      </div>

      <!-- Bulan ini -->
      <div class="stat-card card-green">
        <div class="stat-header">
          <h3>📆 Bulan Ini</h3>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(summaryData.bulan_ini.total) }}</div>
          <!-- <div class="stat-subtitle">{{ formatUnitTerjual(summaryData.bulan_ini.jumlah_terjual) }} unit terjual</div> -->
        </div>
      </div>

      <!-- Tahun ini -->
      <div class="stat-card card-purple">
        <div class="stat-header">
          <h3>📊 Tahun Ini</h3>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(summaryData.tahun_ini.total) }}</div>
          <!-- <div class="stat-subtitle">{{ formatUnitTerjual(summaryData.tahun_ini.jumlah_terjual) }} unit terjual</div> -->
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading">
      <p>⏳ Memuat data...</p>
    </div>

    <!-- Sales Log Table (berdasarkan data transaksi POST) -->
    <div v-if="summaryData && penjualanLogs.length > 0" class="table-container">
      <div class="table-header">
        <h2>📋 Log Penjualan (POST API)</h2>
      </div>
      <div class="table-info">
        <div class="info-item">
          <span class="info-label">Total Penjualan Log:</span>
          <span class="info-value">{{ formatCurrency(totalLogPenjualan.total) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Total Unit Terjual Log:</span>
          <span class="info-value">{{ formatUnitTerjual(totalLogPenjualan.jumlah_terjual) }} unit</span>
        </div>
      </div>
      <table class="sales-table">
        <thead>
          <tr>
            <th>Kode Penjualan</th>
            <th>Tanggal POST</th>
            <th>Total Penjualan</th>
            <th>Unit Terjual</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedData" :key="item.id" class="table-row">
            <td class="code-cell">{{ item.kode_penjualan }}</td>
            <td class="date-cell">{{ item.label_tanggal }}</td>
            <td class="amount-cell">{{ formatCurrency(item.total) }}</td>
            <td class="unit-cell">{{ formatUnitTerjual(item.jumlah_terjual) }} unit</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div v-if="penjualanLogs.length > itemsPerPage" class="pagination">
        <button 
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ← Sebelumnya
        </button>
        <div class="pagination-info">
          Halaman {{ currentPage }} dari {{ totalPages }}
        </div>
        <button 
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Berikutnya →
        </button>
      </div>
    </div>

    <div v-else-if="summaryData && !isLoading" class="no-data">
      <p>Belum ada log penjualan. Tabel akan muncul setelah ada POST ke API penjualan.</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.update-time {
  font-size: 12px;
  color: #9ca3af;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  border-radius: 16px;
  padding: 24px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 5px solid;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-blue {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.card-green {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
}

.card-purple {
  border-left-color: #a855f7;
  background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);
}

.stat-header {
  margin-bottom: 16px;
}

.stat-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #4b5563;
  margin: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
  word-break: break-word;
}

.stat-subtitle {
  font-size: 13px;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
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

/* Table Container */
.table-container {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 40px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.table-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
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

.date-cell {
  font-weight: 500;
  color: #374151;
}

.code-cell {
  font-weight: 600;
  color: #1d4ed8;
}

.amount-cell {
  font-weight: 600;
  color: #10b981;
}

.unit-cell {
  color: #6b7280;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #9ca3af;
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

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .header h1 {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stat-value {
    font-size: 24px;
  }

  .chart-container {
    padding: 20px;
  }
}
</style>
