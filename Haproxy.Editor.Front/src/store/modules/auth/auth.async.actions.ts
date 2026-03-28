import { createAsyncActionGenerator, getService } from "@store/utils/utils.actions";
import { User } from "oidc-client-ts";
import { AuthService } from "@services/auth.service";
import { startApp } from "@modules/config/config.async.actions";
import { loadDashboard } from "@modules/dashboard/dashboard.async.actions";

const createAsyncThunk = createAsyncActionGenerator("auth");

export const setAuth = createAsyncThunk("setAuth", async (user: User | null, { extra, dispatch }) => {
	const authService = getService(AuthService, extra);

	if (user?.expired) {
		console.warn("setAuth: user expired");
		return;
	}

	if (user) {
		authService.user = user;
		dispatch(startApp());
		dispatch(loadDashboard());
	}
});

export const loadAuthSession = createAsyncThunk(
	"loadAuthSession",
	async (_, { extra, dispatch }) => {
		const authService = getService(AuthService, extra);
		const user = await authService.getUser();
		const normalizedUser = user ?? null;
		await dispatch(setAuth(normalizedUser));
		return normalizedUser;
	},
	{ noPrefix: true }
);

export const completeAuthCallback = createAsyncThunk("completeAuthCallback", async (_, { extra, dispatch }) => {
	const authService = getService(AuthService, extra);
	const user = await authService.handleSigninCallback();
	const normalizedUser = user ?? null;
	await dispatch(setAuth(normalizedUser));
	return normalizedUser;
});

export const refreshAuthToken = createAsyncThunk("refreshAuthToken", async (_, { extra, dispatch }) => {
	const authService = getService(AuthService, extra);
	const renewed = await authService.silentRenew();
	const normalizedUser = renewed ?? null;
	if (normalizedUser) {
		authService.user = normalizedUser;
	}
	await dispatch(setAuth(normalizedUser));
	return normalizedUser;
});

export const startSignIn = createAsyncThunk("startSignIn", async (_, { extra }) => {
	const authService = getService(AuthService, extra);
	await authService.signIn();
});

export const startSignOut = createAsyncThunk("startSignOut", async (_, { extra }) => {
	const authService = getService(AuthService, extra);
	await authService.signOut();
});
