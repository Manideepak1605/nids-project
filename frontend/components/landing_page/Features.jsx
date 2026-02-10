const features = [
  { title: "Neural Detection Engine", desc: "Automated threat detection using deep learning autoencoders." },
  { title: "Explainable AI (XAI)", desc: "Transparent reasoning and feature importance for every detection." },
  { title: "Attack Forensics", desc: "Interactive timelines and evidence gathering for security incidents." },
  { title: "Role-Based Governance", desc: "Secure administrative controls and simulated RBAC environments." },
];

export default function Features() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        Core <span className="text-violet-400">Capabilities</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-xl bg-white/5 backdrop-blur border border-white/10 p-6 hover:border-violet-500/40 transition-all hover:bg-white/[0.07]"
          >
            <h4 className="text-violet-400 font-bold mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 group-hover:scale-150 transition-transform" />
              {f.title}
            </h4>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
