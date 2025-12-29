/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Status colors for alerts
        'status-normal': '#22c55e',    // green-500
        'status-attention': '#eab308', // yellow-500
        'status-alert': '#f97316',     // orange-500
        'status-severe': '#ef4444',    // red-500
      },
    },
  },
  plugins: [],
}
