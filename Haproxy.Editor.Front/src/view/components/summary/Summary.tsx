import { alpha, useTheme } from "@mui/material/styles";
import { Box, Chip, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { useAppSelector } from "@store/utils/utils.selectors";

function StatCard({ title, value, subtitle, tone, trend }: Readonly<{ title: string; value: number; subtitle: string; tone: string; trend: number[] }>) {
	const theme = useTheme();
	const colorMap = {
		critical: theme.palette.error.main,
		warning: theme.palette.warning.main,
		success: theme.palette.success.main,
		info: theme.palette.info.main,
		neutral: theme.palette.text.secondary,
	};
	const color = colorMap[tone as keyof typeof colorMap] ?? theme.palette.primary.main;
	const max = Math.max(...trend, 1);
	const points = trend.map((value, index) => `${(index / Math.max(trend.length - 1, 1)) * 100},${32 - (value / max) * 24}`).join(" ");

	return (
		<Paper sx={{ p: 2, minHeight: 148, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
			<Stack direction="row" justifyContent="space-between" spacing={2}>
				<Box>
					<Typography variant="subtitle2">{title}</Typography>
					<Typography sx={{ fontSize: 36, lineHeight: 1.05, fontWeight: 700, color }}>{value}</Typography>
				</Box>
				<Chip size="small" label={tone} sx={{ textTransform: "uppercase", fontWeight: 700, color, borderColor: alpha(color, 0.36) }} variant="outlined" />
			</Stack>
			<Box>
				<Typography variant="body2" color="text.secondary">
					{subtitle}
				</Typography>
				<Box sx={{ mt: 1.5, height: 42 }}>
					<svg width="100%" height="42" viewBox="0 0 100 32" preserveAspectRatio="none">
						<polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
					</svg>
				</Box>
			</Box>
		</Paper>
	);
}

export function Summary() {
	const theme = useTheme();
	const summary = useAppSelector((state) => state.dashboard.snapshot.summary);
	const alerts = useAppSelector((state) => state.dashboard.snapshot.alerts);

	return (
		<Stack spacing={2} sx={{ height: "100%", minHeight: 0, p: { xs: 1.5, md: 2 }, overflow: "hidden" }}>
			<Box>
				<Typography variant="h6">Summary</Typography>
				<Typography variant="body2" color="text.secondary">
					Operational cockpit with live routing and service health
				</Typography>
			</Box>

			<Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
				<StatCard {...summary.alerts} />
				<StatCard {...summary.routes} />
				<StatCard {...summary.services} />
			</Box>

			<Paper sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
				<Stack spacing={0.5} sx={{ px: 2.25, py: 1.75, borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Box>
						<Typography variant="h6">Active Alerts</Typography>
						<Typography variant="body2" color="text.secondary">
							Runtime {summary.runtimeStatus} · Generated {new Date(summary.generatedAt).toLocaleTimeString()}
						</Typography>
					</Box>
				</Stack>

				<Box sx={{ flex: 1, minHeight: 0, p: 1.5, overflow: "auto" }}>
					{alerts.length > 0 ? (
						<List disablePadding sx={{ display: "grid", gap: 1 }}>
							{alerts.map((alert) => (
								<ListItem
									key={alert.id}
									sx={{
										borderRadius: 2,
										border: `1px solid ${alpha(alert.severity === "critical" ? theme.palette.error.main : theme.palette.warning.main, 0.3)}`,
										backgroundColor: alpha(alert.severity === "critical" ? theme.palette.error.main : theme.palette.warning.main, 0.08),
									}}
								>
									<ListItemText
										primary={alert.message}
										secondary={`${alert.resourceType ?? "system"}${alert.resourceName ? ` · ${alert.resourceName}` : ""}`}
									/>
									<Chip size="small" label={alert.severity} color={alert.severity === "critical" ? "error" : "warning"} />
								</ListItem>
							))}
						</List>
					) : (
						<Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={1}>
							<Typography variant="h6">No active alerts</Typography>
							<Typography variant="body2" color="text.secondary">
								Use the dedicated Flow screen for the live topology map.
							</Typography>
						</Stack>
					)}
				</Box>
			</Paper>
		</Stack>
	);
}
