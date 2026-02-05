const steps = [
  {
    title: "Upload Network Traffic",
    description: "Upload network traffic data for analysis.",
  },
  {
    title: "Intelligent Analysis",
    description: "Machine learning models analyze traffic patterns.",
  },
  {
    title: "Visualize Threats",
    description: "View detected intrusions and alerts on the dashboard.",
  },
];

export default function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        How It <span className="text-violet-400">Works</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:border-violet-500/40 transition"
          >
            <span className="text-violet-400 font-bold text-xl">
              0{i + 1}
            </span>
            <h3 className="mt-4 text-xl font-semibold text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-gray-400">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
