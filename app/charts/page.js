"use client";

import React, { useEffect, useState } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

export default function ChartsPage({ transactions }) {

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  // 🔵 Filter by Month
  const filteredTransactions = transactions.filter((t) => {
    let transactionMonth = "";

    if (t.date?.seconds) {
      const dateObj = new Date(t.date.seconds * 1000);
      transactionMonth = dateObj.toISOString().slice(0, 7);
    } else if (typeof t.date === "string") {
      transactionMonth = t.date.slice(0, 7);
    }

    return transactionMonth === selectedMonth;
  });

  // 🟢 Income & Expense Calculate
  const income = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const expense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // 🔵 Category Wise Expense
  const categoryData = {};
  filteredTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      if (!categoryData[t.category]) {
        categoryData[t.category] = 0;
      }
      categoryData[t.category] += Number(t.amount);
    });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#111827",
          font: {
            size: 14,
            weight: "600",
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#111827",
          font: {
            size: 14,
            weight: "600",
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: "#374151",
        },
        grid: {
          color: "#E5E7EB",
        },
      },
    },
  };

  // 📊 Bar Chart Data
  const barData = {
    labels: ["Income", "Expense"],
    datasets: [
      {
        label: "Amount",
        data: [income, expense],
        backgroundColor: ["rgba(34,197,94,0.8)", "rgba(239,68,68,0.8)"],
        borderRadius: 8,
      },
    ],
  };

  // 🥧 Pie Chart Data
  const pieData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          "#6366F1",
          "#F59E0B",
          "#10B981",
          "#EF4444",
          "#3B82F6",
          "#8B5CF6",
          "#EC4899",
        ],
        borderWidth: 1,
      },
    ],
  };

  // 📈 Monthly Trend Data (All Months)
  const monthlyData = {};

  transactions.forEach((t) => {
    let month = "";

    if (t.date?.seconds) {
      const dateObj = new Date(t.date.seconds * 1000);
      month = dateObj.toISOString().slice(0, 7);
    } else if (typeof t.date === "string") {
      month = t.date.slice(0, 7);
    }

    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0 };
    }

    if (t.type === "income") {
      monthlyData[month].income += Number(t.amount);
    } else {
      monthlyData[month].expense += Number(t.amount);
    }
  });

  const sortedMonths = Object.keys(monthlyData).sort();

  const lineData = {
    labels: sortedMonths,
    datasets: [
      {
        label: "Income",
        data: sortedMonths.map((m) => monthlyData[m].income),
        borderColor: "#22C55E",
        backgroundColor: "#22C55E",
        tension: 0.4,
      },
      {
        label: "Expense",
        data: sortedMonths.map((m) => monthlyData[m].expense),
        borderColor: "#EF4444",
        backgroundColor: "#EF4444",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Charts Overview</h1>

      {/* Month Filter */}
      <div className="mb-8 outline-none">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border p-2 rounded-lg shadow-sm outline-none "
        />
      </div>

      {/* Charts Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-lg h-[350px]">
          <h2 className="text-lg font-semibold mb-4 text-indigo-700 text-center">
            Income vs Expense
          </h2>
          <Bar data={barData} options={options} />
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-10 rounded-2xl shadow-lg h-[350px]">
          <h2 className="text-lg font-semibold mb-2 text-indigo-700 text-center">
            Category Wise Expense
          </h2>

          {Object.keys(categoryData).length === 0 ? (
            <p className="text-gray-500 text-center mt-5">
              No expense data for this month.
            </p>
          ) : (
            <Pie data={pieData} options={options} />
          )}
        </div>

        {/* Line Chart Full Width */}
        <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg h-[400px]">
          <h2 className="text-xl font-semibold mb-6 text-indigo-700 text-center">
            Monthly Income vs Expense Trend
          </h2>
          <Line data={lineData} options={options} />
        </div>
      </div>
    </div>
  );
}
