import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
        {children}
        <ToastContainer position="top-center" autoClose={1000}/>
        </AuthProvider>
      </body>
    </html>
  );
}
