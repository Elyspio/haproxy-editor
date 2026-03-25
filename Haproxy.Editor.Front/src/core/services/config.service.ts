import { inject, injectable } from "inversify";
import { Api } from "@apis/api";
import type { HaproxyResourceSnapshot } from "@modules/config/config.types";
import { normalizeSnapshot } from "@modules/config/config.utils";

type ValidateConfigResult = { success: true } | { success: false; error: string };

@injectable()
export class ConfigService {
	constructor(@inject(Api) private readonly api: Api) {}

	async getConfig(): Promise<HaproxyResourceSnapshot> {
		const { data } = await this.api.axios.get(`${this.api.baseUrl}/haproxy/config`);
		return normalizeSnapshot(data);
	}

	async updateConfig(config: HaproxyResourceSnapshot) {
		await this.api.axios.put(`${this.api.baseUrl}/haproxy/config`, config);
	}

	async validateConfig(config: HaproxyResourceSnapshot): Promise<ValidateConfigResult> {
		try {
			await this.api.axios.post(`${this.api.baseUrl}/haproxy/config/validate`, config);
			return { success: true };
		} catch (e: any) {
			const error = e.response?.data ?? e.message ?? "Unknown error";
			return { success: false, error: String(error) };
		}
	}
}
