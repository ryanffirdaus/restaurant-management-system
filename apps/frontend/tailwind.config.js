/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-variant': 'var(--color-surface-variant)',
        primary: {
          DEFAULT: '#10b981',
          foreground: '#ffffff',
        },
        'on-primary': '#ffffff',
        'text-main': 'var(--color-text-main)',
        'text-muted': 'var(--color-text-muted)',
        outline: 'var(--color-outline)',
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
        'status-available': '#10b981',
        'status-occupied': '#6366f1',
        'status-reserved': '#f59e0b',
        'status-alert': '#ef4444',
      },
      fontFamily: {
        'body-md': ['Public Sans'],
        'body-sm': ['Public Sans'],
        'display-lg': ['Public Sans'],
        'data-tabular': ['Public Sans'],
        'headline-md-mobile': ['Public Sans'],
        'title-lg': ['Public Sans'],
        'label-caps': ['Public Sans'],
        'headline-md': ['Public Sans'],
        'headline-sm': ['Public Sans'],
      },
      spacing: {
        sidebar: '260px',
        base: '4px',
        'card-padding': '24px',
        'container-margin': '32px',
        'stack-lg': '32px',
        gutter: '20px',
        'stack-sm': '8px',
        'stack-md': '16px',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
