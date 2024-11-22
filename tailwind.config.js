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
        },
        pepe: {
          primary: '#3EFF57',    // Bright Pepe Green
          secondary: '#2ACF47',  // Medium Pepe Green
          accent: '#FFE162',     // Pepe Yellow
          dark: '#1A2F23',       // Dark Pepe
          light: '#E8FFF0',      // Light Pepe
          muted: '#B4D9BE',      // Muted Pepe
          warning: '#FFB648',    // Pepe Warning
          error: '#FF6B6B'       // Pepe Error
        }
      },
      backgroundImage: {
        'money-gradient': 'linear-gradient(135deg, #00FF7F 0%, #32CD32 100%)',
        'money-dark': 'linear-gradient(135deg, #004D40 0%, #00695C 100%)',
        'pepe-gradient': 'linear-gradient(135deg, #3EFF57 0%, #2ACF47 100%)',
        'pepe-dark': 'linear-gradient(135deg, #1A2F23 0%, #2C3B33 100%)'
      },
      animation: {
        'money-bounce': 'moneyBounce 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'money-pulse': 'moneyPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'money-spin': 'moneySpin 3s linear infinite',
        'pepe-bounce': 'pepeBounce 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pepe-pulse': 'pepePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'usb-pulse': 'usbPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
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
        },
        pepeBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pepePulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        },
        usbPulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 }
        }
      },
      boxShadow: {
        'money': '0 4px 24px 0 rgba(0, 255, 127, 0.1)',
        'money-hover': '0 8px 32px 0 rgba(0, 255, 127, 0.15)',
        'pepe': '0 4px 24px 0 rgba(62, 255, 87, 0.1)',
        'pepe-hover': '0 8px 32px 0 rgba(62, 255, 87, 0.15)'
      }
    }
  },
  plugins: []
}