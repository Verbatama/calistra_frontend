<script setup>
import {
    Chart as ChartJs,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    ArcElement

} from "chart.js";
import { color } from "chart.js/helpers";

import { Bar, Pie } from "vue-chartjs";


ChartJs.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);
/** @type {import('chart.js').ChartData<'pie'>} */
const chartData = {
    labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    datasets: [
        {
            label: 'Penjualan',
            data: [10, 20, 30, 40, 50],
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF'
            ],
        }
    ]
}

const chartOptions = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
            mainAspecRatio: false,
        },
        labels: {
            color: 'rgb(255, 99, 132)',

        }
    }
}
</script>

<template>
    <div style="height: 400px; width: 400px">
        <Pie :data="chartData" :options="chartOptions" />
    </div>
</template>
