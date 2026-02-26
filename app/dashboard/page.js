// personal-finance-dashboard/app/dashboard/page.js

"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { calculateMonthlySummary } from "../utils/finance";
import ChartsPage from "../charts/page";
import TopMerchants from "../components/TopMerchants";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;

    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUsername(snap.data().name);
    };
    fetchUser();

    const q = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const temp = [];
      snapshot.forEach((doc) => {
        temp.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(temp);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  const monthlySummary = calculateMonthlySummary(transactions, selectedMonth);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C5B0CD] to-[#6A669D] p-10">
      <h1 className="text-3xl font-bold text-white mb-6">
        Welcome {username || user.email}
      </h1>

      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="mb-8 px-4 py-2 rounded-xl cursor-pointer border outline-none"
      />

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-purple-800">Total Balance</h2>
          <p className="text-2xl font-bold text-gray-700">
            ₹ {monthlySummary.net}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-purple-800">Total Income</h2>
          <p className="text-2xl font-bold text-gray-700">
            ₹ {monthlySummary.income}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-purple-800">Total Expense</h2>
          <p className="text-2xl font-bold text-gray-700">
            ₹ {monthlySummary.expense}
          </p>
        </div>
      </div>
      <ChartsPage transactions={transactions} selectedMonth={selectedMonth} />
      <TopMerchants transactions={transactions} selectedMonth={selectedMonth} />
    </div>
  );
}
