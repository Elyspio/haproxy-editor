import React from "react";
import { alpha } from "@mui/material/styles";
import { Box, Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import { useAuth } from "@/view/context/auth.context";
import { isValidJwt } from "@/core/helpers/jwt.helpers";
import HaproxyIcon from "@/view/icons/HaproxyIcon";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user } = useAuth();

	if (!user || !isValidJwt(user.access_token)) return <NotLoggedIn />;
	return <>{children}</>;
};

function NotLoggedIn() {
	const auth = useAuth();

	return (
		<Dialog
			open={true}
			maxWidth="sm"
			PaperProps={{
				sx: {
					width: "100%",
					maxWidth: 560,
					borderRadius: 4,
					overflow: "hidden",
					backgroundImage: "none",
					backdropFilter: "blur(18px)",
				},
			}}
			slotProps={{
				backdrop: {
					sx: {
						backgroundColor: alpha("#09111f", 0.58),
						backdropFilter: "blur(10px)",
					},
				},
			}}
		>
			<DialogContent sx={{ p: 0 }}>
				<Stack spacing={0} sx={{ minHeight: 320 }}>
					<Box
						sx={{
							p: { xs: 3, md: 4 },
							background: (theme) => `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.background.paper, 0.96)})`,
							borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
						}}
					>
						<HaproxyIcon />
					</Box>

					<Stack spacing={2.5} sx={{ p: { xs: 3, md: 4 } }}>
						<Stack spacing={1}>
							<Typography variant="h5">Authentication Required</Typography>
							<Typography variant="body1" color="text.secondary">
								Sign in to access the HAProxy cockpit, topology views, and configuration workspace.
							</Typography>
						</Stack>

						<Box
							sx={{
								p: 2,
								borderRadius: 3,
								backgroundColor: (theme) => alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.5 : 0.72),
								border: (theme) => `1px solid ${theme.palette.divider}`,
							}}
						>
							<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
								<Box>
									<Typography variant="subtitle2">Session status</Typography>
									<Typography variant="body2" color="text.secondary">
										No valid access token detected for this browser session.
									</Typography>
								</Box>
								<Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>
									Offline
								</Typography>
							</Stack>
						</Box>

						<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
							<Typography variant="body2" color="text.secondary">
								Use your configured identity provider to continue.
							</Typography>
							<Button variant="contained" size="large" onClick={auth.signIn}>
								Sign In
							</Button>
						</Stack>
					</Stack>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
