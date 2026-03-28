import { Log, UserManager, type UserManagerSettings, WebStorageStateStore } from "oidc-client-ts";

const oauth = window["haproxy-editor"]?.config?.oauth ?? {
	authority: "https://oidc.invalid",
	clientId: "haproxy-editor-test",
	callbackUrl: "http://localhost/oauth/callback",
};
const oidcConfig: UserManagerSettings = {
	authority: oauth.authority,
	client_id: oauth.clientId,
	redirect_uri: oauth.callbackUrl,
	post_logout_redirect_uri: window.location.origin,
	silent_redirect_uri: oauth.callbackUrl,
	response_type: "code",
	scope: "openid profile email offline_access",
	automaticSilentRenew: true,
	accessTokenExpiringNotificationTimeInSeconds: 120,
	userStore: new WebStorageStateStore({ store: window.localStorage }),
	extraQueryParams: {
		kc_idp_hint: "google",
	},
};

Log.setLogger(console);
Log.setLevel(Log.INFO);

export const userManager = new UserManager(oidcConfig);
