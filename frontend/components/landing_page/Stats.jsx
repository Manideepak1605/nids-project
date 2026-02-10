const stats = [
  { label: "Simulated Attacks", value: "12,480+" },
  { label: "Analyzed Packets (Test Data)", value: "5.2M+" },
  { label: "Detection Accuracy", value: "97.3%" },
  { label: "Response Latency", value: "< 1s" },
];

export default function Stats() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 text-center shadow-lg hover:shadow-violet-600/20 transition"
          >
            <p className="text-3xl font-bold text-violet-400">{stat.value}</p>
            <p className="mt-2 text-gray-400 text-sm font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
        * Metrics based on historical benchmarking and system stress-tests
      </p>
    </section>
  );
}
