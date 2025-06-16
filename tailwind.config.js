/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF006E',
        secondary: '#8338EC',
        accent: '#FFBE0B',
        surface: '#1A1A2E',
        background: '#0F0F1E',
        success: '#06FFA5',
        warning: '#FFB700',
        error: '#FF4365',
        info: '#00B4D8',
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      },
      fontFamily: {
        display: ['Bungee', 'cursive'],
        sans: ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
        heading: ['Space Grotesk', 'ui-sans-serif', 'system-ui']
      },
      animation: {
        'roll-dice': 'rollDice 0.6s ease-out',
        'bounce-total': 'bounceTotal 0.4s ease-out',
        'glow-pulse': 'glowPulse 2s infinite',
      },
      keyframes: {
        rollDice: {
          '0%': { transform: 'rotateX(0deg) rotateY(0deg)' },
          '25%': { transform: 'rotateX(180deg) rotateY(90deg)' },
          '50%': { transform: 'rotateX(360deg) rotateY(180deg)' },
          '75%': { transform: 'rotateX(540deg) rotateY(270deg)' },
          '100%': { transform: 'rotateX(720deg) rotateY(360deg)' },
        },
        bounceTotal: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 0, 110, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 0, 110, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}