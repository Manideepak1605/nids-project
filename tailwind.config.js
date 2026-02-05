/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wakanda: {
          dark: "#0a0118",
          purple: {
            DEFAULT: "#a855f7",
            glow: "#c084fc",
            vibrant: "#9333ea",
            deep: "#581c87",
          },
          accent: "#f0abfc",
          blue: "#0ea5e9",
          gold: "#fbbf24",
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'scanline': 'scanline 10s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.5))' },
          '50%': { filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.9))' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'vibranium-glow': '0 0 25px rgba(168, 85, 247, 0.6), 0 0 50px rgba(147, 51, 234, 0.3)',
        'vibranium-heavy': '0 0 40px rgba(168, 85, 247, 0.8), 0 0 80px rgba(147, 51, 234, 0.4)',
      },
    },
  },
  plugins: [],
}
