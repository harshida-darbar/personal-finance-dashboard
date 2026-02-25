import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar/>
        {children}
        <ToastContainer position="top-center" autoClose={1000}/>
        </AuthProvider>
      </body>
    </html>
  );
}
