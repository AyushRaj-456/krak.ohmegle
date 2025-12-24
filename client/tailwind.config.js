/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'sit-blue': '#0056b3', // Example college color
                'sit-red': '#b30000',
            }
        },
    },
    plugins: [],
}
