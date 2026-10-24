/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

// Servio palette — see docs/design-system.md for personas and rationale.
// One action color, five status colors identical across admin, waiter,
// kitchen and cashier apps. Surfaces come from the active theme.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    boxShadow: {
      none: 'none',
      // pop: floating layers (dropdowns, modals, toasts). card: subtle lift on light themes.
      pop: '0 12px 32px -8px rgb(0 0 0 / 0.25), 0 2px 6px -2px rgb(0 0 0 / 0.12)',
      card: '0 1px 2px rgb(0 0 0 / 0.05)',
    },
    borderRadius: {
      none: '0px',
      sm: '4px',
      DEFAULT: '6px', // buttons, inputs, chips
      md: '6px',
      lg: '8px',
      xl: '12px', // cards
      '2xl': '12px',
      '3xl': '16px', // modals, large panels
      full: '9999px',
    },
    fontFamily: {
      sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
    },
    extend: {
      colors: {
        // Every color is a CSS variable (RGB triplet) so themes can swap at
        // runtime — see [data-theme] blocks in src/styles/global.css.
        canvas: v('bg'),
        raised: v('raised'),
        line: v('line'),
        'line-strong': v('line-strong'),
        ink: v('ink'),
        'ink-2': v('ink-2'),
        'ink-3': v('ink-3'),

        // Action. `brand` is the button fill; `brand-ink` is brand used as
        // text/border on the page (darker on light themes for contrast).
        brand: {
          DEFAULT: v('brand'),
          hover: v('brand-hover'),
          foreground: v('brand-fg'),
          ink: v('brand-ink'),
        },

        // Status — always pair with an icon + label (see lib/status.ts)
        pending: v('pending'),
        progress: v('progress'),
        ready: v('ready'),
        reserved: v('reserved'),
        danger: v('danger'),

        // Admin sidebar (can be colored independently of the page)
        sidebar: {
          DEFAULT: v('sb'),
          ink: v('sb-ink'),
          'ink-2': v('sb-ink-2'),
          raised: v('sb-raised'),
          line: v('sb-line'),
          accent: v('sb-accent'),
          'accent-fg': v('sb-accent-fg'),
        },

        // Semantic aliases used throughout the codebase
        background: v('bg'),
        surface: v('surface'),
        'surface-variant': v('raised'),
        'text-main': v('ink'),
        'text-muted': v('ink-2'),
        outline: v('line'),
      },
      fontSize: {
        '2xl': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '5xl': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        mono: '-0.01em',
      },
      spacing: {
        sidebar: '260px',
        base: '4px',
        'card-padding': '20px',
        'container-margin': '32px',
        'stack-lg': '32px',
        gutter: '20px',
        'stack-sm': '8px',
        'stack-md': '16px',
        touch: '44px', // minimum tap target for waiter / kitchen / cashier
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
