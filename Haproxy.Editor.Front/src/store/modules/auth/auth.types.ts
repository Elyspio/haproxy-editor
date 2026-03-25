import { User } from "oidc-client-ts";

export type AuthState = {
	/**
	 * Infos de l'utilisateur SSO
	 */
	user: User | null;
	/**
	 * Etape en cours de l'authentification
	 */
	step: AuthStep;
};

/**
 * Etape du cycle de vie d'une authentification.
 */
export enum AuthStep {
	Connected = "connected",
	/**
	 * Etat final déconnecté, aucune action possible.
	 */
	Disconnected = "disconnected",
}
