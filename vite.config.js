import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  plugins: [
    vue(),
    Components({
      dts: "src/components.d.ts",
      resolvers: [NaiveUiResolver()]
    })
  ],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("naive-ui")) return "naive-ui";
          if (id.includes("ical.js")) return "ical";
          if (id.includes("dayjs") || id.includes("dayjs-plugin-lunar")) return "dayjs";
          if (id.includes("pinia")) return "pinia";
          if (id.includes("vue") || id.includes("@vue")) return "vue";
          return "vendor";
        }
      }
    }
  }
});
