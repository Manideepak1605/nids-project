"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/upload", label: "Upload" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/live-traffic", label: "Live Traffic" },
    { href: "/xai", label: "XAI" },
    { href: "/forensics", label: "Forensics" },
    { href: "/roles", label: "RBAC" },
    { href: "/admin", label: "Admin", isAdmin: true },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-black/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-white">
          NIDS<span className="text-violet-400">.</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition flex items-center gap-1.5 ${pathname === link.href ? "text-white" : "text-gray-400 hover:text-white"
                }`}
            >
              {(pathname === link.href || link.isAdmin) && (
                <span className={`w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6] transition-opacity duration-300 ${pathname === link.href ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></span>
              )}
              {link.label}
            </Link>
          ))}

          <Link
            href="/alerts"
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            Alerts
          </Link>
        </div>
      </div>
    </nav>
  );
}
