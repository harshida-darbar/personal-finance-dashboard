"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import Link from "next/link";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const router = useRouter();
//   const [loading, setLoading] = useState(false);
  const {user, loading} = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard"); // 🔥 replace
    }
  }, [user, loading, router]);

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
        await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        toast.success("Login Successfull!")
        router.push("/dashboard");
      } catch (error) {
        toast.error("Login Failed.", error)
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
        <h1 className="text-3xl font-bold text-center mb-6 text-purple-800">
          Login
        </h1>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-purple-800">Email</label>
          <input
            type="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3 text-black border-purple-400 outline-none"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {formik.errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-6 relative">
          <label className="text-sm font-semibold text-purple-800">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3 pr-10 text-black border-purple-400 outline-none"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-10 cursor-pointer text-purple-800"
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
          className="w-full h-11 rounded-xl bg-purple-600 text-white font-semibold border-purple-400 outline-none cursor-pointer" 
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm mt-5 text-purple-800">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold underline outline-none cursor-pointer">
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
}
