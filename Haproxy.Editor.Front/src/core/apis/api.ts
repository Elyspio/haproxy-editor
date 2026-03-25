import { inject, injectable } from "inversify";
import type { AxiosInstance } from "axios";
import { AuthService } from "@services/auth.service";

@injectable()
export class Api {
	public readonly baseUrl: string;
	public readonly axios: AxiosInstance;

	constructor(@inject(AuthService) authService: AuthService) {
		this.baseUrl = window["haproxy-editor"].config.endpoints.apiUrl;
		this.axios = authService.axios;
	}
}
