import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens do PRD — seção 5
        app: "var(--bg-app)",
        surface: "var(--bg-surface)",
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--primary)",
        background: "var(--bg-app)",
        foreground: "var(--text-strong)",
        strong: "var(--text-strong)",
        body: "var(--text)",
        muted: {
          DEFAULT: "var(--bg-app)",
          foreground: "var(--text-muted)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
          text: "var(--primary-text)",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "var(--bg-app)",
          foreground: "var(--text)",
        },
        accent: {
          DEFAULT: "var(--primary-soft)",
          foreground: "var(--primary-text)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text)",
        },
        popover: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text)",
        },
        // Plataformas
        airbnb: "var(--airbnb)",
        booking: "var(--booking)",
        direto: "var(--direto)",
        // Status
        ok: { DEFAULT: "var(--ok)", soft: "var(--ok-soft)" },
        warn: { DEFAULT: "var(--warn)", soft: "var(--warn-soft)" },
        danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },
        ia: { DEFAULT: "var(--ia)", soft: "var(--ia-soft)" },
      },
      borderRadius: {
        "2xl": "16px", // card
        xl: "12px", // input / botão
        lg: "10px",
        md: "8px", // badge
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Escala tipográfica do PRD — seção 5
        h1: ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["22px", { lineHeight: "1.25", fontWeight: "700" }],
        h3: ["16px", { lineHeight: "1.4", fontWeight: "600" }],
        // "corpo" 14px é o padrão do <body>; não crio token `body` aqui para
        // não colidir com a cor `body` (ambos gerariam a classe .text-body).
        label: ["13px", { lineHeight: "1.4", fontWeight: "500" }],
        legenda: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        "kpi-valor": ["26px", { lineHeight: "1.2", fontWeight: "600" }],
        "kpi-rotulo": ["13px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "highlight-row": {
          "0%": { backgroundColor: "var(--primary-soft)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "highlight-row": "highlight-row 2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
