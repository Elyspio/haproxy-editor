import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userManager } from "@apis/oidc.client";
import { navigateToRoute } from "@/config/view.config";

const AuthCallback = () => {
	const navigate = useNavigate();

	useEffect(() => {
		userManager.signinCallback().then(navigateToRoute.root).catch(console.error);
	}, [navigate]);

	return <div>Authentification...</div>;
};

export default AuthCallback;
