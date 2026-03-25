import type { ReactNode } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ConfigToolbar } from "@components/shared/ConfigToolbar";

export function Panel({
	title,
	subtitle,
	icon,
	actions,
	children,
	focused = false,
}: Readonly<{ title: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode; children: ReactNode; focused?: boolean }>) {
	const theme = useTheme();

	return (
		<Paper
			sx={{
				height: "100%",
				minHeight: 0,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				backgroundColor: theme.palette.background.paper,
				border: `1px solid ${alpha(focused ? theme.palette.primary.main : theme.palette.divider, focused ? 0.42 : 1)}`,
				boxShadow: focused
					? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}, 0 24px 48px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.24 : 0.08)}`
					: undefined,
				transition: theme.transitions.create(["border-color", "box-shadow", "background-color"]),
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				spacing={2}
				sx={{
					px: 2.25,
					py: 1.75,
					borderBottom: `1px solid ${alpha(focused ? theme.palette.primary.main : theme.palette.divider, focused ? 0.28 : 1)}`,
					background: focused ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(theme.palette.background.paper, 0.92)})` : "transparent",
				}}
			>
				<Stack direction="row" alignItems="center" spacing={1.25}>
					<Box
						sx={{
							display: "grid",
							placeItems: "center",
							width: 36,
							height: 36,
							borderRadius: 2.5,
							backgroundColor: alpha(theme.palette.primary.main, focused ? 0.22 : 0.14),
							color: focused ? theme.palette.primary.light : theme.palette.primary.main,
						}}
					>
						{icon}
					</Box>
					<Box>
						<Stack direction="row" spacing={1} alignItems="center">
							<Typography variant="h6">{title}</Typography>
							{focused ? <Chip size="small" color="primary" label="Active" /> : null}
						</Stack>
						{subtitle ? (
							<Typography variant="body2" color="text.secondary">
								{subtitle}
							</Typography>
						) : null}
					</Box>
				</Stack>
				<Stack direction="row" alignItems="center" spacing={1.5}>
					{actions}
					<ConfigToolbar />
				</Stack>
			</Stack>
			<Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{children}</Box>
		</Paper>
	);
}

export function SectionHeader({ title, action }: Readonly<{ title: string; action?: ReactNode }>) {
	return (
		<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
			<Typography variant="subtitle2">{title}</Typography>
			{action}
		</Stack>
	);
}
