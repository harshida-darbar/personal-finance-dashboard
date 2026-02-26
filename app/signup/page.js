"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import Link from "next/link";
import { toast } from "react-toastify";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const router = useRouter();
  const {loading, user} = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard"); //  replace
    }
  }, [user, loading, router]);

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

    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {

        //  Create Firebase Auth User
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password,
        );

        const user = userCredential.user;

        //  Save extra data in Firestore
        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            name: values.name,
            email: values.email,
            phone: values.phone,
            city: values.city,
            createdAt: new Date(),
          },
          { merge: true },
        );

        toast.success("SignUp Successfull");
        resetForm();
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } catch (error) {
        toast.error(error.message);
        alert(error.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={formik.handleSubmit}
        className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 mt-4"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-purple-800">
          Create Account
        </h1>

        {/* Name */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-purple-800">Name</label>
          <input
            type="text"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3 text-black border-purple-400 outline-none"
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
          )}
        </div>

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
            <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-purple-800">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3 text-black border-purple-400 outline-none"
          />
          {formik.touched.phone && formik.errors.phone && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.phone}</p>
          )}
        </div>

        {/* City */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-purple-800">City</label>
          <input
            type="text"
            name="city"
            value={formik.values.city}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full h-11 mt-1 rounded-lg border px-3 text-black border-purple-400 outline-none"
          />
          {formik.touched.city && formik.errors.city && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.city}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-6 relative">
          <label className="text-sm font-semibold text-purple-800">
            Password
          </label>
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
          disabled={formik.isSubmitting}
          className="w-full h-11 rounded-xl bg-purple-600 text-white font-semibold border-purple-400 hover:bg-purple-900 outline-none cursor-pointer"
        >
          {formik.isSubmitting ? "Creating..." : "Sign Up"}
        </button>

        <p className="text-center text-sm mt-5 text-purple-800 outline-none ">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold underline outline-none cursor-pointer"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
