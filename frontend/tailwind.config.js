export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lexend", "sans-serif"],
      },

      colors: {
        primary: "#FF4800",

        // Buttons
        button: {
          active: "#FF4800",
          search: "#FFFFFF",
        },

        // Backgrounds
        bg: {
          main: "#FAF8F6",
          cards1: "#FFFFFF",
          cards2: "#FF4800",
          onTrak: "#D9ECDB",
          atRisk100: "#FDEFE7",
          atRisk200: "#FFD9D9",
          watch: "#FEF2E3",
          processing: "#DDE9F8",
          grey: "#EEEEEE",
          mainColor: "#FFE4D9",
        },

        // Status
        status: {
          risk: "#FF0000",
          track: "#007D0F",
          processing: "#1D6CD3",
        },

        // Watch
        watch: {
          1: "#A47339",
          2: "#F69521",
        },

        // Grays
        gray: {
          100: "#EBEBEB",
          200: "#CCCCCC",
          300: "#A5A4A3",
        },

        // Text
        text: {
          primary: "#242424",
          secondary: "#6C6B6B",
          light: "#FAF8F6",
          placeholder: "#A5A4A3",
        },

        white: "#FFFFFF",
        shadow: "#242424",
      },

      borderRadius: {
        sm: "2px",
        md: "4px",
        lg: "8px",
        xl: "16px",
        "2xl": "28px",
      },

      boxShadow: {
        DEFAULT: "0 4px 16px rgba(36, 36, 36, 0.40)",
      },
    },
  },
};
