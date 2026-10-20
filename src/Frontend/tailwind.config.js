/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-yellow': '#FCEA1E',
        'brand-yellow-dark': '#E9B902',
        'brand-black': '#1D1E1C',
        'brand-gray': '#363636',
        'brand-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
}
