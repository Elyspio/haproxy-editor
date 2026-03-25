import { Add, TuneOutlined } from "@mui/icons-material";
import { Box, Button, Divider, List, MenuItem, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { HaproxyResourceSnapshot } from "@modules/config/config.types";
import { Panel, SectionHeader } from "./ManagementWorkspace.shared";

type GlobalConfigSectionProps = {
	snapshot: HaproxyResourceSnapshot;
	updateSnapshot: (updater: (draft: HaproxyResourceSnapshot) => void) => void;
	focused: boolean;
};

export function GlobalConfigSection({ snapshot, updateSnapshot, focused }: Readonly<GlobalConfigSectionProps>) {
	const theme = useTheme();

	return (
		<Panel title="Globals & Defaults" subtitle="Core defaults and cluster-level settings" icon={<TuneOutlined fontSize="small" />} focused={focused}>
			<Stack sx={{ height: "100%", minHeight: 0 }}>
				<Box sx={{ p: 2, overflow: "auto" }}>
					<SectionHeader title="Editor" />
					<Stack spacing={2}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Box>
								<Typography variant="body1">Daemon mode</Typography>
								<Typography variant="body2" color="text.secondary">
									Control HAProxy process backgrounding
								</Typography>
							</Box>
							<Switch checked={snapshot.global.daemon} onChange={(_, checked) => updateSnapshot((draft) => void (draft.global.daemon = checked))} />
						</Stack>

						<Divider />

						<SectionHeader
							title="Defaults"
							action={
								<Button
									size="small"
									startIcon={<Add fontSize="small" />}
									onClick={() =>
										updateSnapshot((draft) => {
											draft.defaults.push({
												name: `defaults_${draft.defaults.length + 1}`,
												mode: "http",
											});
										})
									}
								>
									Add
								</Button>
							}
						/>

						<List disablePadding sx={{ display: "grid", gap: 1 }}>
							{snapshot.defaults.map((defaults, index) => (
								<Paper key={defaults.name || index} sx={{ p: 1.5, backgroundColor: alpha(theme.palette.background.default, 0.24) }}>
									<Stack spacing={1.25}>
										<TextField
											size="small"
											label="Name"
											value={defaults.name}
											onChange={(event) =>
												updateSnapshot((draft) => {
													draft.defaults[index].name = event.target.value;
												})
											}
										/>
										<TextField
											size="small"
											select
											label="Mode"
											value={defaults.mode ?? ""}
											onChange={(event) =>
												updateSnapshot((draft) => {
													draft.defaults[index].mode = event.target.value || null;
												})
											}
										>
											<MenuItem value="http">HTTP</MenuItem>
											<MenuItem value="tcp">TCP</MenuItem>
										</TextField>
									</Stack>
								</Paper>
							))}
						</List>
					</Stack>
				</Box>
			</Stack>
		</Panel>
	);
}
