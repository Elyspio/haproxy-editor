import {getDefaultConfig} from "@elyspio/vite-eslint-config";
import mkcert from "vite-plugin-mkcert";

const config = getDefaultConfig({basePath: __dirname, port: 4000});

config.plugins?.push(mkcert());

config.server ??= {};
config.server.proxy = {
	"/api": {
		target: 'https://localhost:7252',
		changeOrigin: true,
		secure: false,
		rewrite: (path: string) => path.slice("/api".length)
	}
}

export default config;
