"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import Link from "next/link";
import { IoEye, IoEyeOff } from "react-icons/io5";

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      city: "",
    },

    validationSchema: Yup.object({
      name: Yup.string().trim().required("Name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .matches(/[^a-zA-Z0-9]/, "Must include a special character")
        .required("Password is required"),
      phone: Yup.string()
        .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
        .required("Phone number is required"),
      city: Yup.string().trim().required("City is required"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);

        // 1️⃣ Create Firebase Auth User
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );

        const user = userCredential.user;

        // 2️⃣ Save extra data in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: values.name,
          email: values.email,
          phone: values.phone,
          city: values.city,
          createdAt: new Date(),
        });

        resetForm();
        router.push("/dashboard");
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={formik.handleSubmit}
        className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-8"
      >
        <h1 className="text-3xl font-bold text-center mb-6">
          Create Account
        </h1>

        {/* Name */}
        <div className="mb-4">
          <label className="text-sm font-semibold">Name</label>
          <input
            type="text"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3"
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-red-500 text-sm mt-1">
              {formik.errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm font-semibold">Email</label>
          <input
            type="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {formik.errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="text-sm font-semibold">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3"
          />
          {formik.touched.phone && formik.errors.phone && (
            <p className="text-red-500 text-sm mt-1">
              {formik.errors.phone}
            </p>
          )}
        </div>

        {/* City */}
        <div className="mb-4">
          <label className="text-sm font-semibold">City</label>
          <input
            type="text"
            name="city"
            value={formik.values.city}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3"
          />
          {formik.touched.city && formik.errors.city && (
            <p className="text-red-500 text-sm mt-1">
              {formik.errors.city}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-6 relative">
          <label className="text-sm font-semibold">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3 pr-10"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-10 cursor-pointer"
          >
            {showPassword ? <IoEye size={20} /> : <IoEyeOff size={20} />}
          </span>
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {formik.errors.password}
            </p>
          )}
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-purple-600 text-white font-semibold"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="text-center text-sm mt-5">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
