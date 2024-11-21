# PepeUSB Theme Implementation Guide

## Color Palette

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        pepe: {
          primary: '#00FF00',    // Vibrant green
          secondary: '#98FF98',  // Light green
          accent: '#32CD32',     // Lime green
          dark: '#006400',       // Dark green
          light: '#F0FFF0',      // Honeydew
          warning: '#FFD700',    // Gold
          error: '#FF4500'       // Red-orange
        }
      },
      backgroundImage: {
        'pepe-gradient': 'linear-gradient(135deg, #00FF00 0%, #98FF98 100%)',
        'pepe-dark': 'linear-gradient(135deg, #006400 0%, #32CD32 100%)'
      },
      animation: {
        'usb-pulse': 'usbPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pepe-bounce': 'pepeBounce 1s infinite'
      },
      keyframes: {
        usbPulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        },
        pepeBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    }
  }
};
```

## Component Styling

### Cards
```css
.pepe-card {
  @apply bg-pepe-light rounded-lg shadow-lg border-2 border-pepe-primary
         hover:shadow-xl transition-shadow duration-300;
}
```

### Buttons
```css
.pepe-button {
  @apply bg-pepe-gradient text-white font-bold py-2 px-4 rounded-full
         hover:brightness-110 transition-all duration-300
         focus:outline-none focus:ring-2 focus:ring-pepe-accent;
}
```

### Charts
```css
.pepe-chart {
  @apply bg-white/10 backdrop-blur-sm rounded-xl p-4
         border border-pepe-primary/20;
}
```

## Animation Guidelines

### Loading States
```css
.pepe-loading {
  @apply animate-usb-pulse bg-pepe-gradient;
}
```

### Hover Effects
```css
.pepe-hover {
  @apply hover:scale-105 transition-transform duration-300;
}
```

### Trade Animations
```css
.pepe-trade-success {
  @apply animate-pepe-bounce text-pepe-primary;
}
```

## Layout Components

### Dashboard Grid
```css
.pepe-dashboard {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6;
}
```

### Navigation
```css
.pepe-nav {
  @apply bg-pepe-dark text-white sticky top-0 z-50
         border-b-2 border-pepe-primary;
}
```

## Typography

### Headings
```css
.pepe-heading {
  @apply text-pepe-primary font-bold;
}
```

### Body Text
```css
.pepe-text {
  @apply text-pepe-dark dark:text-pepe-light;
}
```

## Icons and Graphics

### USB Icon
```css
.pepe-usb-icon {
  @apply w-6 h-6 text-pepe-primary animate-usb-pulse;
}
```

### Status Indicators
```css
.pepe-status {
  @apply w-3 h-3 rounded-full;
}

.pepe-status-active {
  @apply bg-pepe-primary animate-usb-pulse;
}
```

## Responsive Design

### Mobile First
```css
.pepe-container {
  @apply mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl;
}
```

### Breakpoints
```css
.pepe-responsive {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}
```

## Dark Mode Support

### Dark Theme
```css
.dark .pepe-card {
  @apply bg-pepe-dark/90 text-pepe-light;
}
```

### Light Theme
```css
.light .pepe-card {
  @apply bg-pepe-light text-pepe-dark;
}
```