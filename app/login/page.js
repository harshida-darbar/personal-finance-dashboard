"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import Link from "next/link";
import { IoEye, IoEyeOff } from "react-icons/io5";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },

    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email")
        .required("Email is required"),
      password: Yup.string()
        .required("Password is required"),
    }),

    onSubmit: async (values) => {
      try {
        setLoading(true);

        await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );

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
          Login
        </h1>

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
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm mt-5">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold underline">
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
}
