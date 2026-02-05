import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                cinzel: ['var(--font-cinzel)', 'serif'],
                crimson: ['var(--font-crimson)', 'Georgia', 'serif'],
            },
            animation: {
                shimmer: 'shimmer 3s ease-in-out infinite',
                'slow-pulse': 'slow-pulse 4s ease-in-out infinite',
                'fate-glow': 'fate-glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                shimmer: {
                    '0%, 100%': { backgroundPosition: '200% center' },
                    '50%': { backgroundPosition: '-200% center' },
                },
                'slow-pulse': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                'fate-glow': {
                    from: {
                        boxShadow: '0 0 10px hsl(var(--rune-glow) / 0.4), 0 0 20px hsl(var(--rune-glow) / 0.2), inset 0 0 10px hsl(var(--rune-glow) / 0.1)',
                    },
                    to: {
                        boxShadow: '0 0 20px hsl(var(--rune-glow) / 0.6), 0 0 40px hsl(var(--rune-glow) / 0.4), inset 0 0 20px hsl(var(--rune-glow) / 0.2)',
                    },
                },
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;