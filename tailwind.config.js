export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        money: {
          primary: '#00FF7F',    // Sea Green
          secondary: '#32CD32',  // Lime Green
          accent: '#FFD700',     // Gold
          dark: '#004D40',       // Dark Money Green
          light: '#E0FFF0',      // Light Money Green
          warning: '#FFA500',    // Orange
          error: '#FF4444'       // Red
        }
      },
      backgroundImage: {
        'money-gradient': 'linear-gradient(135deg, #00FF7F 0%, #32CD32 100%)',
        'money-dark': 'linear-gradient(135deg, #004D40 0%, #00695C 100%)'
      },
      animation: {
        'money-bounce': 'moneyBounce 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'money-pulse': 'moneyPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'money-spin': 'moneySpin 3s linear infinite'
      },
      keyframes: {
        moneyBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        moneyPulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        },
        moneySpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      boxShadow: {
        'money': '0 4px 24px 0 rgba(0, 255, 127, 0.1)',
        'money-hover': '0 8px 32px 0 rgba(0, 255, 127, 0.15)'
      }
    }
  },
  plugins: []
}