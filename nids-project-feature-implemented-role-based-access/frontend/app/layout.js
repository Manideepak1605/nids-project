import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";
import VisualEffects from "@/components/VisualEffects";
import { AuthProvider } from "@/context/AuthContext";
import ContentWrapper from "@/components/layout/ContentWrapper";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#07070a] text-gray-200 antialiased overflow-x-hidden">
        <AuthProvider>
          <VisualEffects />
          <ContentWrapper>{children}</ContentWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
