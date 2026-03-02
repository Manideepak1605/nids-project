import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";
import VisualEffects from "@/components/VisualEffects";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#07070a] text-gray-200 antialiased overflow-x-hidden">
        <VisualEffects />

        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area (offset by Sidebar width on MD+ screens) */}
        <div className="relative z-10 md:ml-64 flex flex-col min-h-screen transition-all duration-300">
          <TopNavbar />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
