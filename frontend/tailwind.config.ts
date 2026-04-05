import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(9 9 11)',   // zinc-950
        surface: 'rgb(24 24 27)',    // zinc-900
        border: 'rgb(39 39 42)',     // zinc-800
        accent: 'rgb(99 102 241)',   // indigo-500
        foreground: 'rgb(244 244 245)', // zinc-100
        muted: 'rgb(161 161 170)',   // zinc-400
        success: 'rgb(16 185 129)',  // emerald-500
        danger: 'rgb(244 63 94)',    // rose-500
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
