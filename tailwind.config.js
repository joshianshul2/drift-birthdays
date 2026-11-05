/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F6E4CF',
        bark: '#321C04',
        'bark-hover': '#1F1003',
        milk: '#FFF9F2',
        sand: '#D9C4AA',
        'sand-hover': '#CEBA9E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ["'Instrument Serif'", 'serif'],
      },
      keyframes: {
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'ken-burns': { '0%': { transform: 'scale(1.12)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.2s ease-out',
        'sheet-up': 'sheet-up 0.35s cubic-bezier(0.77,0,0.175,1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'ken-burns': 'ken-burns 7.5s ease-out forwards',
      },
      transitionTimingFunction: { drift: 'cubic-bezier(0.77,0,0.175,1)' },
    },
  },
  plugins: [],
}
