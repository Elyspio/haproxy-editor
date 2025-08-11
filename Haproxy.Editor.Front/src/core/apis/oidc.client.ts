import { Log, UserManager, type UserManagerSettings, WebStorageStateStore } from "oidc-client-ts";

const oauth = window["haproxy-editor"].config.oauth;
const oidcConfig: UserManagerSettings = {
	authority: oauth.authority,
	client_id: oauth.clientId,
	redirect_uri: oauth.callbackUrl,
	post_logout_redirect_uri: window.location.origin,
	response_type: "code",
	scope: "openid profile email",
	userStore: new WebStorageStateStore({ store: window.localStorage }),
	extraQueryParams: {
		kc_idp_hint: "google"
	}
};

Log.setLogger(console);
Log.setLevel(Log.INFO);

export const userManager = new UserManager(oidcConfig);
