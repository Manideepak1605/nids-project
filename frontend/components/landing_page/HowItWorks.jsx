import Link from "next/link";

const steps = [
  {
    title: "Upload Network Traffic",
    description: "Upload your capture files for comprehensive neural analysis.",
    href: "/upload"
  },
  {
    title: "Real-time Monitoring",
    description: "Observe live detection results on the security dashboard.",
    href: "/dashboard"
  },
  {
    title: "Investigate Alerts",
    description: "Explore AI reasoning and forensics for every detected threat.",
    href: "/alerts"
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
          <Link
            key={step.title}
            href={step.href}
            className="group rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:border-violet-500/40 transition-all hover:scale-[1.02]"
          >
            <span className="text-violet-400 font-bold text-xl opacity-50 group-hover:opacity-100 transition-opacity">
              0{i + 1}
            </span>
            <h3 className="mt-4 text-xl font-semibold text-white group-hover:text-violet-300 transition-colors">
              {step.title}
            </h3>
            <p className="mt-2 text-gray-400 text-sm leading-relaxed">{step.description}</p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-violet-400 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              Open Module
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
