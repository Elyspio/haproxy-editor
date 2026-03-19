import { describe, expect, it } from "vitest";
import { configReducer, setCurrentSnapshot } from "@modules/config/config.reducer";

describe("config.reducer", () => {
	it("stores the edited snapshot and recalculates summary counts", () => {
		const state = configReducer(
			undefined,
			setCurrentSnapshot({
				version: 3,
				global: { daemon: true },
				defaults: [],
				frontends: [
					{
						name: "fe_main",
						mode: "http",
						defaultBackend: null,
						binds: [],
						acls: [],
						backendSwitchingRules: [{ backendName: "be_main", cond: "if", condTest: "host_acl" }],
					},
				],
				backends: [
					{
						name: "be_main",
						mode: "http",
						balance: null,
						servers: [{ name: "app_1", address: "10.0.0.10", port: 8080, check: null }],
					},
				],
				summary: { frontendCount: 0, backendCount: 0, serverCount: 0 },
			})
		);

		expect(state.current.version).toBe(3);
		expect(state.current.summary).toEqual({
			frontendCount: 1,
			backendCount: 1,
			serverCount: 1,
		});
	});
});
