"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUsername(snap.data().name);
      }
    };

    fetchUser();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!user) return null;

  return (
    <>
      {/* NAVBAR */}
      <nav className="bg-gradient-to-r from-[#3291B6] to-[#693382] shadow-lg px-8 py-4 flex justify-between items-center">
        
        {/* LEFT SIDE */}
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Finance Dashboard
          </h1>

          <div className="flex gap-6 text-white font-medium">
            {/* <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link> */}
            <Link href="/transactions" className="hover:underline outline-none">
              Transactions
            </Link>
            <Link href="/budgets" className="hover:underline outline-none">
              Budgets
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="relative">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="cursor-pointer bg-white/20 text-white px-4 py-2 rounded-xl backdrop-blur-md hover:bg-white/30 transition"
          >
            {username || user.email}
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-44 bg-white rounded-xl shadow-xl border">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-100 text-red-600 font-medium rounded-xl transition cursor-pointer outline-none"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white rounded-3xl p-8 w-96 shadow-2xl text-center">
            <h2 className="text-xl font-bold text-[#693382] mb-4">
              Confirm Logout
            </h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-black transition cursor-pointer outline-none"
              >
                No
              </button>

              <button
                onClick={handleLogout}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#804674] to-[#4D3C77] text-white hover:opacity-90 transition cursor-pointer outline-none"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
