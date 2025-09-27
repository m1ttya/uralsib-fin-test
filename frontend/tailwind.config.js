// frontend/tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#3B175C',     // Цвет логотипа
        secondary: '#6A2E8F',   // Акцентный фиолетовый
        success: '#28A745',
        error: '#DC3545',
        background: '#F8F9FA',
        text: '#1A1A1A',
        card: '#FFFFFF',
        border: '#E9ECEF'
      },
      fontWeight: {
        normal: '300',
        medium: '400',
        bold: '700'
      },
      fontFamily: {
        sans: [
          'Roboto',
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
  plugins: []
}