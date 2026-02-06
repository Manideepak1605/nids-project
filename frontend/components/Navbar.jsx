import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-black/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-white">
          <span className="text-violet-400">.</span>NIDS<span className="text-violet-400">.</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/upload"
            className="text-gray-400 hover:text-white transition"
          >
            Upload
          </Link>

          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white transition"
          >
            Dashboard
          </Link>

          <Link
            href="/live-traffic"
            className="text-gray-400 hover:text-white transition"
          >
            Live Traffic
          </Link>

          <Link
            href="/alerts"
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition"
          >
            Alerts
          </Link>
        </div>
      </div>
    </nav>
  );
}
