import { createRouter, createWebHistory} from "vue-router";
import DashboardPage from "../views/DashboardPage.vue";
import PenjualanPage from "../views/PenjualanPage.vue";
import ProduksiPage from "../views/ProduksiPage.vue";
import DetailProduksiPage from "../views/DetailProduksiPage.vue";   
import TambahBahanPage from "../views/TambahBahanPage.vue";
import TambahBarangPage from "../views/TambahBarangPage.vue";

const routes = [
    {
        path:"/",
        redirect:"/dashboard"
    },

    {
        path:"/dashboard",
        name:"Dashboard",
        component: DashboardPage
    },
    {
        path:"/penjualan",
        name:"Penjualan",
        component: PenjualanPage
    },
    {
        path:"/produksi",
        name:"Produksi",
        component: ProduksiPage
    },
    {
        path:"/detail-produksi",
        name:"Detail Produksi",
        component: DetailProduksiPage
    },
    {
        path:"/tambah-bahan",
        name:"Tambah Bahan",
        component: TambahBahanPage
    },
    {
        path:"/tambah-barang",
        name:"Tambah Barang",
        component: TambahBarangPage
    },

    
]
const router = createRouter({
    history: createWebHistory(),
    routes
})
export default router;