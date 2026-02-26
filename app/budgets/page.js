// personal-finance-dashboard/app/budgets/page.js

"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useFormik } from "formik";
import * as Yup from "yup";

export default function BudgetsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showModal, setShowModal] = useState(false);

  //  Route Protection
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading]);

  //  Fetch Budgets
  const fetchBudgets = async () => {
    if (!user) return;

    const q = query(
      collection(db, "budgets"),
      where("uid", "==", user.uid),
      where("month", "==", selectedMonth)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setBudgets(data);
  };

  //  Fetch Transactions
  const fetchTransactions = async () => {
    if (!user) return;

    const q = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => doc.data());

    setTransactions(data);
  };

  useEffect(() => {
    fetchBudgets();
    fetchTransactions();
  }, [user, selectedMonth]);

  //  Category Spending Calculation
 const calculateCategorySpending = () => {
  const spending = {};

  transactions.forEach((t) => {
    if (t.type !== "expense") return;

    let transactionMonth = "";

    //  If Firestore Timestamp
    if (t.date?.seconds) {
      const dateObj = new Date(t.date.seconds * 1000);
      transactionMonth = dateObj.toISOString().slice(0, 7);
    }

    // If normal JS Date
    else if (t.date instanceof Date) {
      transactionMonth = t.date.toISOString().slice(0, 7);
    }

    //  If already string
    else if (typeof t.date === "string") {
      transactionMonth = t.date.slice(0, 7);
    }

    if (transactionMonth === selectedMonth) {
      spending[t.category] =
        (spending[t.category] || 0) + Number(t.amount);
    }
  });

  return spending;
};
  const categorySpending = calculateCategorySpending();

  //  Formik Setup
  const formik = useFormik({
    initialValues: {
      category: "",
      amount: "",
    },
    validationSchema: Yup.object({
      category: Yup.string().required("Category is required"),
      amount: Yup.number()
        .required("Amount is required")
        .positive("Amount must be positive"),
    }),
    onSubmit: async (values, { resetForm }) => {
      // Prevent duplicate budget for same category + month
      const alreadyExists = budgets.find(
        (b) => b.category === values.category
      );

      if (alreadyExists) {
        alert("Budget already exists for this category!");
        return;
      }

      await addDoc(collection(db, "budgets"), {
        uid: user.uid,
        month: selectedMonth,
        category: values.category,
        amount: Number(values.amount),
      });

      resetForm();
      setShowModal(false);
      fetchBudgets();
    },
  });

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "budgets", id));
    fetchBudgets();
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C5B0CD] to-[#6A669D] p-10">
      
      <div className="flex items-center gap-4">
          {/* BACK BUTTON */}
          <button
            onClick={() => router.push("/dashboard")}
            className="text-2xl cursor-pointer px-2 py-1 bg-white text-purple-800 font-bold rounded-lg outline-none"
          >
            ←
          </button>

          <h1 className="text-3xl font-bold text-white">Budgets</h1>
        </div>
        
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-lg mt-5">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-700">
            Monthly Budgets
          </h2>

          <div className="flex gap-4 items-center">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value)
              }
              className="border text-black p-2 rounded outline-none"
            />

            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-700 text-white px-4 py-2 rounded cursor-pointer outline-none"
            >
              + Add Budget
            </button>
          </div>
        </div>

        {/* Budget Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-purple-100 text-purple-800">
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Budget</th>
              <th className="p-3 text-left">Spent</th>
              <th className="p-3 text-left">Remaining</th>
              <th className="p-3 text-left">Progress</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {budgets.map((budget) => {
              const spent =
                categorySpending[budget.category] || 0;

              const remaining = budget.amount - spent;
              const percentage =
                (spent / budget.amount) * 100;

              return (
                <tr key={budget.id} className="border-b border-purple-500 text-black">
                  <td className="p-3">{budget.category}</td>
                  <td className="p-3">₹ {budget.amount}</td>
                  <td className="p-3">₹ {spent}</td>

                  <td
                    className={`p-3 ${
                      remaining < 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    ₹ {remaining}
                  </td>

                  <td className="p-3 w-40">
                    <div className="bg-gray-200 h-3 rounded">
                      <div
                        className={`h-3 rounded ${
                          percentage > 100
                            ? "bg-red-600"
                            : "bg-purple-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            percentage,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </td>

                  <td>
                    <button
                      onClick={() =>
                        handleDelete(budget.id)
                      }
                      className="text-red-500 cursor-pointer outline-none"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal with Formik */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4 text-purple-800">
              Add Budget
            </h3>

            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-4"
            >
              <div>
                <input
                  type="text"
                  name="category"
                  placeholder="Category"
                  onChange={formik.handleChange}
                  value={formik.values.category}
                  className="border border-purple-500 text-black p-2 rounded w-full outline-none"
                />
                {formik.touched.category &&
                  formik.errors.category && (
                    <p className="text-red-500 text-sm">
                      {formik.errors.category}
                    </p>
                  )}
              </div>

              <div>
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  onChange={formik.handleChange}
                  value={formik.values.amount}
                  className="border border-purple-500 text-black p-2 rounded w-full outline-none"
                />
                {formik.touched.amount &&
                  formik.errors.amount && (
                    <p className="text-red-500 text-sm">
                      {formik.errors.amount}
                    </p>
                  )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-400 text-white py-2 rounded w-full cursor-pointer outline-none"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-purple-700 text-white py-2 rounded w-full cursor-pointer outline-none"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
