/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mapfre: {
          red: '#0F766E',
          'red-dark': '#115E59',
        },
        brand: {
          navy: '#102A43',
          teal: '#0F766E',
          cyan: '#0891B2',
          amber: '#D97706',
          ink: '#172033',
          mist: '#F4F7FA',
        },
      },
    },
  },
  plugins: [],
}
