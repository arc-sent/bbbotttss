/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        default: {
          bg: "#0D0D18",
          icons: "#726097",
          title: "#9D7CB2",
          mini: "#6B6C86",
        },
        first: {
          bg: "#0D1418",
          title: "#87BEB5",
          mini: "#6B8586",
        },
        second: {
          bg: "#0D1018",
          title: "#8792BE",
          mini: "#6B7386",
        },
        third: {
          bg: "#120D18",
          title: "#BE8788",
          mini: "#866B6B",
        },
        fourth: {
          bg: "#11110C",
          title: "#BCBE87",
          mini: "#A0A26E",
        },
        mystery: {
          bg: "#0E131F",
          title: "#5170DE",
        }
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      text: {

      }
    },
  },
  plugins: [],
}
