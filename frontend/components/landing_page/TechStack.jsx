const stack = [
  "Next.js",
  "React",
  "Node.js",
  "Python (ML)",
  "Machine Learning",
  "Tailwind CSS",
];

export default function TechStack() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        Technology <span className="text-violet-400">Stack</span>
      </h2>

      <div className="flex flex-wrap justify-center gap-4">
        {stack.map((tech) => (
          <span
            key={tech}
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:border-violet-500/40 transition"
          >
            {tech}
          </span>
        ))}
      </div>
    </section>
  );
}
