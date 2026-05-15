/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        foreground: '#000000',
        muted: '#6F6F6F',
        pine:           '#344E41',
        hunter:         '#3A5A40',
        fern:           '#588157',
        sage:           '#A3B18A',
        dust:           '#DAD7CD',
        'chat-bg':      '#f2f0ec',
        'card-border':  '#e4e0da',
        'primary-light':'#eef1ea',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
