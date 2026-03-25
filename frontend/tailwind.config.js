/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:        'var(--bg)',
        'bg-raised':  'var(--bg-raised)',
        'bg-card':    'var(--bg-card)',
        'bg-hover':   'var(--bg-hover)',
        'bg-active':  'var(--bg-active)',
        fg:           'var(--fg)',
        'fg-muted':   'var(--fg-muted)',
        'fg-subtle':  'var(--fg-subtle)',
        'fg-faint':   'var(--fg-faint)',
        accent:       'var(--accent)',
        'accent-bg':  'var(--accent-bg)',
        success:      'var(--success)',
        warning:      'var(--warning)',
        error:        'var(--error)',
      },
      borderColor: {
        DEFAULT:  'var(--border)',
        mid:      'var(--border-mid)',
        strong:   'var(--border-strong)',
        accent:   'var(--accent-border)',
        success:  'var(--success-border)',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm:   '6px',
        DEFAULT: '8px',
        lg:   '16px',
        full: '999px',
      },
      fontSize: {
        '10': ['10px', { lineHeight: '1.4' }],
        '11': ['11px', { lineHeight: '1.4' }],
        '13': ['13px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}
