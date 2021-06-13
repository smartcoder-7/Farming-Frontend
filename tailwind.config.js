module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: '#4958C5',
      }
    },
    gradientColorStops: theme => ({
      ...theme('colors'),
      top: '#161D2D',
      bottom: '#463A90'
    })
  },
  variants: {
    extend: {
      opacity: ['disabled'],
    }
  },
  plugins: [],
}
