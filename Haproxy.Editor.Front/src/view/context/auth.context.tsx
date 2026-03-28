import React, { createContext, useContext, useEffect, useMemo } from "react";
import type { User } from "oidc-client-ts";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { loadAuthSession, refreshAuthToken, setAuth, startSignIn, startSignOut } from "@modules/auth/auth.async.actions";
import { userManager } from "@apis/oidc.client";

type AuthContextType = {
	user: User | null;
	signIn: () => void;
	signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dispatch = useAppDispatch();

	const user = useAppSelector((x) => x.auth.user);

	useEffect(() => {
		dispatch(loadAuthSession());
	}, [dispatch]);

	useEffect(() => {
		const onUserLoaded = (renewed: User) => {
			dispatch(setAuth(renewed));
		};

		const onUserUnloaded = () => {
			dispatch(setAuth(null));
		};

		const onAccessTokenExpiring = () => {
			dispatch(refreshAuthToken());
		};

		const onSilentRenewError = () => {
			console.warn("Silent token renewal failed");
		};

		userManager.events.addUserLoaded(onUserLoaded);
		userManager.events.addUserUnloaded(onUserUnloaded);
		userManager.events.addAccessTokenExpiring(onAccessTokenExpiring);
		userManager.events.addSilentRenewError(onSilentRenewError);

		return () => {
			userManager.events.removeUserLoaded(onUserLoaded);
			userManager.events.removeUserUnloaded(onUserUnloaded);
			userManager.events.removeAccessTokenExpiring(onAccessTokenExpiring);
			userManager.events.removeSilentRenewError(onSilentRenewError);
		};
	}, [dispatch]);

	const authContextValue: AuthContextType = useMemo(() => {
		const signIn = () => void dispatch(startSignIn());
		const signOut = () => void dispatch(startSignOut());

		return { user, signIn, signOut };
	}, [dispatch, user]);

	return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthContext");
	return ctx;
};
