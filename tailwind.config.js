/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        onda: {
          blue: '#002E5D',
          blue2: '#0056A6',
          accent: '#0099D7',
          gray: '#F3F4F6',
          dark: '#1F2937',
        },
        status: {
          ok: '#10B981',
          degrade: '#F59E0B',
          hs: '#EF4444',
        },
        priority: {
          basse: '#9CA3AF',
          moyenne: '#3B82F6',
          haute: '#F59E0B',
          critique: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
