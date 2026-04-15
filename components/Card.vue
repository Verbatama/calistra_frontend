<!-- components/BaseCard.vue -->
<template>
  <div class="base-card">
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  width: 350px;
  height: 150px;
  border-radius: 16px;
  padding: 16px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: transform 0.2s ease;
  margin : 10px;
}

/* .base-card:hover {
  transform: translateY(-4px);
} */
</style>