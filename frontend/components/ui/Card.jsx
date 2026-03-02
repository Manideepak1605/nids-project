"use client";

export default function Card({ children, className = "", glowColor = "violet", hover = true }) {
    const glowMap = {
        violet: "hover:border-violet-500/40 hover:shadow-[0_0_24px_-4px_rgba(139,92,246,0.3)]",
        green: "hover:border-emerald-500/40 hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.3)]",
        red: "hover:border-red-500/40    hover:shadow-[0_0_24px_-4px_rgba(239,68,68,0.3)]",
        cyan: "hover:border-cyan-500/40   hover:shadow-[0_0_24px_-4px_rgba(6,182,212,0.3)]",
        amber: "hover:border-amber-500/40  hover:shadow-[0_0_24px_-4px_rgba(245,158,11,0.3)]",
        none: "",
    };
    return (
        <div
            className={`
        bg-[#0f0f1a]/80 backdrop-blur-md border border-white/8
        rounded-2xl transition-all duration-300
        ${hover ? glowMap[glowColor] || glowMap.violet : ""}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
