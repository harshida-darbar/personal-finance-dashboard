// personal-finance-dashboard/app/components/CSVImportModal.js

"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "../context/AuthContext";
import { autoCategorize } from "../utils/rulesEngine";
import { toast } from "react-toastify";

export default function CSVImportModal({ onClose }) {
  const { user } = useAuth();

  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        setPreviewData(results.data);
      },
    });
  };

  // Import to Firestore
  const handleImport = async () => {
    if (!user) return;

    setLoading(true);

    try {
      for (const row of previewData) {
        const merchant = row.merchant || "Unknown";
        const amount = Number(row.amount);
        const dateObj = new Date(row.date);
        const type = row.type?.toLowerCase() === "income" ? "income" : "expense";


        await addDoc(collection(db, "transactions"), {
          merchant,
          amount,
          type,
          category: autoCategorize(merchant),
          date: Timestamp.fromDate(dateObj),
          month: dateObj.toISOString().slice(0, 7),
          uid: user.uid,
        });
      }

      toast.success("Transacion Imported Successfully!")
      onClose();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("error", error.message);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-lg flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl w-[700px] max-h-[80vh] overflow-y-auto shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">
          Import Transactions (CSV)
        </h2>

        {/* File Upload */}
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="mb-4 text-black border border-purple-500 px-2 py-3 rounded-xl cursor-pointer"
        />

        {/* Preview Table */}
        {previewData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-purple-100 text-purple-800">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Merchant</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Auto Category</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="text-black">
                    <td className="p-2 border">{row.date}</td>
                    <td className="p-2 border">{row.merchant}</td>
                    <td className="p-2 border">₹ {row.amount}</td>
                    <td className="p-2 border">
                      {autoCategorize(row.merchant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-gray-500 mt-2 text-sm">
              Showing first 10 rows preview
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-black rounded-lg cursor-pointer outline-none"
          >
            Cancel
          </button>

          {previewData.length > 0 && (
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer outline-none"
            >
              {loading ? "Importing..." : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
