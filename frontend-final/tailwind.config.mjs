/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#5C3A2E", // Main Button / Active Tab
                secondary: "#C97863", // Hover / Highlights
                accent: "#A68564", // Accent (Badges/Offers)
                brown: "#5C3A2E",
                luxury: {
                    gold: "#C97863",
                    dark: "#1A1A1A",
                    light: "#F5EFE6" // Background
                }
            },
            fontFamily: {
                serif: ["Playfair Display", "serif"],
                sans: ["Inter", "sans-serif"],
            },
        },
    },
    plugins: [],
}
