import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "@/config/view.config";
import { completeAuthCallback } from "@modules/auth/auth.async.actions";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";

export const AuthCallback = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.auth.user);

	useEffect(() => {
		void dispatch(completeAuthCallback());
	}, [dispatch]);

	useEffect(() => {
		if (user) {
			navigate(routes.dashboard.summary.path, { replace: true });
		}
	}, [navigate, user]);

	return <div>Authenticating...</div>;
};
