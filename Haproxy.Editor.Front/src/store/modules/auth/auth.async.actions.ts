import { createAsyncActionGenerator, getService } from "@store/utils/utils.actions";
import { User } from "oidc-client-ts";
import { AuthService } from "@services/auth.service";
import { startApp } from "@modules/config/config.async.actions";
import { userManager } from "@apis/oidc.client";

const createAsyncThunk = createAsyncActionGenerator("auth");

/**
 * Modifie le token d'autentification
 * @param user Données lié à l'utilisateur connecté
 */
export const setAuth = createAsyncThunk("setAuth", async (user: User | null, { extra, dispatch }) => {
	const authService = getService(AuthService, extra);

	if (user?.expired) {
		console.warn("setAuth: user expired");
		return;
	}

	if (user) {
		authService.user = user;
	}

	dispatch(startApp());
});
