/** @type {import('tailwindcss').Config} */
const customTheme = require("./src/Pages/Styles/Theme.js");

module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/Pages/**/*.{js,jsx,ts,tsx}",
    "./src/Components/**/*.{js,jsx,ts,tsx}",
    "./index.ts",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        pri: customTheme.colors.pri,
        "pri-light": customTheme.colors["pri-light"],
        "pri-dark": customTheme.colors["pri-dark"],
        success: customTheme.colors.success,
        danger: customTheme.colors.danger,
        warning: customTheme.colors.warning,
        link: customTheme.colors.link,
        "slate-50": customTheme.colors["slate-50"],
        "slate-100": customTheme.colors["slate-100"],
        "slate-200": customTheme.colors["slate-200"],
        "slate-300": customTheme.colors["slate-300"],
        "slate-400": customTheme.colors["slate-400"],
        "slate-500": customTheme.colors["slate-500"],
        "slate-600": customTheme.colors["slate-600"],
        "slate-700": customTheme.colors["slate-700"],
        "slate-800": customTheme.colors["slate-800"],
        "slate-900": customTheme.colors["slate-900"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      fontFamily: {
        "poppins-light": ["Poppins-Light"],
        "poppins-regular": ["Poppins-Regular"],
        "poppins-medium": ["Poppins-Medium"],
        "poppins-semibold": ["Poppins-SemiBold"],
        "poppins-bold": ["Poppins-Bold"],
        "poppins-black": ["Poppins-Black"],
      },
    },
  },
  plugins: [],
};