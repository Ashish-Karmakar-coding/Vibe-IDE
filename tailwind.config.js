/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{js,jsx,ts,tsx,html}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
        ui: ['Inter', 'Syne', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-base': '#0a0b0f',
        'bg-panel': '#0f1117',
        'bg-editor': '#0c0d12',
        'bg-hover': '#171920',
        'bg-active': '#1c1f2a',
        'border-color': '#1e2130',
        accent: '#5b7fff',
        accent2: '#a78bfa',
        green: '#34d399',
        red: '#f87171',
        'text-1': '#e2e8f0',
        'text-2': '#64748b',
        'text-3': '#374151',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
