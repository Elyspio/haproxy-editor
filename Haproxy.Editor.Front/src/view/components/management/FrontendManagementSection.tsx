import { Add, DeleteOutline, LanOutlined } from "@mui/icons-material";
import { Box, Button, Divider, List, ListItemButton, ListItemText, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { HaproxyFrontendResource, HaproxyResourceSnapshot } from "@modules/config/config.types";
import type { DashboardSelection } from "@modules/dashboard/dashboard.types";
import { Panel, SectionHeader } from "./ManagementWorkspace.shared";

type FrontendManagementSectionProps = {
	snapshot: HaproxyResourceSnapshot;
	frontendContext: HaproxyFrontendResource | null;
	frontendRelatedBackendNames: Set<string>;
	updateSnapshot: (updater: (draft: HaproxyResourceSnapshot) => void) => void;
	setSelection: (nextSelection: DashboardSelection) => void;
	focused: boolean;
};

export function FrontendManagementSection({
	snapshot,
	frontendContext,
	frontendRelatedBackendNames,
	updateSnapshot,
	setSelection,
	focused,
}: Readonly<FrontendManagementSectionProps>) {
	const theme = useTheme();

	return (
		<Panel
			title="Frontend Management"
			subtitle={`${snapshot.frontends.length} frontends loaded`}
			icon={<LanOutlined fontSize="small" />}
			focused={focused}
			actions={
				<Stack direction="row" spacing={1}>
					<Button
						size="small"
						variant="contained"
						startIcon={<Add fontSize="small" />}
						onClick={() => {
							const frontendName = `frontend_${snapshot.frontends.length + 1}`;
							updateSnapshot((draft) => {
								draft.frontends.push({
									name: frontendName,
									mode: "http",
									defaultBackend: draft.backends[0]?.name ?? null,
									binds: [{ name: `${frontendName}_bind`, address: "0.0.0.0", port: 80 }],
									acls: [],
									backendSwitchingRules: [],
								});
							});
							setSelection({ section: "frontend", frontendName });
						}}
					>
						Create
					</Button>
					<Button
						size="small"
						color="error"
						variant="outlined"
						startIcon={<DeleteOutline fontSize="small" />}
						disabled={!frontendContext}
						onClick={() => {
							if (!frontendContext) return;
							updateSnapshot((draft) => {
								draft.frontends = draft.frontends.filter((item) => item.name !== frontendContext.name);
							});
							setSelection({ section: "frontend" });
						}}
					>
						Delete
					</Button>
				</Stack>
			}
		>
			<Box sx={{ height: "100%", minHeight: 0, display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden" }}>
				<Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
					<List disablePadding sx={{ display: "grid", gap: 1 }}>
						{snapshot.frontends.map((frontend) => (
							<ListItemButton
								key={frontend.name}
								selected={frontendContext?.name === frontend.name}
								onClick={() => setSelection({ section: "frontend", frontendName: frontend.name })}
								sx={{ border: `1px solid ${alpha(theme.palette.primary.main, frontendContext?.name === frontend.name ? 0.35 : 0.12)}` }}
							>
								<ListItemText primary={frontend.name} secondary={`${frontend.mode ?? "tcp"} ${frontend.binds.length} binds`} />
							</ListItemButton>
						))}
					</List>
				</Box>

				<Box sx={{ p: 2, overflow: "auto" }}>
					{frontendContext ? (
						<Stack spacing={2}>
							<TextField
								size="small"
								label="Name"
								value={frontendContext.name}
								onChange={(event) => {
									const nextName = event.target.value;
									updateSnapshot((draft) => {
										const frontend = draft.frontends.find((item) => item.name === frontendContext.name);
										if (frontend) {
											frontend.name = nextName;
										}
									});
									setSelection({ section: "frontend", frontendName: nextName });
								}}
							/>
							<TextField
								size="small"
								select
								label="Mode"
								value={frontendContext.mode ?? ""}
								onChange={(event) =>
									updateSnapshot((draft) => {
										const frontend = draft.frontends.find((item) => item.name === frontendContext.name);
										if (frontend) frontend.mode = event.target.value || null;
									})
								}
							>
								<MenuItem value="http">HTTP</MenuItem>
								<MenuItem value="tcp">TCP</MenuItem>
							</TextField>

							<Divider />
							<SectionHeader title="Links" />
							<Stack spacing={1}>
								<Paper sx={{ p: 1.5, backgroundColor: alpha(theme.palette.background.default, 0.22) }}>
									<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
										<Box>
											<Typography variant="body1">ACL Library</Typography>
											<Typography variant="body2" color="text.secondary">
												{frontendContext.acls.length} ACLs attached to this frontend
											</Typography>
										</Box>
										<Button size="small" variant="outlined" onClick={() => setSelection({ section: "acl", frontendName: frontendContext.name })}>
											Open ACLs
										</Button>
									</Stack>
								</Paper>
								<Paper sx={{ p: 1.5, backgroundColor: alpha(theme.palette.background.default, 0.22) }}>
									<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
										<Box>
											<Typography variant="body1">Mapping</Typography>
											<Typography variant="body2" color="text.secondary">
												{frontendContext.backendSwitchingRules.length} routing rules and {frontendRelatedBackendNames.size} linked backends
											</Typography>
										</Box>
										<Button size="small" variant="outlined" onClick={() => setSelection({ section: "mapping", frontendName: frontendContext.name })}>
											Open Mapping
										</Button>
									</Stack>
								</Paper>
								<Paper sx={{ p: 1.5, backgroundColor: alpha(theme.palette.background.default, 0.22) }}>
									<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
										<Box>
											<Typography variant="body1">Linked Backends</Typography>
											<Typography variant="body2" color="text.secondary">
												Only related backends are shown when you navigate from this frontend
											</Typography>
										</Box>
										<Button size="small" variant="outlined" onClick={() => setSelection({ section: "backend", frontendName: frontendContext.name })}>
											Open Backends
										</Button>
									</Stack>
								</Paper>
							</Stack>

							<Divider />
							<SectionHeader
								title="Bind Interfaces"
								action={
									<Button
										size="small"
										startIcon={<Add fontSize="small" />}
										onClick={() =>
											updateSnapshot((draft) => {
												const frontend = draft.frontends.find((item) => item.name === frontendContext.name);
												frontend?.binds.push({
													name: `${frontendContext.name}_bind_${(frontend?.binds.length ?? 0) + 1}`,
													address: "0.0.0.0",
													port: 80,
												});
											})
										}
									>
										Add bind
									</Button>
								}
							/>
							<Stack spacing={1.25}>
								{frontendContext.binds.map((bind, index) => (
									<Paper key={bind.name || index} sx={{ p: 1.5, backgroundColor: alpha(theme.palette.background.default, 0.24) }}>
										<Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
											<TextField
												size="small"
												label="Name"
												fullWidth
												value={bind.name}
												onChange={(event) =>
													updateSnapshot((draft) => {
														const item = draft.frontends.find((frontend) => frontend.name === frontendContext.name)?.binds[index];
														if (item) item.name = event.target.value;
													})
												}
											/>
											<TextField
												size="small"
												label="Address"
												fullWidth
												value={bind.address ?? ""}
												onChange={(event) =>
													updateSnapshot((draft) => {
														const item = draft.frontends.find((frontend) => frontend.name === frontendContext.name)?.binds[index];
														if (item) item.address = event.target.value || null;
													})
												}
											/>
											<TextField
												size="small"
												label="Port"
												type="number"
												value={bind.port ?? ""}
												onChange={(event) =>
													updateSnapshot((draft) => {
														const item = draft.frontends.find((frontend) => frontend.name === frontendContext.name)?.binds[index];
														if (item) item.port = event.target.value === "" ? null : Number(event.target.value);
													})
												}
											/>
										</Stack>
									</Paper>
								))}
							</Stack>
						</Stack>
					) : (
						<Typography color="text.secondary">No frontend selected.</Typography>
					)}
				</Box>
			</Box>
		</Panel>
	);
}
