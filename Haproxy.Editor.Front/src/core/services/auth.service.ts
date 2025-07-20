import { injectable } from "inversify";
import type { User } from "oidc-client-ts";
import axios, { type AxiosInstance } from "axios";

@injectable()
export class AuthService {
	#token?: string;

	public get axios(): AxiosInstance {
		const instance = axios.create();

		instance.interceptors.request.use((config) => {
			config.headers["Authorization"] = `Bearer ${this.user}`;

			return config;
		});

		return instance;
	}

	get user(): string {
		return this.#token ?? "";
	}

	set user(user: User) {
		this.#token = user.access_token;
	}
}
