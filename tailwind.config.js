/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
    },
  },
  // Category theme colors are referenced dynamically via src/config/categories.js,
  // so their utility classes must be safelisted (Tailwind can't see them via static analysis).
  safelist: [
    ...[
      'indigo', 'teal', 'sky', 'amber', 'emerald', 'cyan', 'violet', 'orange', 'rose', 'blue', 'lime', 'fuchsia',
      'red', 'yellow', 'green', 'purple', 'pink', 'stone', 'gray', 'slate',
    ].flatMap(
      (color) => [
        `bg-${color}-50`,
        `bg-${color}-100`,
        `bg-${color}-500`,
        `bg-${color}-600`,
        `bg-${color}-700`,
        `from-${color}-500`,
        `from-${color}-600`,
        `to-${color}-600`,
        `to-${color}-700`,
        `text-${color}-600`,
        `text-${color}-700`,
        `text-${color}-800`,
        `border-${color}-200`,
        `border-${color}-300`,
        `border-${color}-500`,
        `ring-${color}-500`,
        `hover:bg-${color}-600`,
        `hover:bg-${color}-700`,
        `hover:text-${color}-700`,
        `hover:border-${color}-300`,
        `group-hover:text-${color}-700`,
      ]
    ),
  ],
  plugins: [],
}
