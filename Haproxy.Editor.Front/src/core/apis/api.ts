import { inject, injectable } from "inversify";
import { V1Api } from "@apis/generated";
import { AuthService } from "@services/auth.service";

@injectable()
export class Api {
	public readonly v1: V1Api;

	private readonly authService: AuthService = null!;

	constructor(@inject(AuthService) authService: AuthService) {
		this.authService = authService;
		this.v1 = new V1Api(undefined, window["haproxy-editor"].config.endpoints.apiUrl, this.authService.axios);
	}
}
