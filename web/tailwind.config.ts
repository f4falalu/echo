import type { Config } from 'tailwindcss';

const config = {
  darkMode: false,
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    fontFamily: {
      sans: ['Roobert_Pro', 'sans-serif'],
      mono: ['Menlo', 'Monaco', 'Courier New', 'monospace']
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor'
    },
    fontSize: {
      xxs: ['10px', { lineHeight: '1.2' }],
      xs: ['11px', { lineHeight: '1.2' }],
      sm: ['12px', { lineHeight: '1.2' }],
      base: ['13px', { lineHeight: '1.2' }],
      md: ['14px', { lineHeight: '1.2' }],
      lg: ['18px', { lineHeight: '1.2' }],
      xl: ['18px', { lineHeight: '1.2' }],
      '2xl': ['20px', { lineHeight: '1.2' }],
      '3xl': ['24px', { lineHeight: '1.2' }],
      '4xl': ['30px', { lineHeight: '1.2' }]
    },
    extend: {
      colors: {}
    }
  },
  plugins: []
} satisfies Config;

export default config;
