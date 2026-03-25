import { injectable } from "inversify";
import type { User } from "oidc-client-ts";
import axios, { type AxiosInstance } from "axios";
import { userManager } from "@apis/oidc.client";

@injectable()
export class AuthService {
	#token?: string;

	private instance!: AxiosInstance;

	public get axios(): AxiosInstance {
		if (this.instance) return this.instance;

		this.instance = axios.create();

		this.instance.interceptors.request.use((config) => {
			config.headers["Authorization"] = `Bearer ${this.#token}`;

			return config;
		});

		return this.instance;
	}

	set user(user: User) {
		this.#token = user.access_token;
	}

	async getUser() {
		return await userManager.getUser();
	}

	async handleSigninCallback() {
		return await userManager.signinCallback();
	}

	signIn() {
		return userManager.signinRedirect();
	}

	signOut() {
		return userManager.signoutRedirect();
	}
}
