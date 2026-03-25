window["haproxy-editor"] ??= {};

window["haproxy-editor"].config = {
	endpoints: {
		apiUrl: "https://localhost:3000/api",
	},
	oauth: {
		authority: "https://auth.elyspio.fr/realms/apps-dev/",
		clientId: "a-haproxy-editor",
		callbackUrl: "https://localhost:3000/oauth/callback",
	},
};
