import { getDefaultConfig } from "@elyspio/vite-eslint-config";
import { defineConfig, transformWithOxc, type Plugin } from "vite-plus";

const config = getDefaultConfig({ basePath: import.meta.dirname, port: 3000 });

const apiUrl = process.env.services__api__https__0 ?? "https://localhost:7252";

/**
 * Inversify relies on TypeScript legacy decorators, constructor parameter `@inject(...)` included.
 * The React Compiler Babel pass of the shared config cannot parse them, so they are lowered with Oxc first.
 */
function legacyDecorators(): Plugin {
	return {
		name: "haproxy-editor:legacy-decorators",
		enforce: "pre",
		transform: {
			filter: { id: { include: /\.ts$/, exclude: /node_modules/ }, code: /@inject/ },
			async handler(code, id) {
				const result = await transformWithOxc(code, id, { decorator: { legacy: true, emitDecoratorMetadata: true } });
				return { code: result.code, map: result.map };
			},
		},
	};
}

export default defineConfig({
	...config,
	plugins: [legacyDecorators(), ...config.plugins],
	server: {
		...config.server,
		proxy: {
			"/api": {
				target: apiUrl,
				changeOrigin: true,
				secure: false,
				rewrite: (path: string) => path.slice("/api".length),
			},
		},
	},
	test: {
		environment: "jsdom",
		// Playwright owns `tests/e2e`; without this Vitest would try to run those specs too.
		include: ["tests/units/**/*.{test,spec}.{ts,tsx}"],
	},
});
