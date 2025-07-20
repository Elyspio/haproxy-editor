import { getDefaultConfig } from "@elyspio/vite-eslint-config";

const config = getDefaultConfig({ basePath: __dirname, port: 3000 });

// https://vite.dev/config/
export default config;
