/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        meoluna: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        moon: "hsl(var(--moon))",
        "moon-glow": "hsl(var(--moon-glow))",
        stars: "hsl(var(--stars))",
        "night-sky": "hsl(var(--night-sky))",
        aurora: "hsl(var(--aurora))",
        subject: {
          math: "hsl(var(--subject-math))",
          german: "hsl(var(--subject-german))",
          english: "hsl(var(--subject-english))",
          biology: "hsl(var(--subject-biology))",
          physics: "hsl(var(--subject-physics))",
          chemistry: "hsl(var(--subject-chemistry))",
          history: "hsl(var(--subject-history))",
          geography: "hsl(var(--subject-geography))",
          art: "hsl(var(--subject-art))",
          music: "hsl(var(--subject-music))",
          sport: "hsl(var(--subject-sport))",
          informatics: "hsl(var(--subject-informatics))",
        },
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 4s ease-in-out infinite 1s',
        'glow': 'glow 2s ease-in-out infinite',
        'glow-moon': 'glowMoon 4s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'twinkle-slow': 'twinkle 5s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
        'aurora': 'aurora 8s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
        },
        glowMoon: {
          '0%, 100%': {
            boxShadow: '0 0 30px rgba(255, 213, 102, 0.4), 0 0 60px rgba(255, 213, 102, 0.2)',
            filter: 'brightness(1)',
          },
          '50%': {
            boxShadow: '0 0 50px rgba(255, 213, 102, 0.6), 0 0 100px rgba(255, 213, 102, 0.3)',
            filter: 'brightness(1.1)',
          },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        aurora: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            opacity: '0.5',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            opacity: '0.8',
          },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      backgroundImage: {
        'gradient-night': 'linear-gradient(180deg, hsl(240 50% 10%), hsl(250 50% 5%))',
        'gradient-aurora': 'linear-gradient(135deg, hsl(170 80% 50%), hsl(280 70% 60%), hsl(320 80% 55%))',
        'gradient-moon': 'linear-gradient(135deg, hsl(45 100% 75%), hsl(45 100% 85%))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
