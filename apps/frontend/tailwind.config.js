/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          dim: '#d8dadc',
          bright: '#f7f9fb',
          container: '#eceef0',
          'container-high': '#e6e8ea',
          'container-highest': '#e0e3e5',
          'container-low': '#f2f4f6',
          'container-lowest': '#ffffff',
          variant: '#e0e3e5',
        },
        'on-surface': {
          DEFAULT: '#191c1e',
          variant: '#45464d',
        },
        primary: {
          DEFAULT: '#0f172a',
          foreground: '#ffffff',
        },
        sidebar: {
          bg: '#0f172a',
          text: '#94a3b8',
          active: '#ffffff',
          hover: '#1e293b',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
        },
        muted: {
          DEFAULT: '#64748b',
        },
        border: {
          DEFAULT: '#e2e8f0',
        },
        background: {
          DEFAULT: '#f8fafc',
        },
      },
      spacing: {
        sidebar: '260px',
      },
      fontSize: {
        'display-lg': ['32px', { lineHeight: '40px', fontWeight: '700', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
}
