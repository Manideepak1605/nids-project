import "./globals.css";
import Navbar from "@/components/Navbar";
import VisualEffects from "@/components/VisualEffects";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-gray-200">
        <VisualEffects />
        <div className="relative z-10" style={{ position: 'relative', zIndex: 10 }}>
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
