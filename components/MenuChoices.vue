<script setup>
import { RouterLink } from 'vue-router';
</script>
<template>
  <nav class="menu-choices">
    <div class="choice">
      
      <RouterLink class="nav-link button" to="/dashboard">Dashboard</RouterLink>
      
      <RouterLink class="nav-link button" to="/penjualan">Penjualan</RouterLink>
      <RouterLink class="nav-link button" to="/produksi">Produksi</RouterLink>
      <RouterLink class="nav-link button" to="/tambah-bahan">Tambah Bahan</RouterLink>
      <RouterLink class="nav-link button" to="/tambah-barang">Tambah Barang</RouterLink>

    </div>
  </nav>
</template>

<style>
.menu-choices {
  display: flex;
  justify-content: flex-end;

}

.choice {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px;
}

.nav-link {
  text-decoration: none;
  
}
.button {
  background-color:#DDE7F0;
  color: rgb(45, 15, 15);
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
} 

@media (max-width: 768px) {
  .choice {
    justify-content: flex-start;
  }
}
</style>