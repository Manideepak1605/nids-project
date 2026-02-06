import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_60%)]"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-28 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          Network Intrusion <span className="text-violet-400">Detection System</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
          Detect, analyze, and visualize malicious network activity using
          intelligent machine learning–based intrusion detection.
        </p>

        <div className="mt-10 flex justify-center gap-6 flex-wrap">
          <Link
            href="/live-traffic"
            className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-600/30 transition"
          >
            Start Detection
          </Link>

          <Link
            href="/dashboard"
            className="px-8 py-3 rounded-xl border border-violet-500/40 text-violet-300 hover:bg-violet-500/10 backdrop-blur transition"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
