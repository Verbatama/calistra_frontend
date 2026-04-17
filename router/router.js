import { createRouter, createWebHistory} from "vue-router";
import DashboardPage from "../views/DashboardPage.vue";
import PenjualanPage from "../views/PenjualanPage.vue";
import ProduksiPage from "../views/ProduksiPage.vue";
import DetailProduksiPage from "../views/DetailProduksiPage.vue";   
import TambahBahanPage from "../views/TambahBahanPage.vue";
import TambahBarangPage from "../views/TambahBarangPage.vue";
// Removed accidental import of eslint-plugin-vue (dev-only)

const routes = [
    {
        path:"/login",
        name:"Login",
        component: () => import("../views/LoginPage.vue")
    },
    {
        path:"/",
        redirect:"/dashboard",
        meta: { requiresAuth: true }
    },

    {
        path:"/dashboard",
        name:"Dashboard",
        component: DashboardPage,
        meta: { requiresAuth: true }

    },
    {
        path:"/penjualan",
        name:"Penjualan",
        component: PenjualanPage,
        meta: { requiresAuth: true }

    },
    {
        path:"/produksi",
        name:"Produksi",
        component: ProduksiPage,
        meta: { requiresAuth: true }
    },
    {
        path:"/detail-produksi",
        name:"Detail Produksi",
        component: DetailProduksiPage,
        meta: { requiresAuth: true }
    },
    {
        path:"/tambah-bahan",
        name:"Tambah Bahan",
        component: TambahBahanPage,
        meta: { requiresAuth: true }
    },
    {
        path:"/tambah-barang",
        name:"Tambah Barang",
        component: TambahBarangPage,
        meta: { requiresAuth: true }
    },

    
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const token = localStorage.getItem("token");
    if (requiresAuth && !token) {
        next("/login");
    }   else {
        next();
    }
});

export default router;