/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        colors: {
          surface: {
            DEFAULT: '#0f1117',
            secondary: '#1a1d27',
            tertiary: '#22263a'
          },
          accent: {
            DEFAULT: '#6366f1',
            light: '#818cf8'
          },
          danger: '#ef4444',
          warning: '#f59e0b',
          success: '#22c55e',
        },
        fontFamily: {
          sans: ['DM Sans', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace']
        }
      }
    },
    plugins: []
  };
  