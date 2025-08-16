import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userManager } from "@apis/oidc.client";
import { navigateToRoute } from "@/config/view.config";
import { useAuth } from "@/view/context/auth.context";
import { isValidJwt } from "@/core/helpers/jwt.helpers";

export const AuthCallback = () => {
	const navigate = useNavigate();

	const auth = useAuth();

	useEffect(() => {
		(async () => {
			await userManager.signinCallback();
		})();
	}, [navigate]);

	useEffect(() => {
		if (auth.user && isValidJwt(auth.user.access_token)) {
			navigateToRoute.root();
		}
	}, [auth.user]);

	return <div>Authentification...</div>;
};
