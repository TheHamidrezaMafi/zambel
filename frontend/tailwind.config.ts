import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      maxWidth: {
        'mobile': '550px',
        'desktop': '1200px',
      },
      boxShadow: {
        custom1: '0px 2px 20px 0px rgba(153, 153, 153, 0.08)',
        custom2: '0px 20px 45px 4px rgba(144, 144, 144, 0.07)',
        landingSearchBarButton: '0px 6px 25px 0px rgba(92, 80, 109, 0.5)',
        cardShadow: ' 0px 8px 35px 0px rgba(144, 144, 144, 0.15)',
        'mobile-card': '0px 4px 15px 0px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          25: '#F4F3F5',
          50: '#EBE9ED',
          100: '#C0BBC7',
          200: '#A19AAB',
          300: '#766C85',
          400: '#05203c',
          500: '#332449',
          600: '#2E2142',
          700: '#241A34',
          800: '#1C1428',
          900: '#150F1F',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gray: {
          light: '#606060',
        },
        neutral: {
          100: '#DEDEDF',
          200: '#CDCED0',
          300: '#B7B8BA',
          400: '#A9AAAD',
          500: '#939598',
          600: '#86888A',
          700: '#686A6C',
          800: '#515254',
          900: '#3E3F40',
        },
        info: {
          50: '#E6F6FE',
          500: '#117FFC',
          600: '#0C62D8',
          700: '#0849B5',
        },
        success: {
          50: '#F2FCE8',
          500: '#3EBF28',
          600: '#26A41D',
          700: '#148915',
        },
        warning: {
          50: '#FFFAE5',
          100: '#FFF6CC',
          500: '#FFB600',
          600: '#DB9600',
          700: '#B77800',
        },
        danger: {
          50: '#FFF2EB',
          500: '#FF4444',
          600: '#DB3140',
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
} satisfies Config;
