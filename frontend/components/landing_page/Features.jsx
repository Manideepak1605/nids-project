const features = [
  "Machine Learning–Based Detection",
  "Real-Time Traffic Analysis",
  "Interactive Security Dashboards",
  "Alert & Logging System",
];

export default function Features() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        Core <span className="text-violet-400">Features</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <div
            key={feature}
            className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-6 hover:border-violet-500/40 transition"
          >
            <p className="text-gray-300">{feature}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
