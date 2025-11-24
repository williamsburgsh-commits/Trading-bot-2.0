import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        chart: {
          1: 'hsl(var(--color-1))',
          2: 'hsl(var(--color-2))',
          3: 'hsl(var(--color-3))',
          4: 'hsl(var(--color-4))',
          5: 'hsl(var(--color-5))',
        },
      },
    },
  },
  darkMode: ['class'],
  plugins: [],
};

export default config;
