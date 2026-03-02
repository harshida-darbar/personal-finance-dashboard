// personal-finance-dashboard/app/transactions/page.js

"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  doc,
  addDoc,
  Timestamp,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import CSVImportModal from "../components/CSVImportModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TransactionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [showCSV, setShowCSV] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading]);

  if (loading) return null;

  useEffect(() => {
    if (!user) return;

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

  const uniqueCategories = [
    "all",
    ...new Set(transactions.map((t) => t.category)),
  ];

  const filteredTransactions = transactions.filter((t) => {
    // Month filter
    if (selectedMonth && t.month !== selectedMonth) {
      return false;
    }

    // Type filter
    if (filterType !== "all" && t.type !== filterType) {
      return false;
    }

    // Category filter
    if (filterCategory !== "all" && t.category !== filterCategory) {
      return false;
    }

    // Date filter
    const transactionDate = t.date?.seconds
      ? new Date(t.date.seconds * 1000)
      : null;

    if (selectedDate && transactionDate) {
      const selected = new Date(selectedDate);
      if (transactionDate.toDateString() !== selected.toDateString()) {
        return false;
      }
    }

    // Search filter
    if (
      debouncedSearch &&
      !(
        t.category?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.merchant?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.notes?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    ) {
      return false;
    }

    return true;
  });

  // ADD FORM
  const addFormik = useFormik({
    initialValues: {
      category: "",
      merchant: "",
      type: "expense",
      amount: "",
      notes: "",
      date: "",
    },
    validationSchema: Yup.object({
      category: Yup.string().required("Category is required"),
      merchant: Yup.string().required("merchant is required"),
      amount: Yup.number()
        .typeError("Amount must be number")
        .positive("Must be positive")
        .required("Amount is required"),
      date: Yup.string().required("Date is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      await addDoc(collection(db, "transactions"), {
        ...values,
        amount: Number(values.amount),
        date: Timestamp.fromDate(new Date(values.date)),
        month: values.date.slice(0, 7),
        uid: user.uid,
        createdAt: Timestamp.now(),
      });

      toast.success("Transaction Added!");
      resetForm();
      setShowAddModal(false);
    },
  });

  // UPDATE FORM
  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      category: editTransaction?.category || "",
      merchant: editTransaction?.merchant || "",
      type: editTransaction?.type || "expense",
      amount: editTransaction?.amount || "",
      notes: editTransaction?.notes || "",
    },
    validationSchema: Yup.object({
      category: Yup.string().required("Category is required"),
      merchant: Yup.string().required("merchant is required"),
      amount: Yup.number()
        .typeError("Amount must be number")
        .positive("Must be positive")
        .required("Amount is required"),
    }),
    onSubmit: async (values) => {
      await updateDoc(doc(db, "transactions", editTransaction.id), {
        ...values,
        amount: Number(values.amount),
      });

      toast.success("Transaction Updated!");
      setEditTransaction(null);
    },
  });

  // DELETE
  const handleDelete = async () => {
    await deleteDoc(doc(db, "transactions", deleteId));
    toast.success("Transaction Deleted!");
    setDeleteId(null);
  };

  const categories = [
    "Food",
    "Travel",
    "Shopping",
    "Entertainment",
    "Salary",
    "Others",
  ];

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 20);

    const tableColumn = [
      "Date",
      "Category",
      "Merchant",
      "Type",
      "Amount",
      "Notes",
    ];

    const tableRows = [];

    filteredTransactions.forEach((t) => {
      const date = t.date
        ? new Date(t.date.seconds * 1000).toLocaleDateString()
        : "-";

      tableRows.push([
        date,
        t.category,
        t.merchant || "-",
        t.type,
        `₹ ${t.amount}`,
        t.notes || "-",
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save("transactions.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C5B0CD] to-[#6A669D] p-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* BACK BUTTON */}
          <button
            onClick={() => router.push("/dashboard")}
            className="text-2xl cursor-pointer px-2 bg-white text-purple-800 font-bold rounded-lg outline-none"
          >
            ←
          </button>

          <h1 className="text-3xl font-bold text-white">Transactions</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-purple-700 text-white rounded-xl cursor-pointer mb-6 outline-none"
          >
            + Add Transaction
          </button>

          {showCSV && <CSVImportModal onClose={() => setShowCSV(false)} />}
          <button
            onClick={() => setShowCSV(true)}
            className="px-6 py-2 bg-purple-700 text-white rounded-xl cursor-pointer mb-6 outline-none"
          >
            Import CSV
          </button>

          <button
            onClick={exportToPDF}
            className="px-6 py-2 bg-green-600 text-white rounded-xl cursor-pointer mb-6 outline-none"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4 mb-10">
        {/* Search */}
        <input
          type="text"
          placeholder="Search category, merchant or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white text-black border border-purple-500 p-2 rounded outline-none"
        />

        {/* Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white text-black border border-purple-500 p-2 rounded outline-none"
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        {/* Date */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-white text-black border border-purple-500 p-2 rounded outline-none"
        />

        {/* Category */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white text-black border border-purple-500 p-2 rounded outline-none"
        >
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>

        {/* Month */}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-white text-black border border-purple-500 p-2 rounded outline-none"
        />
      </div>

      {/* TABLE FIXED */}
      <div className="bg-white p-6 rounded-3xl shadow-xl overflow-x-auto">
        <table className="min-w-full border-collapse rounded">
          <thead>
            <tr className="bg-purple-100 text-left text-purple-800">
              <th className="p-3">Date</th>
              <th className="p-3">Category</th>
              <th className="p-3">Merchant</th>
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Notes</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-6 text-gray-500 font-semibold"
                >
                  {selectedDate
                    ? `No transactions found for ${new Date(selectedDate).toLocaleDateString()}`
                    : selectedMonth
                      ? `No transactions found for ${selectedMonth}`
                      : "No transactions found"}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-purple-500 text-black hover:bg-gray-50"
                >
                  <td className="p-3">
                    {t.date
                      ? new Date(t.date.seconds * 1000).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-3">{t.category}</td>
                  <td className="p-3">{t.merchant || "-"}</td>
                  <td
                    className={`p-3 font-semibold ${
                      t.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.type}
                  </td>
                  <td className="p-3">₹ {t.amount}</td>
                  <td className="p-3">{t.notes || "-"}</td>
                  <td className="p-3 space-x-3">
                    <button
                      onClick={() => setEditTransaction(t)}
                      className="text-blue-600 cursor-pointer outline-none"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="text-red-600 cursor-pointer outline-none"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-96 p-6 rounded-3xl shadow-2xl border border-purple-100">
            <h2 className="text-2xl font-semibold text-center text-purple-700 mb-6">
              Add Transaction
            </h2>

            <form onSubmit={addFormik.handleSubmit} className="space-y-4">
              {/* Category */}
              {/* Category */}
              <div>
                <select
                  name="category"
                  value={addFormik.values.category}
                  onChange={addFormik.handleChange} // ✅ only this
                  onBlur={addFormik.handleBlur}
                  className="w-full h-11 px-4 border border-purple-300 rounded-xl text-black bg-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {addFormik.touched.category && addFormik.errors.category && (
                  <p className="text-red-500 text-xs mt-1">
                    {addFormik.errors.category}
                  </p>
                )}
              </div>

              {/* Merchant */}
              <div>
                <input
                  type="text"
                  name="merchant"
                  placeholder="Merchant"
                  value={addFormik.values.merchant}
                  onChange={addFormik.handleChange}
                  onBlur={addFormik.handleBlur}
                  className="w-full h-11 px-4 border border-purple-300 rounded-xl text-black focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                />
                {addFormik.touched.merchant && addFormik.errors.merchant && (
                  <p className="text-red-500 text-xs mt-1">
                    {addFormik.errors.merchant}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <select
                  name="type"
                  value={addFormik.values.type}
                  onChange={addFormik.handleChange}
                  className="w-full h-11 px-4 border border-purple-300 rounded-xl text-black focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount (e.g. 2000)"
                  value={addFormik.values.amount}
                  onChange={addFormik.handleChange}
                  onBlur={addFormik.handleBlur}
                  className="w-full h-11 px-4 border border-purple-300 rounded-xl text-black focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                />
                {addFormik.touched.amount && addFormik.errors.amount && (
                  <p className="text-red-500 text-xs mt-1">
                    {addFormik.errors.amount}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <input
                  type="date"
                  name="date"
                  value={addFormik.values.date}
                  onChange={addFormik.handleChange}
                  className="w-full h-11 px-4 border border-purple-300 rounded-xl text-black focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                />
                {addFormik.errors.date && (
                  <p className="text-red-500 text-xs mt-1">
                    {addFormik.errors.date}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <textarea
                  name="notes"
                  placeholder="Notes"
                  value={addFormik.values.notes}
                  onChange={addFormik.handleChange}
                  className="w-full h-20 px-4 py-2 border border-purple-300 rounded-xl text-black focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none resize-none transition"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 h-11 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition outline-none cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-1/2 h-11 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition shadow-md outline-none cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editTransaction && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-96 p-6 rounded-3xl shadow-2xl border border-purple-100">
            <h2 className="text-2xl font-semibold text-center text-purple-700 mb-6">
              Edit Transaction
            </h2>

            <form onSubmit={editFormik.handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <select
                  name="category"
                  value={editFormik.values.category}
                  onChange={editFormik.handleChange}
                  className="w-full h-11 px-4 border border-purple-300 rounded-xl text-black bg-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {editFormik.errors.category && (
                  <p className="text-red-500 text-xs mt-1">
                    {editFormik.errors.category}
                  </p>
                )}
              </div>

              {/* Merchant */}
              <div>
                <input
                  type="text"
                  name="merchant"
                  value={editFormik.values.merchant}
                  onChange={editFormik.handleChange}
                  className="w-full h-11 px-4 border border-purple-300 rounded-xl text-black focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                />
                {editFormik.errors.merchant && (
                  <p className="text-red-500 text-xs mt-1">
                    {editFormik.errors.merchant}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <select
                  name="type"
                  value={editFormik.values.type}
                  onChange={editFormik.handleChange}
                  className="w-full h-11 px-4 border border-purple-300 rounded-xl text-black focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <input
                  type="number"
                  name="amount"
                  value={editFormik.values.amount}
                  onChange={editFormik.handleChange}
                  className="w-full h-11 px-4 border border-purple-300 rounded-xl text-black focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                />
                {editFormik.errors.amount && (
                  <p className="text-red-500 text-xs mt-1">
                    {editFormik.errors.amount}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <textarea
                  name="notes"
                  value={editFormik.values.notes}
                  onChange={editFormik.handleChange}
                  className="w-full h-20 px-4 py-2 border border-purple-300 rounded-xl text-black focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none resize-none transition"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTransaction(null)}
                  className="w-1/2 h-11 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition cursor-pointer outline-none"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-1/2 h-11 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition shadow-md cursor-pointer outline-none"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <div className="fixed inset-0 backdrop-blur-lg flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl">
            <p className="text-black">Are you sure you want to delete?</p>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-400 text-white rounded cursor-pointer outline-none"
              >
                No
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer outline-none"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
