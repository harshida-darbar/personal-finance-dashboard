// personal-finance-dashboard/app/components/TopMerchant.js

"use client";

import React, { useMemo } from "react";

export default function TopMerchants({ transactions, selectedMonth }) {
  const topMerchants = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Filter only expenses
    const expenseTransactions = transactions.filter(
      (t) => t.type === "expense",
    );

    // Filter by selected month if provided
    const monthFiltered = selectedMonth
      ? expenseTransactions.filter((t) => {
          if (!t.date) return false;

          const transactionMonth = new Date(t.date.seconds * 1000).toISOString().slice(0, 7); // "YYYY-MM"

          return transactionMonth === selectedMonth;
        })
      : expenseTransactions;

    const merchantTotals = {};

    monthFiltered.forEach((t) => {
      const merchant = t.merchant?.trim() || "Unknown";

      if (!merchantTotals[merchant]) {
        merchantTotals[merchant] = 0;
      }

      merchantTotals[merchant] += Number(t.amount);
    });

    // Convert object to array and sort descending
    const sorted = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return sorted;
  }, [transactions, selectedMonth]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-md mt-6">
      <h2 className="text-lg font-semibold mb-4 text-purple-800">
        Top 5 Merchants by Spending
      </h2>

      {topMerchants.length === 0 ? (
        <p className="text-gray-500">No expense data available</p>
      ) : (
        <ul className="space-y-3">
          {topMerchants.map(([merchant, total], index) => (
            <li
              key={merchant}
              className="flex justify-between items-center border-b border-purple-500 pb-2 text-black"
            >
              <span>
                {index + 1}. {merchant}
              </span>
              <span className="font-semibold text-red-500">
                ₹ {total.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
