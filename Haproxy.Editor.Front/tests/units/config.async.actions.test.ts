import { Container } from "inversify";
import { describe, expect, it, vi } from "vitest";
import type { HaproxyResourceSnapshot } from "@modules/config/config.types";
import { syncConfig, validateConfig } from "@modules/config/config.async.actions";
import { ConfigService } from "@services/config.service";

vi.mock("react-toastify", () => ({
	toast: {
		error: vi.fn(),
	},
}));

const snapshot: HaproxyResourceSnapshot = {
	version: 5,
	global: { daemon: true },
	defaults: [],
	frontends: [],
	backends: [],
	summary: { frontendCount: 0, backendCount: 0, serverCount: 0 },
};

function createExtra(service: Pick<ConfigService, "validateConfig" | "updateConfig" | "getConfig">) {
	const container = new Container();
	container.bind(ConfigService).toConstantValue(service as ConfigService);
	return {
		container,
		idWindow: "web" as const,
	};
}

describe("config async actions", () => {
	it("syncConfig validates before persisting the current snapshot", async () => {
		const service = {
			getConfig: vi.fn(),
			validateConfig: vi.fn().mockResolvedValue({ success: true }),
			updateConfig: vi.fn().mockResolvedValue(undefined),
		};
		const dispatch = vi.fn();
		const getState = () => ({ config: { current: snapshot } });

		const action = await syncConfig()(dispatch, getState as never, createExtra(service));

		expect(action.meta.requestStatus).toBe("fulfilled");
		expect(service.validateConfig).toHaveBeenCalledWith(snapshot);
		expect(service.updateConfig).toHaveBeenCalledWith(snapshot);
		expect(action.payload).toEqual(snapshot);
	});

	it("validateConfig returns the validation result without mutating config", async () => {
		const service = {
			getConfig: vi.fn(),
			validateConfig: vi.fn().mockResolvedValue({ success: false, error: "invalid acl" }),
			updateConfig: vi.fn(),
		};
		const dispatch = vi.fn();
		const getState = () => ({ config: { current: snapshot } });

		const action = await validateConfig()(dispatch, getState as never, createExtra(service));

		expect(action.meta.requestStatus).toBe("fulfilled");
		expect(service.validateConfig).toHaveBeenCalledWith(snapshot);
		expect(service.updateConfig).not.toHaveBeenCalled();
		expect(action.payload).toEqual({ success: false, error: "invalid acl" });
	});
});
