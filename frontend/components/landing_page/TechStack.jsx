const stack = [
  "Next.js",
  "Tailwind CSS",
  "Node.js",
  "Python (TensorFlow)",
  "Scikit-Learn",
  "NSL-KDD Dataset",
  "CICIDS 2017 Dataset",
];

export default function TechStack() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <h2 className="text-2xl font-bold text-white text-center mb-2">
        Integrated <span className="text-violet-400">Environment</span>
      </h2>
      <p className="text-center text-gray-500 text-sm mb-12 max-w-2xl mx-auto">
        Built with industry-standard frameworks and validated against top research datasets for maximum detection reliability.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {stack.map((tech) => (
          <span
            key={tech}
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:border-violet-500/40 hover:text-white transition cursor-default"
          >
            {tech}
          </span>
        ))}
      </div>
    </section>
  );
}
