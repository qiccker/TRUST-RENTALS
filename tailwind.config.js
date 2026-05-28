export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        graphite: "#374151",
        mist: "#f4f7f8",
        line: "#d7dee2",
        teal: "#0f766e",
        ember: "#c2410c",
        saffron: "#f59e0b",
        basil: "#3f6212",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(31, 41, 51, 0.12)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
