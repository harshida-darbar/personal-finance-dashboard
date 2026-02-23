"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [username, setUserName] = useState("");

 useEffect(() => {
  if (!user) return;

  const fetchUserData = async () => {
    try {
      console.log("Fetching for UID:", user.uid);

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("User Data:", docSnap.data());
        setUserName(docSnap.data().name);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.log("Error fetching user:", error);
    }
  };

  fetchUserData();
}, [user]);


  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (!user) return null;

  const totalIncome = 25000;
  const totalExpense = 10000;
  const balance = totalIncome - totalExpense;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C5B0CD] to-[#6A669D]">
      {/* ===== NAVBAR ===== */}
      <nav className="bg-gradient-to-r from-[#3291B6] to-[#693382] shadow-lg px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Finance Dashboard
        </h1>

        {/* User Dropdown */}
        <div className="relative">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="cursor-pointer bg-white/20 text-white px-4 py-2 rounded-xl backdrop-blur-md hover:bg-white/30 transition"
          >
            {username || user?.email}
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-44 bg-white rounded-xl shadow-xl border">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setShowModal(true);
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-100 text-red-600 font-medium rounded-xl transition cursor-pointer outline-none"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <div className="p-10">
        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div className="bg-gradient-to-r from-[#3291B6] to-[#696FC7] text-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-sm uppercase opacity-80">Total Balance</h2>
            <p className="text-3xl font-bold mt-3">₹ {balance}</p>
          </div>

          <div className="bg-gradient-to-r from-[#7E5CAD] to-[#A376A2] text-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-sm uppercase opacity-80">Total Income</h2>
            <p className="text-3xl font-bold mt-3">₹ {totalIncome}</p>
          </div>

          <div className="bg-gradient-to-r from-[#804674] to-[#4D3C77] text-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-sm uppercase opacity-80">Total Expense</h2>
            <p className="text-3xl font-bold mt-3">₹ {totalExpense}</p>
          </div>
        </div>

        {/* Add Transaction Button */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/add-transaction")}
            className="bg-gradient-to-r from-[#693382] to-[#916DB3] text-white outline-none cursor-pointer px-8 py-3 rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300"
          >
            + Add Transaction
          </button>
        </div>
      </div>

      {/* ===== LOGOUT CONFIRMATION MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-3xl p-8 w-96 shadow-2xl text-center">
            <h2 className="text-xl font-bold text-[#693382] mb-4">
              Confirm Logout
            </h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 outline-none cursor-pointer text-black transition"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#804674] to-[#4D3C77] outline-none text-white hover:opacity-90 cursor-pointer transition"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
