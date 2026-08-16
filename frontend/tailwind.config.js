/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#1e3a5f',
          800: '#132842',
          900: '#0c1b2f',
        },
        brand: {
          blue: '#1e3a5f',
          green: '#2d8a4e',
          accent: '#3b82f6',
        }
      },
    },
  },
  plugins: [],
};
