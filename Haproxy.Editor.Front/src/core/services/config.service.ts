import {inject, injectable} from "inversify";
import {Api} from "@apis/api";
import type {HaproxyConfigurationFront} from "@modules/config/config.types";
import type {HaproxyConfiguration} from "@apis/generated";

type ValidateConfigResult = { success: boolean; error?: string };

@injectable()
export class ConfigService {
	@inject(Api)
	private readonly api: Api = null!;

	async getConfig(): Promise<[HaproxyConfiguration, HaproxyConfigurationFront]> {
		const result = await this.api.v1.getHaproxyConfig();

		const data = result.data;

		return [data, {
			raw: data.raw,
			global: data.global.join("\n"),
			defaults: data.defaults.join("\n"),
			frontends: Object.fromEntries(Object.entries<string[]>(data.frontends).map(([key, value]) => [key, value.join("\n")])),
			backends: Object.fromEntries(Object.entries<string[]>(data.backends).map(([key, value]) => [key, value.join("\n")])),
		}];
	}

	async updateConfig(config: HaproxyConfigurationFront) {
		await this.api.v1.saveHaproxyConfig(this.convertToApi(config));
	}

	async validateConfig(config: HaproxyConfigurationFront): Promise<ValidateConfigResult> {
		let success = false;
		let error: string | undefined = undefined;
		try {
			await this.api.v1.validateHaproxyConfig(this.convertToApi(config));
			success = true;
		} catch (e: any) {
			console.log("Configuration validation failed", e);
			error = e.response?.data ?? "Unknown error";
		}

		return {success, error};
	}

	private convertToApi(config: HaproxyConfigurationFront): HaproxyConfiguration {
		return {
			raw: config.raw,
			global: config.global.split("\n"),
			defaults: config.defaults.split("\n"),
			frontends: Object.fromEntries(Object.entries(config.frontends).map(([key, value]) => [key, value.split("\n")])),
			backends: Object.fromEntries(Object.entries(config.backends).map(([key, value]) => [key, value.split("\n")])),
		};
	}
}
