import Link from "next/link";

export default function StatCard({ title, value, color, href = "/alerts" }) {
  const colorMap = {
    violet: "text-violet-400 border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60 shadow-violet-500/5",
    green: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 shadow-emerald-500/5",
    blue: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/60 shadow-cyan-500/5",
    orange: "text-amber-400 border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 shadow-amber-500/5",
    red: "text-red-400 border-red-500/30 bg-red-500/5 hover:border-red-500/60 shadow-red-500/5",
  };

  return (
    <Link
      href={href}
      className={`rounded-2xl backdrop-blur border p-6 transition-all hover:scale-[1.02] cursor-pointer block group ${colorMap[color] || colorMap.blue}`}
    >
      <div className="flex justify-between items-start">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </Link>
  );
}
