import { inject, injectable } from "inversify";
import { Api } from "@apis/api";
import { HaproxyConfiguration } from "@apis/generated/api";
import type { HaproxyConfigurationFront } from "@modules/config/config.types";

@injectable()
export class ConfigService {
	@inject(Api)
	private readonly api: Api = null!;

	async getConfig(): Promise<HaproxyConfigurationFront> {
		const result = await this.api.v1.getHaproxyConfig();

		const data = result.data;

		return {
			global: data.global.join("\n"),
			defaults: data.defaults.join("\n"),
			frontends: Object.fromEntries(Object.entries(data.frontends).map(([key, value]) => [key, value.join("\n")])),
			backends: Object.fromEntries(Object.entries(data.backends).map(([key, value]) => [key, value.join("\n")])),
		};
	}

	async updateConfig(config: HaproxyConfigurationFront) {
		await this.api.v1.saveHaproxyConfig({
			global: config.global.split("\n"),
			defaults: config.defaults.split("\n"),
			frontends: Object.fromEntries(Object.entries(config.frontends).map(([key, value]) => [key, value.split("\n")])),
			backends: Object.fromEntries(Object.entries(config.backends).map(([key, value]) => [key, value.split("\n")])),
		});
	}
}
