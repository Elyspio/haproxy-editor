import { Add, HubOutlined } from "@mui/icons-material";
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha, type Theme, useTheme } from "@mui/material/styles";
import { DataGrid, type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import type { HaproxyFrontendResource, HaproxyResourceSnapshot } from "@modules/config/config.types";
import type { DashboardSelection } from "@modules/dashboard/dashboard.types";
import { resolveAclPresetState } from "./acl.utils";
import { getConditionAclNames } from "./condition-expression.utils";
import { Panel } from "./ManagementWorkspace.shared";
import { ConditionExpressionEditor } from "./ConditionExpressionEditor";

type MappingSectionProps = {
	snapshot: HaproxyResourceSnapshot;
	frontendContext: HaproxyFrontendResource | null;
	mappingRules: HaproxyFrontendResource["backendSwitchingRules"];
	mappingAcls: HaproxyFrontendResource["acls"];
	frontendRelatedBackendNames: Set<string>;
	updateSnapshot: (updater: (draft: HaproxyResourceSnapshot) => void) => void;
	setSelection: (nextSelection: DashboardSelection) => void;
	createMappingRule: () => void;
	deleteMappingRule: (ruleIndex: number) => void;
	focused: boolean;
};

type MappingRuleRow = {
	id: number;
	routeLabel: string;
	routeKind: string;
	conditionSummary: string;
	backendName: string;
	operator: string;
};

function getBackendChipTone(backendName: string, theme: Theme) {
	let hash = 0;
	for (const char of backendName) {
		hash = (hash * 31 + char.charCodeAt(0)) % 360;
	}

	const hue = hash % 360;
	return {
		color: `hsl(${hue} 70% ${theme.palette.mode === "dark" ? "78%" : "28%"})`,
		backgroundColor: `hsl(${hue} 75% ${theme.palette.mode === "dark" ? "32%" : "90%"} / ${theme.palette.mode === "dark" ? "0.45" : "0.9"})`,
		borderColor: `hsl(${hue} 70% ${theme.palette.mode === "dark" ? "52%" : "62%"} / 0.85)`,
	};
}

function BackendMarker({ backendName }: Readonly<{ backendName: string }>) {
	const theme = useTheme();
	const tone = getBackendChipTone(backendName, theme);

	return (
		<Stack direction="row" spacing={0.875} alignItems="center" sx={{ minWidth: 0 }} height={"100%"}>
			<Box
				sx={{
					width: 10,
					height: 10,
					borderRadius: "50%",
					flexShrink: 0,
					backgroundColor: tone.borderColor,
					boxShadow: `0 0 0 3px ${tone.backgroundColor}`,
				}}
			/>
			<Typography variant="body2" fontWeight={600} noWrap color="text.primary">
				{backendName}
			</Typography>
		</Stack>
	);
}

function uniqueValues(values: string[]) {
	return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildRulePreview(rule: HaproxyFrontendResource["backendSwitchingRules"][number], aclLookup: Map<string, HaproxyFrontendResource["acls"][number]>) {
	const hostValues: string[] = [];
	const pathValues: string[] = [];
	const aclValues: string[] = [];

	for (const aclName of getConditionAclNames(rule.condTest)) {
		const acl = aclLookup.get(aclName);
		if (!acl) {
			continue;
		}

		const preset = resolveAclPresetState(acl);
		const primaryValue = preset.primary.trim();
		if (!primaryValue) {
			continue;
		}

		switch (preset.preset) {
			case "host":
			case "host_prefix":
			case "host_regex":
				hostValues.push(primaryValue);
				break;
			case "path_prefix":
			case "path_exact":
			case "path_regex":
				pathValues.push(primaryValue);
				break;
			default:
				aclValues.push(primaryValue);
				break;
		}
	}

	const uniqueHosts = uniqueValues(hostValues);
	const uniquePaths = uniqueValues(pathValues);
	const uniqueAclValues = uniqueValues(aclValues);
	const rawCondition = (rule.condTest ?? "").trim();

	if (uniqueHosts.length > 0) {
		return {
			routeLabel: uniqueHosts[0] ?? "Hostname",
			routeKind: "Hostname",
			conditionSummary: uniquePaths[0] ?? (rawCondition || "Host-based routing"),
		};
	}

	if (uniquePaths.length > 0) {
		return {
			routeLabel: uniquePaths[0] ?? "Path",
			routeKind: "Path",
			conditionSummary: rawCondition || "Path-based routing",
		};
	}

	if (uniqueAclValues.length > 0) {
		return {
			routeLabel: uniqueAclValues[0] ?? "ACL rule",
			routeKind: "ACL",
			conditionSummary: rawCondition || uniqueAclValues.join(", "),
		};
	}

	return {
		routeLabel: rawCondition || "Catch-all traffic",
		routeKind: rawCondition ? "Condition" : "Default",
		conditionSummary: rawCondition || "No explicit condition",
	};
}

export function MappingSection({
	snapshot,
	frontendContext,
	mappingRules,
	mappingAcls,
	frontendRelatedBackendNames,
	updateSnapshot,
	setSelection,
	createMappingRule,
	deleteMappingRule,
	focused,
}: Readonly<MappingSectionProps>) {
	const theme = useTheme();
	const [selectedRuleIndex, setSelectedRuleIndex] = useState<number | null>(null);

	const aclLookup = useMemo(() => new Map(mappingAcls.map((acl) => [acl.name, acl] as const)), [mappingAcls]);
	const aclOptions = useMemo(() => [...new Set(mappingAcls.map((acl) => acl.name))], [mappingAcls]);
	const ruleRows = useMemo<MappingRuleRow[]>(
		() =>
			mappingRules
				.map((rule, index) => {
					const preview = buildRulePreview(rule, aclLookup);
					return {
						id: index,
						...preview,
						backendName: rule.backendName || "No backend",
						operator: rule.cond ?? "if",
					};
				})
				.sort((left, right) => {
					const routeKindOrder = { Hostname: 0, Path: 1, ACL: 2, Condition: 3, Default: 4 };
					const leftRank = routeKindOrder[left.routeKind as keyof typeof routeKindOrder] ?? 99;
					const rightRank = routeKindOrder[right.routeKind as keyof typeof routeKindOrder] ?? 99;
					if (leftRank !== rightRank) {
						return leftRank - rightRank;
					}

					const labelComparison = left.routeLabel.localeCompare(right.routeLabel, undefined, { sensitivity: "base" });
					if (labelComparison !== 0) {
						return labelComparison;
					}

					return left.backendName.localeCompare(right.backendName, undefined, { sensitivity: "base" });
				}),
		[aclLookup, mappingRules],
	);

	const effectiveSelectedRuleIndex =
		mappingRules.length === 0 ? null : selectedRuleIndex !== null && ruleRows.some((row) => row.id === selectedRuleIndex) ? selectedRuleIndex : (ruleRows[0]?.id ?? null);

	const selectedRule = effectiveSelectedRuleIndex === null ? null : (mappingRules[effectiveSelectedRuleIndex] ?? null);
	const selectedRuleRow = effectiveSelectedRuleIndex === null ? null : (ruleRows.find((row) => row.id === effectiveSelectedRuleIndex) ?? null);
	const rowSelectionModel: GridRowSelectionModel = {
		type: "include",
		ids: effectiveSelectedRuleIndex === null ? new Set() : new Set([effectiveSelectedRuleIndex]),
	};

	const gridColumns = useMemo<GridColDef<MappingRuleRow>[]>(
		() => [
			{
				field: "routeLabel",
				headerName: "Hostname / Path",
				flex: 1.35,
				minWidth: 220,
				sortable: true,
				renderCell: ({ row }) => (
					<Stack sx={{ py: 0.75, minWidth: 0 }}>
						<Typography variant="body2" fontWeight={600} noWrap>
							{row.routeLabel}
						</Typography>
						<Typography variant="caption" color="text.secondary" noWrap>
							{row.routeKind}
						</Typography>
					</Stack>
				),
			},
			{
				field: "backendName",
				headerName: "Backend",
				flex: 0.9,
				minWidth: 150,
				sortable: true,
				renderCell: ({ row }) => <BackendMarker backendName={row.backendName} />,
			},
			{
				field: "operator",
				headerName: "Operator",
				width: 95,
				sortable: false,
			},
		],
		[],
	);

	return (
		<Panel
			title="Mapping"
			subtitle={frontendContext ? `Frontend ${frontendContext.name} to backend and ACL relationships` : "Select a frontend to manage its routing links"}
			icon={<HubOutlined fontSize="small" />}
			focused={focused}
			actions={
				<Stack direction="row" spacing={1}>
					<Button
						size="small"
						variant="contained"
						startIcon={<Add fontSize="small" />}
						disabled={!frontendContext || snapshot.backends.length === 0}
						onClick={() => {
							setSelectedRuleIndex(mappingRules.length);
							createMappingRule();
						}}
					>
						Add Rule
					</Button>
					<Button
						size="small"
						variant="outlined"
						disabled={!frontendContext}
						onClick={() => frontendContext && setSelection({ section: "acl", frontendName: frontendContext.name })}
					>
						Open ACLs
					</Button>
				</Stack>
			}
		>
			<Box sx={{ height: "100%", minHeight: 0, display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", overflow: "hidden" }}>
				<Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Stack spacing={1.5}>
						<TextField
							size="small"
							select
							label="Frontend"
							fullWidth
							value={frontendContext?.name ?? ""}
							onChange={(event) => setSelection({ section: "mapping", frontendName: event.target.value })}
						>
							{snapshot.frontends.map((frontend) => (
								<MenuItem key={frontend.name} value={frontend.name}>
									{frontend.name}
								</MenuItem>
							))}
						</TextField>
						{frontendContext ? (
							<>
								<TextField
									size="small"
									select
									label="Default Backend"
									value={frontendContext.defaultBackend ?? ""}
									onChange={(event) =>
										updateSnapshot((draft) => {
											const frontend = draft.frontends.find((item) => item.name === frontendContext.name);
											if (frontend) {
												frontend.defaultBackend = event.target.value || null;
											}
										})
									}
								>
									<MenuItem value="">None</MenuItem>
									{snapshot.backends.map((backend) => (
										<MenuItem key={backend.name} value={backend.name}>
											{backend.name}
										</MenuItem>
									))}
								</TextField>
								<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
									<Chip size="small" label={`${mappingAcls.length} available ACLs`} />
									<Chip size="small" label={`${mappingRules.length} routing rules`} />
									<Chip
										size="small"
										label={`${frontendRelatedBackendNames.size} linked backends`}
										color={frontendRelatedBackendNames.size > 0 ? "info" : "default"}
									/>
								</Stack>
							</>
						) : null}
					</Stack>
				</Box>

				<Box sx={{ minHeight: 0, overflow: "hidden", p: 1.5 }}>
					{frontendContext ? (
						mappingRules.length > 0 ? (
							<Box
								sx={{
									height: "100%",
									minHeight: 0,
									display: "grid",
									gap: 1.5,
									gridTemplateColumns: { xs: "1fr", xl: "minmax(320px, 38%) minmax(0, 1fr)" },
									gridTemplateRows: { xs: "minmax(280px, 0.9fr) minmax(0, 1fr)", xl: "1fr" },
								}}
							>
								<Paper
									sx={{
										minHeight: 0,
										overflow: "hidden",
										display: "flex",
										flexDirection: "column",
										backgroundColor: alpha(theme.palette.background.default, 0.18),
										border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
									}}
								>
									<Box sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}>
										<Stack spacing={0.5}>
											<Typography variant="subtitle2">Routing rules</Typography>
											<Typography variant="body2" color="text.secondary">
												Select a route on the left to edit its target backend and condition details.
											</Typography>
										</Stack>
									</Box>
									<Box sx={{ flex: 1, minHeight: 0 }}>
										<DataGrid
											rows={ruleRows}
											columns={gridColumns}
											rowSelectionModel={rowSelectionModel}
											onRowSelectionModelChange={(nextSelection) => {
												const nextId = nextSelection.ids.values().next().value;
												if (typeof nextId === "number") {
													setSelectedRuleIndex(nextId);
												}
											}}
											hideFooter
											disableColumnMenu
											disableMultipleRowSelection
											density="compact"
											rowHeight={64}
											sx={{
												border: "none",
												"& .MuiDataGrid-cell": {
													borderBottomColor: alpha(theme.palette.divider, 0.65),
												},
												"& .MuiDataGrid-columnHeaders": {
													backgroundColor: alpha(theme.palette.background.paper, 0.72),
													borderBottomColor: alpha(theme.palette.divider, 0.9),
												},
												"& .MuiDataGrid-row:hover": {
													backgroundColor: alpha(theme.palette.primary.main, 0.05),
												},
												"& .MuiDataGrid-row.Mui-selected": {
													backgroundColor: alpha(theme.palette.primary.main, 0.1),
												},
												"& .MuiDataGrid-row.Mui-selected:hover": {
													backgroundColor: alpha(theme.palette.primary.main, 0.14),
												},
											}}
										/>
									</Box>
								</Paper>

								<Paper
									sx={{
										p: 1.5,
										minHeight: 0,
										overflow: "auto",
										backgroundColor: alpha(theme.palette.background.default, 0.24),
										border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
									}}
								>
									{selectedRule && selectedRuleRow ? (
										<Stack spacing={1.25}>
											<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
												<Box>
													<Typography variant="h6">{selectedRuleRow.routeLabel}</Typography>
													<Typography variant="body2" color="text.secondary">
														{selectedRuleRow.routeKind} · {selectedRuleRow.conditionSummary}
													</Typography>
												</Box>
												<Button size="small" color="error" variant="text" onClick={() => deleteMappingRule(effectiveSelectedRuleIndex ?? 0)}>
													Delete
												</Button>
											</Stack>

											<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
												<Chip size="small" variant="outlined" label={selectedRuleRow.routeKind} />
												<BackendMarker backendName={selectedRule.backendName || "No backend"} />
											</Stack>

											<TextField
												size="small"
												select
												label="Backend"
												value={selectedRule.backendName}
												onChange={(event) =>
													updateSnapshot((draft) => {
														const frontend = draft.frontends.find((item) => item.name === frontendContext.name);
														const currentRule = frontend?.backendSwitchingRules[effectiveSelectedRuleIndex ?? 0];
														if (currentRule) {
															currentRule.backendName = event.target.value;
														}
													})
												}
											>
												{snapshot.backends.map((backend) => (
													<MenuItem key={backend.name} value={backend.name}>
														{backend.name}
													</MenuItem>
												))}
											</TextField>

											<TextField
												size="small"
												select
												label="Operator"
												fullWidth
												value={selectedRule.cond ?? "if"}
												onChange={(event) =>
													updateSnapshot((draft) => {
														const frontend = draft.frontends.find((item) => item.name === frontendContext.name);
														const currentRule = frontend?.backendSwitchingRules[effectiveSelectedRuleIndex ?? 0];
														if (currentRule) {
															currentRule.cond = event.target.value || null;
														}
													})
												}
											>
												<MenuItem value="if">if</MenuItem>
												<MenuItem value="unless">unless</MenuItem>
											</TextField>

											<ConditionExpressionEditor
												value={selectedRule.condTest}
												aclOptions={aclOptions}
												updateValue={(nextValue) =>
													updateSnapshot((draft) => {
														const frontend = draft.frontends.find((item) => item.name === frontendContext.name);
														const currentRule = frontend?.backendSwitchingRules[effectiveSelectedRuleIndex ?? 0];
														if (currentRule) {
															currentRule.condTest = nextValue;
														}
													})
												}
												helperText="Build nested ACL combinations with AND, OR, NOT and parentheses. Use raw mode for unsupported expressions."
											/>
										</Stack>
									) : (
										<Typography color="text.secondary">Select a routing rule to edit it.</Typography>
									)}
								</Paper>
							</Box>
						) : (
							<Stack spacing={1.5} alignItems="flex-start" justifyContent="center" sx={{ height: "100%" }}>
								<Typography color="text.secondary">No routing rule on this frontend yet.</Typography>
								<Button
									size="small"
									variant="contained"
									startIcon={<Add fontSize="small" />}
									disabled={snapshot.backends.length === 0}
									onClick={() => {
										setSelectedRuleIndex(mappingRules.length);
										createMappingRule();
									}}
								>
									Add Rule
								</Button>
							</Stack>
						)
					) : (
						<Typography color="text.secondary">No frontend selected.</Typography>
					)}
				</Box>
			</Box>
		</Panel>
	);
}
