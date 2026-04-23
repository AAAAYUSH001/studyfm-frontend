/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        purple: { DEFAULT: '#534AB7', light: '#EEEDFE', mid: '#AFA9EC', dark: '#3C3489' },
        teal: { DEFAULT: '#1D9E75', light: '#E1F5EE' },
        amber: { DEFAULT: '#BA7517', light: '#FAEEDA' },
        coral: { DEFAULT: '#D85A30', light: '#FAECE7' },
      }
    }
  },
  plugins: []
}
