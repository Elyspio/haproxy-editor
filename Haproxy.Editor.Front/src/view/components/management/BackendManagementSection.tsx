import { Add, DeleteOutline, DnsOutlined } from "@mui/icons-material";
import { Box, Button, Chip, List, ListItemButton, ListItemText, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { HaproxyBackendResource, HaproxyFrontendResource, HaproxyResourceSnapshot } from "@modules/config/config.types";
import type { DashboardSelection, RuntimeBackendStatus } from "@modules/dashboard/dashboard.types";
import { Panel, SectionHeader } from "./ManagementWorkspace.shared";

type BackendManagementSectionProps = {
	snapshot: HaproxyResourceSnapshot;
	runtimeBackends: RuntimeBackendStatus[];
	frontendContext: HaproxyFrontendResource | null;
	backendCandidates: HaproxyBackendResource[];
	selectedBackend: HaproxyBackendResource | null;
	selectedRuntimeBackend: RuntimeBackendStatus | null;
	shouldFilterBackendPanel: boolean;
	updateSnapshot: (updater: (draft: HaproxyResourceSnapshot) => void) => void;
	setSelection: (nextSelection: DashboardSelection) => void;
	focused: boolean;
};

export function BackendManagementSection({
	snapshot,
	runtimeBackends,
	frontendContext,
	backendCandidates,
	selectedBackend,
	selectedRuntimeBackend,
	shouldFilterBackendPanel,
	updateSnapshot,
	setSelection,
	focused,
}: Readonly<BackendManagementSectionProps>) {
	const theme = useTheme();

	return (
		<Panel
			title="Backend Management"
			subtitle={
				shouldFilterBackendPanel && frontendContext
					? `${backendCandidates.length} linked backends for ${frontendContext.name}`
					: `${snapshot.backends.length} backends loaded`
			}
			icon={<DnsOutlined fontSize="small" />}
			focused={focused}
			actions={
				<Stack direction="row" spacing={1}>
					<Button
						size="small"
						variant="contained"
						startIcon={<Add fontSize="small" />}
						onClick={() => {
							const backendName = `backend_${snapshot.backends.length + 1}`;
							updateSnapshot((draft) => {
								draft.backends.push({
									name: backendName,
									mode: "http",
									balance: "roundrobin",
									servers: [{ name: `${backendName}_srv_1`, address: "10.0.0.1", port: 8080, check: "enabled" }],
								});
							});
							setSelection({ section: "backend", backendName, frontendName: shouldFilterBackendPanel ? frontendContext?.name : null });
						}}
					>
						Create
					</Button>
					<Button
						size="small"
						color="error"
						variant="outlined"
						startIcon={<DeleteOutline fontSize="small" />}
						disabled={!selectedBackend}
						onClick={() => {
							if (!selectedBackend) return;
							updateSnapshot((draft) => {
								draft.backends = draft.backends.filter((item) => item.name !== selectedBackend.name);
							});
							setSelection({ section: "backend", frontendName: shouldFilterBackendPanel ? frontendContext?.name : null });
						}}
					>
						Delete
					</Button>
				</Stack>
			}
		>
			<Box
				sx={{
					height: "100%",
					minHeight: 0,
					display: "grid",
					gridTemplateColumns: { xs: "1fr", lg: "320px minmax(0, 1fr)" },
					gridTemplateRows: { xs: "auto 1fr", lg: "1fr" },
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						p: 1.5,
						borderBottom: { xs: `1px solid ${theme.palette.divider}`, lg: "none" },
						borderRight: { xs: "none", lg: `1px solid ${theme.palette.divider}` },
						overflow: "auto",
					}}
				>
					{shouldFilterBackendPanel && frontendContext ? (
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
							Showing only the backends linked from {frontendContext.name}.
						</Typography>
					) : null}
					<List disablePadding sx={{ display: "grid", gap: 1 }}>
						{backendCandidates.map((backend) => {
							const runtime = runtimeBackends.find((item) => item.name === backend.name);
							return (
								<ListItemButton
									key={backend.name}
									selected={selectedBackend?.name === backend.name}
									onClick={() =>
										setSelection({
											section: "backend",
											frontendName: shouldFilterBackendPanel ? frontendContext?.name : null,
											backendName: backend.name,
										})
									}
									sx={{ border: `1px solid ${alpha(theme.palette.info.main, selectedBackend?.name === backend.name ? 0.35 : 0.12)}` }}
								>
									<ListItemText primary={backend.name} secondary={`${runtime?.status ?? "unknown"} ${backend.servers.length} servers`} />
								</ListItemButton>
							);
						})}
					</List>
				</Box>

				<Box sx={{ p: 2, overflow: "auto", minWidth: 0 }}>
					{selectedBackend ? (
						<Stack spacing={2}>
							<TextField
								size="small"
								label="Name"
								value={selectedBackend.name}
								onChange={(event) => {
									const nextName = event.target.value;
									updateSnapshot((draft) => {
										const backend = draft.backends.find((item) => item.name === selectedBackend.name);
										if (backend) backend.name = nextName;
									});
									setSelection({ section: "backend", frontendName: shouldFilterBackendPanel ? frontendContext?.name : null, backendName: nextName });
								}}
							/>
							<Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
								<TextField
									size="small"
									select
									label="Mode"
									fullWidth
									value={selectedBackend.mode ?? ""}
									onChange={(event) =>
										updateSnapshot((draft) => {
											const backend = draft.backends.find((item) => item.name === selectedBackend.name);
											if (backend) backend.mode = event.target.value || null;
										})
									}
								>
									<MenuItem value="http">HTTP</MenuItem>
									<MenuItem value="tcp">TCP</MenuItem>
								</TextField>
								<TextField
									size="small"
									label="Balance"
									fullWidth
									value={selectedBackend.balance ?? ""}
									onChange={(event) =>
										updateSnapshot((draft) => {
											const backend = draft.backends.find((item) => item.name === selectedBackend.name);
											if (backend) backend.balance = event.target.value || null;
										})
									}
								/>
							</Stack>

							{selectedRuntimeBackend ? (
								<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
									<Chip size="small" label={`Status ${selectedRuntimeBackend.status}`} color={selectedRuntimeBackend.downServers > 0 ? "warning" : "success"} />
									<Chip size="small" label={`Sessions ${selectedRuntimeBackend.currentSessions}`} />
									<Chip size="small" label={`Rate ${selectedRuntimeBackend.sessionRate}`} />
								</Stack>
							) : null}

							<SectionHeader
								title="Server Pool"
								action={
									<Button
										size="small"
										startIcon={<Add fontSize="small" />}
										onClick={() =>
											updateSnapshot((draft) => {
												const backend = draft.backends.find((item) => item.name === selectedBackend.name);
												backend?.servers.push({
													name: `${selectedBackend.name}_srv_${(backend?.servers.length ?? 0) + 1}`,
													address: "10.0.0.1",
													port: 8080,
													check: "enabled",
												});
											})
										}
									>
										Add server
									</Button>
								}
							/>
							<Stack spacing={1.25}>
								{selectedBackend.servers.map((server, index) => {
									const runtimeServer = selectedRuntimeBackend?.servers.find((item) => item.name === server.name);
									return (
										<Paper key={server.name || index} sx={{ p: 1.5, backgroundColor: alpha(theme.palette.background.default, 0.24) }}>
											<Stack spacing={1.25}>
												<Stack direction="row" alignItems="center" justifyContent="space-between">
													<Typography variant="body1">{server.name}</Typography>
													<Stack direction="row" spacing={1} alignItems="center">
														<Chip
															size="small"
															label={runtimeServer?.status ?? "unknown"}
															color={runtimeServer?.status === "down" ? "error" : runtimeServer?.status === "maintenance" ? "warning" : "success"}
														/>
														<Button
															size="small"
															color="error"
															variant="text"
															onClick={() =>
																updateSnapshot((draft) => {
																	const backend = draft.backends.find((item) => item.name === selectedBackend.name);
																	if (!backend) {
																		return;
																	}

																	backend.servers.splice(index, 1);
																})
															}
														>
															Remove
														</Button>
													</Stack>
												</Stack>
												<Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
													<TextField
														size="small"
														label="Address"
														fullWidth
														value={server.address ?? ""}
														onChange={(event) =>
															updateSnapshot((draft) => {
																const item = draft.backends.find((backend) => backend.name === selectedBackend.name)?.servers[index];
																if (item) item.address = event.target.value || null;
															})
														}
													/>
													<TextField
														size="small"
														label="Port"
														type="number"
														value={server.port ?? ""}
														onChange={(event) =>
															updateSnapshot((draft) => {
																const item = draft.backends.find((backend) => backend.name === selectedBackend.name)?.servers[index];
																if (item) item.port = event.target.value === "" ? null : Number(event.target.value);
															})
														}
													/>
												</Stack>
											</Stack>
										</Paper>
									);
								})}
							</Stack>
						</Stack>
					) : (
						<Typography color="text.secondary">
							{shouldFilterBackendPanel && frontendContext
								? `No backend is linked from ${frontendContext.name}. Use Mapping to create the first link.`
								: "No backend selected."}
						</Typography>
					)}
				</Box>
			</Box>
		</Panel>
	);
}
