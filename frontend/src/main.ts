import { createApp } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import App from "./App.vue";

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "dark",
    themes: {
      dark: {
        dark: true,
        colors: {
          background: "#0a0e1a",
          surface: "#111827",
          primary: "#00e5ff",
          secondary: "#ff6b35",
          success: "#00ff88",
          warning: "#ffb300",
          error: "#ff4444",
        },
      },
    },
  },
});

createApp(App).use(vuetify).mount("#app");
