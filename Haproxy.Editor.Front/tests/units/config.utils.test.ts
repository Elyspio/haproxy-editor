import { describe, expect, it } from "vitest";
import { createEmptySnapshot, normalizeSnapshot, withSnapshot } from "@modules/config/config.utils";

describe("config.utils", () => {
	it("normalizes a raw API payload into a typed snapshot and recalculates summary", () => {
		const snapshot = normalizeSnapshot({
			version: "12",
			global: { daemon: true },
			frontends: [
				{
					name: "fe_main",
					mode: "http",
					defaultBackend: "be_main",
					binds: [{ name: "public", address: "0.0.0.0", port: 80 }],
					acls: [{ name: "host_acl", criterion: "hdr(host)", value: "example.com" }],
					backendSwitchingRules: [{ backendName: "be_main", cond: "if", condTest: "host_acl" }],
				},
			],
			backends: [
				{
					name: "be_main",
					mode: "http",
					balance: "roundrobin",
					advCheck: "tcp-check",
					servers: [
						{ name: "app_1", address: "10.0.0.10", port: 8080, check: "enabled" },
						{ name: "app_2", address: "10.0.0.11", port: 8080, check: null },
					],
				},
			],
		});

		expect(snapshot.version).toBe(12);
		expect(snapshot.global.daemon).toBe(true);
		expect(snapshot.frontends[0]?.backendSwitchingRules[0]?.backendName).toBe("be_main");
		expect(snapshot.backends[0]?.advCheck).toBe("tcp-check");
		expect(snapshot.summary).toEqual({
			frontendCount: 1,
			backendCount: 1,
			serverCount: 2,
		});
	});

	it("withSnapshot clones state before applying edits and keeps summary in sync", () => {
		const current = createEmptySnapshot();
		const next = withSnapshot(current, (draft) => {
			draft.frontends.push({
				name: "fe_main",
				mode: "http",
				defaultBackend: null,
				binds: [{ name: "public", address: "127.0.0.1", port: 80 }],
				acls: [],
				backendSwitchingRules: [{ backendName: "be_main", cond: "if", condTest: "host_acl" }],
			});
			draft.backends.push({
				name: "be_main",
				mode: "http",
				balance: null,
				advCheck: null,
				servers: [{ name: "app_1", address: "10.0.0.10", port: 8080, check: null }],
			});
		});

		expect(current.frontends).toHaveLength(0);
		expect(current.backends).toHaveLength(0);
		expect(next.summary).toEqual({
			frontendCount: 1,
			backendCount: 1,
			serverCount: 1,
		});
	});
});
