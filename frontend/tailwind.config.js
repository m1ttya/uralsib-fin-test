// frontend/tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#3B175C',     // Цвет логотипа
        secondary: '#6A2E8F',   // Акцентный фиолетовый
        // removed old success/error to avoid duplication
        background: '#F8F9FA',
        text: '#1A1A1A',
        card: '#FFFFFF',
        border: '#E9ECEF',
        // Основные цвета кнопок
        'button-primary': '#6440bf',
        'button-hover': '#4C3191',
        'button-login': '#A485DB',
        'button-login-hover': '#B9A0E4',
        'button-skip': '#6B7280',
        'button-skip-hover': '#7E8696',
        'modal-bg': '#252030',
        success: '#10B981',
        'success-bg': '#ECFDF5',
        'success-border': '#10B981',
        'success-ring': '#10B981',
        error: '#EF4444',
        'error-bg': '#FEF2F2',
        'error-border': '#EF4444',
        'error-ring': '#EF4444'
      },
      fontWeight: {
        normal: '300',
        medium: '400',
        bold: '700'
      },
      fontFamily: {
        sans: [
          'Uralsib-Regular', 'Uralsib-Light', 'Uralsib-Bold',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          '"Open Sans"',
          '"Helvetica Neue"',
          'sans-serif'
        ]
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}