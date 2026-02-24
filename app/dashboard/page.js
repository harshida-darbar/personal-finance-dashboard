"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { doc, getDoc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useFormik } from "formik";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [username, setUserName] = useState("");
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [editTransaction, setEditTransaction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let income = 0;
      let expense = 0;
      let tempTransactions = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        tempTransactions.push({
          id: docSnap.id,
          ...data,
        });

        if (data.type === "income") {
          income += Number(data.amount);
        } else {
          expense += Number(data.amount);
        }
      });

      setTransactions(tempTransactions);
      setTotalIncome(income);
      setTotalExpense(expense);
    });

    return () => unsubscribe();
  }, [user]);

  const uniqueCategories = [
    "all",
    ...new Set(transactions.map((t) => t.category)),
  ];

  const filteredTransactions = transactions.filter((t) => {
    // Filter by type
    if (filterType !== "all" && t.type !== filterType) {
      return false;
    }
    // Category filter
  if (filterCategory !== "all" && t.category !== filterCategory) {
    return false;
  }

    // Filter by date range
    const transactionDate = t.date?.toDate
      ? t.date.toDate()
      : t.date?.seconds
        ? new Date(t.date.seconds * 1000)
        : null;

    if (selectedDate && transactionDate) {
      const selected = new Date(selectedDate);

      if (transactionDate.toDateString() !== selected.toDateString()) {
        return false;
      }
    }

    // Search filter (category + note)
    if (
      debouncedSearch &&
      !(
        t.category?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.notes?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.merchant?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    ) {
      return false;
    }

    return true;
  });

  const balance = totalIncome - totalExpense;

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "transactions", deleteId));
      toast.success("Transaction deleted successfully!");
      setDeleteId(null);
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await updateDoc(doc(db, "transactions", editTransaction.id), {
        amount: Number(editTransaction.amount),
        category: editTransaction.category,
        merchant: editTransaction.merchant,
        type: editTransaction.type,
        notes: editTransaction.notes,
        date: editTransaction.date,
      });

      toast.success("transactions updated successfully!");
      setEditTransaction(null);
    } catch (error) {
      console.log("Update error:", error);
    }
  };

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  function AddTransactionForm({ user, closeModal }) {
    const validationSchema = Yup.object({
      amount: Yup.number()
        .typeError("Amount must be a number")
        .positive("Amount must be positive")
        .required("Amount is required"),

      type: Yup.string().required("Type is required"),

      category: Yup.string().required("Category is required").trim(),

      merchant: Yup.string().required("Merchant is required").trim(),

      date: Yup.date().required("Date is required"),

      notes: Yup.string(),
    });

    const formik = useFormik({
      initialValues: {
        amount: "",
        type: "income",
        category: "",
        merchant: "",
        date: "",
        notes: "",
      },

      validationSchema,
      onSubmit: async (values, { resetForm, setSubmitting }) => {
        try {
          await addDoc(collection(db, "transactions"), {
            uid: user.uid,
            amount: Number(values.amount),
            type: values.type,
            category: values.category,
            merchant: values.merchant,
            notes: values.notes,
            date: Timestamp.fromDate(new Date(values.date)),
            month: values.date.slice(0, 7), // YYYY-MM (IMPORTANT for budgets)
            createdAt: Timestamp.now(),
          });

          toast.success("Transaction added successfully!");
          resetForm();
          closeModal();
        } catch (error) {
          toast.error(error.message);
        } finally {
          setSubmitting(false);
        }
      },
    });

    return (
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formik.values.amount}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full border rounded-xl px-3 py-2 text-black outline-none
    ${
      formik.touched.amount && formik.errors.amount
        ? "border-red-500"
        : "border-purple-800"
    }`}
        />

        {formik.touched.amount && formik.errors.amount && (
          <p className="text-red-500 text-sm">{formik.errors.amount}</p>
        )}

        <select
          name="type"
          value={formik.values.type}
          onChange={formik.handleChange}
          className="w-full border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formik.values.category}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full border rounded-xl px-3 py-2 text-black outline-none
    ${
      formik.touched.category && formik.errors.category
        ? "border-red-500"
        : "border-purple-800"
    }`}
        />

        {formik.touched.category && formik.errors.category && (
          <p className="text-red-500 text-sm">{formik.errors.category}</p>
        )}

        <input
          type="text"
          name="merchant"
          placeholder="Merchant"
          value={formik.values.merchant}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full border rounded-xl px-3 py-2 text-black outline-none
    ${
      formik.touched.merchant && formik.errors.merchant
        ? "border-red-500"
        : "border-purple-800"
    }`}
        />

        {formik.touched.merchant && formik.errors.merchant && (
          <p className="text-red-500 text-sm">{formik.errors.merchant}</p>
        )}

        <input
          type="date"
          name="date"
          value={formik.values.date}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full border rounded-xl px-3 py-2 text-black outline-none
    ${
      formik.touched.date && formik.errors.date
        ? "border-red-500"
        : "border-purple-800"
    }`}
        />

        {formik.touched.date && formik.errors.date && (
          <p className="text-red-500 text-sm">{formik.errors.date}</p>
        )}

        <textarea
          name="notes"
          placeholder="Notes"
          value={formik.values.notes}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="w-full border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
        />

        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="flex-1 py-2 bg-gray-200 text-black rounded-xl outline-none cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex-1 py-2 bg-gradient-to-r from-[#693382] to-[#916DB3] text-white rounded-xl cursor-pointer outline-none"
          >
            Add
          </button>
        </div>
      </form>
    );
  }

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
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-[#693382] to-[#916DB3] text-white outline-none cursor-pointer px-8 py-3 rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300"
          >
            + Add Transaction
          </button>
        </div>

        <div className="mt-8 bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search category, merchant or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
            />

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-purple-800 rounded-xl px-3 py-2 text-black outline-none cursor-pointer"
            />

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
            >
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ===== Transactions Table ===== */}
        <div className="mt-10 bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-bold mb-6 text-[#693382]">
            Recent Transactions
          </h2>

          {filteredTransactions.length === 0 ? (
            <p className="flex justify-center text-gray-500 font-bold">
              No transactions found.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-purple-800 text-left">
                  <th className="py-3 px-2">Date</th>
                  <th>Category</th>
                  <th>Merchant</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-purple-200 hover:bg-gray-50 text-black"
                  >
                    {/* Date */}
                    <td className="py-3 px-2">
                      {t.date
                        ? new Date(t.date.seconds * 1000).toLocaleDateString()
                        : "-"}
                    </td>

                    {/* Category */}
                    <td>{t.category}</td>

                    {/* Merchant */}
                    <td>{t.merchant || "-"}</td>

                    {/* Type */}
                    <td
                      className={`capitalize font-semibold ${
                        t.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.type}
                    </td>

                    {/* Amount */}
                    <td className="font-semibold">₹ {t.amount}</td>

                    {/* Notes */}
                    <td className="max-w-[150px] truncate">{t.notes || "-"}</td>

                    {/* Actions */}
                    <td className="space-x-3 text-center">
                      <button
                        onClick={() => setEditTransaction(t)}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="text-red-600 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

      {/* ===== ADD TRANSACTION MODAL ===== */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white rounded-3xl p-8 w-96 shadow-2xl">
            <h2 className="text-xl font-bold text-[#693382] mb-4 text-center">
              Add Transaction
            </h2>

            <AddTransactionForm
              user={user}
              closeModal={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      {/* ===== Edit Modal ===== */}
      {editTransaction && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white rounded-3xl p-8 w-96 shadow-2xl">
            <h2 className="text-xl font-bold text-[#693382] mb-4 text-center">
              Edit Transaction
            </h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Amount */}
              <input
                type="number"
                value={editTransaction.amount}
                onChange={(e) =>
                  setEditTransaction({
                    ...editTransaction,
                    amount: e.target.value,
                  })
                }
                className="w-full border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
              />

              {/* Category */}
              <input
                type="text"
                value={editTransaction.category}
                onChange={(e) =>
                  setEditTransaction({
                    ...editTransaction,
                    category: e.target.value,
                  })
                }
                className="w-full border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
              />

              {/* Merchant */}
              <input
                type="text"
                value={editTransaction.merchant || ""}
                onChange={(e) =>
                  setEditTransaction({
                    ...editTransaction,
                    merchant: e.target.value,
                  })
                }
                className="w-full border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
              />

              {/* Date */}
              <input
                type="date"
                value={
                  editTransaction.date
                    ? new Date(editTransaction.date.seconds * 1000)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setEditTransaction({
                    ...editTransaction,
                    date: Timestamp.fromDate(new Date(e.target.value)),
                  })
                }
                className="w-full border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
              />

              {/* Type */}
              <select
                value={editTransaction.type}
                onChange={(e) =>
                  setEditTransaction({
                    ...editTransaction,
                    type: e.target.value,
                  })
                }
                className="w-full border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              {/* Notes */}
              <textarea
                value={editTransaction.notes || ""}
                onChange={(e) =>
                  setEditTransaction({
                    ...editTransaction,
                    notes: e.target.value,
                  })
                }
                className="w-full border border-purple-800 rounded-xl px-3 py-2 text-black outline-none"
              />

              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setEditTransaction(null)}
                  className="flex-1 py-2 bg-gray-200 text-black rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-[#693382] to-[#916DB3] text-white rounded-xl"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white rounded-3xl p-8 w-96 shadow-2xl text-center">
            <h2 className="text-xl font-bold text-[#693382] mb-4">
              Confirm Delete
            </h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this transaction?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 outline-none cursor-pointer text-black transition"
              >
                No
              </button>

              <button
                onClick={handleDelete}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#804674] to-[#4D3C77] outline-none text-white hover:opacity-90 cursor-pointer transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
