import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { userManager } from "@apis/oidc.client";
import type { User } from "oidc-client-ts";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { setAuth } from "@modules/auth/auth.async.actions";
import { navigateToRoute } from "@/config/view.config";

type AuthContextType = {
	user: User | null;
	signIn: () => void;
	signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dispatch = useAppDispatch();

	const user = useAppSelector((x) => x.auth.user);

	const setUser = useCallback(
		(user: User | null) => {
			console.log("set user", user);
			dispatch(setAuth(user));
			navigateToRoute.root();
		},
		[dispatch]
	);

	useEffect(() => {
		userManager.getUser().then(setUser);
		userManager.events.addUserLoaded(setUser);
		userManager.events.addUserUnloaded(() => setUser(null));
	}, [setUser]);

	const authContextValue: AuthContextType = useMemo(() => {
		const signIn = () => userManager.signinRedirect();
		const signOut = () => userManager.signoutRedirect();

		return { user, signIn, signOut };
	}, [user]);

	return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthContext");
	return ctx;
};
