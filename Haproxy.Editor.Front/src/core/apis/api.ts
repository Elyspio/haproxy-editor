import { inject, injectable } from "inversify";
import { V1Api } from "@apis/generated";
import { AuthService } from "@services/auth.service";

@injectable()
export class Api {
	public readonly v1: V1Api;

	@inject(AuthService)
	private readonly authService: AuthService = null!;

	constructor() {
		this.v1 = new V1Api(undefined, window["haproxy-editor"].endpoints.apiUrl, this.authService.axios);
	}
}
