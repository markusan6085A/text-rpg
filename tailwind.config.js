// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { 
    extend: {
      colors: {
        // Кастомний колір для розділювачів - використовує CSS змінну
        separator: 'var(--separator-color)',
      },
      borderColor: {
        // Додаємо до borderColor теж
        separator: 'var(--separator-color)',
      },
    } 
  },
  plugins: [],
};
