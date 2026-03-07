"use client";
import { useEffect, useState } from "react";

export default function AnimatedCounter({ value, duration = 800, prefix = "", suffix = "" }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const target = typeof value === "number" ? value : parseFloat(value) || 0;
        const start = Date.now();
        const startVal = display;
        const diff = target - startVal;

        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(startVal + diff * eased));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
        <span>
            {prefix}{display.toLocaleString()}{suffix}
        </span>
    );
}
