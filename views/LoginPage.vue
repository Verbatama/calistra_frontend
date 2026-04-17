<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const passwd = ref("");
const nama = ref("");
const router = useRouter();

const login = async () => {
    try {
        const res = await fetch("http://localhost:8700/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nama: nama.value,
                password: passwd.value,
            }),
        });

        const data = await res.json();
        if (data.token) {
            localStorage.setItem("token", data.token);
            alert("Login berhasil!");
            router.push("/dashboard");
        } else {
            alert(data.message || "Gagal login");
        }
    } catch (error) {
        console.error("Error during login:", error);
    }
};
</script>

<template>
    <input type="text" placeholder="Nama" v-model="nama">
    <input type="password" placeholder="Password" v-model="passwd">
        
    <button @click="login">Login</button>
</template>