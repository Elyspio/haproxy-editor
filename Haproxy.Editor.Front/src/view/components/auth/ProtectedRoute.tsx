import React from "react";
import { Dialog, DialogContent, DialogTitle, Stack } from "@mui/material";
import Button from "@mui/material/Button";
import { useAuth } from "@/view/context/auth.context";
import { isValidJwt } from "@/core/helpers/jwt.helpers";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user } = useAuth();

	if (!user || !isValidJwt(user.access_token)) return <NotLoggedIn />;
	return <>{children}</>;
};

function NotLoggedIn() {
	const auth = useAuth();

	return (
		<Dialog open={true} maxWidth={"sm"}>
			<DialogTitle>Non connecté</DialogTitle>
			<DialogContent>
				<Stack spacing={2}>
					<p>Vous devez être connecté pour accéder à cette page.</p>

					<Button onClick={auth.signIn}>Connexion</Button>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
