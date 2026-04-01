import { getDefaultConfig } from "@elyspio/vite-eslint-config";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const config = getDefaultConfig({ basePath: __dirname, port: 3000 });

config.server ??= {};

config.server.proxy = {
	"/api": {
		target: "https://localhost:7252",
		changeOrigin: true,
		secure: false,
		rewrite: (path: string) => path.slice("/api".length),
	},
};

export default {
	...config,
	test: {
		environment: "jsdom",
	},
};
