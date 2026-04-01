import React from "react";
import { alpha, keyframes } from "@mui/material/styles";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useAuth } from "@/view/context/auth.context";
import { isValidJwt } from "@/core/helpers/jwt.helpers";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user } = useAuth();

	if (!user || !isValidJwt(user.access_token)) return <LoginPortal />;
	return <>{children}</>;
};

const pulseRing = keyframes`
	0% { transform: scale(0.85); opacity: 0.5; }
	50% { transform: scale(1.15); opacity: 0.15; }
	100% { transform: scale(0.85); opacity: 0.5; }
`;

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(18px); }
	to { opacity: 1; transform: translateY(0); }
`;

const scanLine = keyframes`
	0% { top: -2px; }
	100% { top: 100%; }
`;

function LoginPortal() {
	const auth = useAuth();

	return (
		<Box
			sx={{
				position: "fixed",
				inset: 0,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: (theme) =>
					theme.palette.mode === "dark"
						? `radial-gradient(ellipse 60% 50% at 50% 40%, ${alpha("#1a3a6e", 0.5)}, transparent 70%), #060c18`
						: `radial-gradient(ellipse 60% 50% at 50% 40%, ${alpha("#2f6fed", 0.12)}, transparent 70%), #e8edf5`,
				overflow: "hidden",
			}}
		>
			{/* Scan line effect */}
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					overflow: "hidden",
					pointerEvents: "none",
					"&::after": {
						content: '""',
						position: "absolute",
						left: 0,
						right: 0,
						height: "1px",
						background: (theme) => alpha(theme.palette.primary.main, 0.08),
						animation: `${scanLine} 6s linear infinite`,
					},
				}}
			/>

			{/* Subtle grid texture */}
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					opacity: 0.03,
					backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, currentColor 40px),
						repeating-linear-gradient(90deg, transparent, transparent 39px, currentColor 40px)`,
					backgroundSize: "40px 40px",
				}}
			/>

			<Stack
				alignItems="center"
				spacing={5}
				sx={{
					position: "relative",
					zIndex: 1,
					maxWidth: 520,
					px: 3,
					animation: `${fadeUp} 0.8s ease-out both`,
				}}
			>
				{/* Pulsing node graphic */}
				<Box sx={{ position: "relative", width: 120, height: 120 }}>
					<Box
						sx={{
							position: "absolute",
							inset: 0,
							borderRadius: "50%",
							border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							animation: `${pulseRing} 3s ease-in-out infinite`,
						}}
					/>
					<Box
						sx={{
							position: "absolute",
							inset: 16,
							borderRadius: "50%",
							border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
							animation: `${pulseRing} 3s ease-in-out 0.4s infinite`,
						}}
					/>
					<Box
						sx={{
							position: "absolute",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							width: 20,
							height: 20,
							borderRadius: "50%",
							backgroundColor: "primary.main",
							boxShadow: (theme) => `0 0 24px 6px ${alpha(theme.palette.primary.main, 0.35)}`,
						}}
					/>
					{/* Satellite nodes */}
					{[
						{ x: -8, y: -44 },
						{ x: 38, y: 22 },
						{ x: -38, y: 22 },
					].map((pos, i) => (
						<Box
							key={i}
							sx={{
								position: "absolute",
								top: "50%",
								left: "50%",
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: "primary.main",
								opacity: 0.6,
								transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
							}}
						/>
					))}
					{/* Connection lines */}
					<Box
						component="svg"
						viewBox="0 0 120 120"
						sx={{
							position: "absolute",
							inset: 0,
							overflow: "visible",
						}}
					>
						{[
							{ x1: 60, y1: 60, x2: 52, y2: 16 },
							{ x1: 60, y1: 60, x2: 98, y2: 82 },
							{ x1: 60, y1: 60, x2: 22, y2: 82 },
						].map((line, i) => (
							<line key={i} {...line} stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
						))}
					</Box>
				</Box>

				{/* Title block */}
				<Stack alignItems="center" spacing={1.5} sx={{ animation: `${fadeUp} 0.8s ease-out 0.15s both` }}>
					<Typography
						variant="h4"
						sx={{
							fontWeight: 700,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							textAlign: "center",
						}}
					>
						Haproxy Cockpit
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", maxWidth: 360, lineHeight: 1.6 }}>
						Authenticate with your identity provider to access the load balancer configuration workspace.
					</Typography>
				</Stack>

				{/* Status + Action */}
				<Stack alignItems="center" spacing={3} sx={{ animation: `${fadeUp} 0.8s ease-out 0.3s both`, width: "100%" }}>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.5,
							px: 2.5,
							py: 1,
							borderRadius: 2,
							border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
							backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.06),
						}}
					>
						<Box
							sx={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: "warning.main",
								boxShadow: (theme) => `0 0 8px ${alpha(theme.palette.warning.main, 0.6)}`,
							}}
						/>
						<Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: "0.04em" }}>
							No active session
						</Typography>
					</Box>

					<Button
						variant="contained"
						size="large"
						onClick={auth.signIn}
						sx={{
							px: 5,
							py: 1.5,
							fontSize: "0.95rem",
							letterSpacing: "0.06em",
							fontWeight: 700,
							borderRadius: 2,
							boxShadow: (theme) => `0 4px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
							"&:hover": {
								boxShadow: (theme) => `0 6px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
							},
						}}
					>
						Sign In
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
}
