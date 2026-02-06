const stats = [
  { label: "Attacks Detected", value: "12,480+" },
  { label: "Traffic Analyzed", value: "5.2M Packets" },
  { label: "Detection Accuracy", value: "97.3%" },
  { label: "Response Time", value: "< 1s" },
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
            <p className="mt-2 text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
