import tailwindcssAnimate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      // Semantic type ramp. Additive: these are new names, so nothing that
      // uses text-sm/text-xs today changes until it is migrated.
      // font-heading (Poppins) belongs on display/title/heading/subhead only;
      // everything below those is Inter.
      fontSize: {
        display:  ['2rem',      { lineHeight: '2.25rem',  letterSpacing: '-0.02em',  fontWeight: '600' }],
        title:    ['1.5rem',    { lineHeight: '1.875rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        heading:  ['1.25rem',   { lineHeight: '1.625rem', letterSpacing: '-0.01em',  fontWeight: '600' }],
        subhead:  ['1.0625rem', { lineHeight: '1.5rem',   letterSpacing: '-0.005em', fontWeight: '600' }],
        body:     ['0.9375rem', { lineHeight: '1.4375rem' }],
        label:    ['0.875rem',  { lineHeight: '1.25rem',  fontWeight: '500' }],
        caption:  ['0.75rem',   { lineHeight: '1rem' }],
        overline: ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.06em',   fontWeight: '600' }],
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
        soft: {
          DEFAULT: "hsl(var(--soft))",
          foreground: "hsl(var(--soft-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      },
      backgroundImage: {
        'gradient-warm': 'var(--gradient-warm)',
        'app-ambient': 'var(--app-ambient)',
        'gradient-gold': 'var(--gradient-gold)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        sm: "calc(var(--radius) / 2)",        /* 2px */
        md: "var(--radius)",                  /* 4px */
        lg: "calc(var(--radius) * 1.5)",      /* 6px */
        xl: "calc(var(--radius) * 2)",        /* 8px */
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
        soft: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
