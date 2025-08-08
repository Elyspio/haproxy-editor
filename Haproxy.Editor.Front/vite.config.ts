import { getDefaultConfig } from "@elyspio/vite-eslint-config";
import mkcert from "vite-plugin-mkcert";
const config = getDefaultConfig({ basePath: __dirname, port: 4000 });

config.plugins?.push(mkcert());

export default config;
