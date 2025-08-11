window["haproxy-editor"] ??= {}
window["haproxy-editor"].config = {
	endpoints: {
		apiUrl: "https://localhost:4000/api",
	},
	oauth: {
		authority: "https://auth.elyspio.fr/realms/apps/",
		clientId: "haproxy-editor",
		callbackUrl: "https://localhost:4000/oauth/callback"
	}
}