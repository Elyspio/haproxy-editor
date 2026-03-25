import React, { createContext, useContext, useEffect, useMemo } from "react";
import type { User } from "oidc-client-ts";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { loadAuthSession, startSignIn, startSignOut } from "@modules/auth/auth.async.actions";

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
