import { Add, DeleteOutline, Inventory2Outlined } from "@mui/icons-material";
import { Box, Button, Chip, Divider, List, ListItemButton, ListItemText, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { HaproxyResourceSnapshot } from "@modules/config/config.types";
import type { DashboardSelection } from "@modules/dashboard/dashboard.types";
import { ACL_PRESET_OPTIONS, type AclCatalogEntry, type AclPresetId, buildAclFromPresetState, replaceAclReferences, resolveAclPresetState } from "./acl.utils";
import { Panel, SectionHeader } from "./ManagementWorkspace.shared";

type AclLibrarySectionProps = {
	snapshot: HaproxyResourceSnapshot;
	aclFrontendName: string | null;
	groupedAclEntries: Array<{ kindLabel: string; entries: AclCatalogEntry[] }>;
	selectedAclEntry: AclCatalogEntry | null;
	selectedAclUsages: AclCatalogEntry["usages"];
	updateSnapshot: (updater: (draft: HaproxyResourceSnapshot) => void) => void;
	setSelection: (nextSelection: DashboardSelection) => void;
	createAcl: (frontendName?: string | null) => void;
	moveSelectedAcl: (nextFrontendName: string) => void;
	deleteSelectedAcl: () => void;
	focused: boolean;
};

export function AclLibrarySection({
	snapshot,
	aclFrontendName,
	groupedAclEntries,
	selectedAclEntry,
	selectedAclUsages,
	updateSnapshot,
	setSelection,
	createAcl,
	moveSelectedAcl,
	deleteSelectedAcl,
	focused,
}: Readonly<AclLibrarySectionProps>) {
	const theme = useTheme();
	const selectedAclPreset = selectedAclEntry ? resolveAclPresetState(selectedAclEntry.acl) : null;

	return (
		<Panel
			title="ACL Library"
			subtitle={aclFrontendName ? `ACLs scoped to ${aclFrontendName}` : "Frontend-scoped ACL catalog"}
			icon={<Inventory2Outlined fontSize="small" />}
			focused={focused}
			actions={
				<Stack direction="row" spacing={1}>
					<Button size="small" variant="contained" startIcon={<Add fontSize="small" />} disabled={!aclFrontendName} onClick={() => createAcl(aclFrontendName)}>
						Create
					</Button>
					<Button
						size="small"
						color="error"
						variant="outlined"
						startIcon={<DeleteOutline fontSize="small" />}
						disabled={!selectedAclEntry || selectedAclUsages.length > 0}
						onClick={deleteSelectedAcl}
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
					gridTemplateColumns: { xs: "1fr", lg: "340px minmax(0, 1fr)" },
					gridTemplateRows: { xs: "auto 1fr", lg: "1fr" },
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						display: "grid",
						gridTemplateRows: "auto minmax(0, 1fr)",
						minHeight: 0,
						borderBottom: { xs: `1px solid ${theme.palette.divider}`, lg: "none" },
						borderRight: { xs: "none", lg: `1px solid ${theme.palette.divider}` },
					}}
				>
					<Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
						<TextField
							size="small"
							select
							label="Frontend"
							fullWidth
							value={aclFrontendName ?? ""}
							onChange={(event) => setSelection({ section: "acl", frontendName: event.target.value })}
						>
							{snapshot.frontends.map((frontend) => (
								<MenuItem key={frontend.name} value={frontend.name}>
									{frontend.name}
								</MenuItem>
							))}
						</TextField>
					</Box>

					<Box sx={{ p: 1.5, minHeight: 0, overflow: "auto" }}>
						<SectionHeader
							title="Catalog"
							action={
								selectedAclEntry ? (
									<Chip size="small" label={`${selectedAclUsages.length} references`} color={selectedAclUsages.length > 0 ? "warning" : "default"} />
								) : null
							}
						/>
						{groupedAclEntries.length > 0 ? (
							<Stack spacing={1.5} sx={{ pr: 0.5 }}>
								{groupedAclEntries.map((group) => (
									<Box key={group.kindLabel}>
										<Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
											{group.kindLabel}
										</Typography>
										<List disablePadding sx={{ display: "grid", gap: 1 }}>
											{group.entries.map((entry) => (
												<ListItemButton
													key={entry.id}
													selected={selectedAclEntry?.id === entry.id}
													onClick={() => setSelection({ section: "acl", frontendName: entry.frontendName, aclName: entry.acl.name })}
													sx={{
														alignItems: "flex-start",
														border: `1px solid ${alpha(theme.palette.primary.main, selectedAclEntry?.id === entry.id ? 0.35 : 0.08)}`,
														backgroundColor: selectedAclEntry?.id === entry.id ? alpha(theme.palette.primary.main, 0.08) : undefined,
													}}
												>
													<ListItemText
														primary={entry.acl.name}
														secondary={`${entry.acl.criterion ?? "match"} · ${entry.usageCount} uses${entry.duplicateCount > 1 ? ` · ${entry.duplicateCount} definitions` : ""}`}
													/>
												</ListItemButton>
											))}
										</List>
									</Box>
								))}
							</Stack>
						) : (
							<Typography variant="body2" color="text.secondary">
								No ACL on this frontend yet.
							</Typography>
						)}
					</Box>
				</Box>

				<Box sx={{ minHeight: 0, overflow: "auto", p: 1.5 }}>
					{selectedAclEntry ? (
						<Stack spacing={2}>
							<SectionHeader title="Editor" />
							{selectedAclEntry.duplicateCount > 1 ? (
								<Paper sx={{ p: 1.25, backgroundColor: alpha(theme.palette.info.main, 0.08) }}>
									<Typography variant="body2" color="text.secondary">
										This ACL name has {selectedAclEntry.duplicateCount} definitions on this frontend. Edits apply to the grouped definitions.
									</Typography>
								</Paper>
							) : null}
							<TextField
								size="small"
								select
								label="Frontend"
								value={selectedAclEntry.frontendName}
								disabled={selectedAclUsages.length > 0}
								onChange={(event) => moveSelectedAcl(event.target.value)}
								helperText={selectedAclUsages.length > 0 ? "Move is disabled while this ACL is referenced." : "ACLs are scoped to one frontend."}
							>
								{snapshot.frontends.map((frontend) => (
									<MenuItem key={frontend.name} value={frontend.name}>
										{frontend.name}
									</MenuItem>
								))}
							</TextField>
							<TextField
								size="small"
								label="Name"
								value={selectedAclEntry.acl.name}
								onChange={(event) => {
									const nextName = event.target.value;
									updateSnapshot((draft) => {
										const frontend = draft.frontends.find((item) => item.name === selectedAclEntry.frontendName);
										const matchingAcls = frontend?.acls.filter((item) => item.name === selectedAclEntry.acl.name) ?? [];
										if (matchingAcls.length > 0) {
											const previousName = selectedAclEntry.acl.name;
											matchingAcls.forEach((acl) => {
												acl.name = nextName;
											});
											frontend?.backendSwitchingRules.forEach((rule) => {
												rule.condTest = replaceAclReferences(rule.condTest, previousName, nextName);
											});
										}
									});
									setSelection({ section: "acl", frontendName: selectedAclEntry.frontendName, aclName: nextName });
								}}
							/>
							<TextField
								size="small"
								select
								label="ACL Kind"
								value={selectedAclPreset?.preset ?? "custom"}
								onChange={(event) =>
									updateSnapshot((draft) => {
										const frontend = draft.frontends.find((item) => item.name === selectedAclEntry.frontendName);
										const matchingAcls = frontend?.acls.filter((item) => item.name === selectedAclEntry.acl.name) ?? [];
										const nextPreset = event.target.value as AclPresetId;
										const nextPresetState =
											selectedAclPreset?.preset === "custom"
												? { preset: nextPreset, primary: "", secondary: "" }
												: { ...(selectedAclPreset ?? { preset: "custom", primary: "", secondary: "" }), preset: nextPreset };
										const nextAcl = buildAclFromPresetState(nextPresetState);
										matchingAcls.forEach((acl) => {
											acl.criterion = nextAcl.criterion;
											acl.value = nextAcl.value;
										});
									})
								}
							>
								{ACL_PRESET_OPTIONS.map((option) => (
									<MenuItem key={option.value} value={option.value}>
										{option.label}
									</MenuItem>
								))}
							</TextField>

							{selectedAclPreset?.preset === "path_prefix" ? (
								<PresetField
									selectedAclEntry={selectedAclEntry}
									selectedAclPreset={selectedAclPreset}
									updateSnapshot={updateSnapshot}
									label="Path Prefix"
									field="primary"
								/>
							) : null}
							{selectedAclPreset?.preset === "path_exact" ? (
								<PresetField
									selectedAclEntry={selectedAclEntry}
									selectedAclPreset={selectedAclPreset}
									updateSnapshot={updateSnapshot}
									label="Path"
									field="primary"
								/>
							) : null}
							{selectedAclPreset?.preset === "path_regex" ? (
								<PresetField
									selectedAclEntry={selectedAclEntry}
									selectedAclPreset={selectedAclPreset}
									updateSnapshot={updateSnapshot}
									label="Path Regex"
									field="primary"
								/>
							) : null}
							{selectedAclPreset?.preset === "host" ? (
								<PresetField
									selectedAclEntry={selectedAclEntry}
									selectedAclPreset={selectedAclPreset}
									updateSnapshot={updateSnapshot}
									label="Host"
									field="primary"
								/>
							) : null}
							{selectedAclPreset?.preset === "host_prefix" ? (
								<PresetField
									selectedAclEntry={selectedAclEntry}
									selectedAclPreset={selectedAclPreset}
									updateSnapshot={updateSnapshot}
									label="Host Prefix"
									field="primary"
								/>
							) : null}
							{selectedAclPreset?.preset === "host_regex" ? (
								<PresetField
									selectedAclEntry={selectedAclEntry}
									selectedAclPreset={selectedAclPreset}
									updateSnapshot={updateSnapshot}
									label="Host Regex"
									field="primary"
								/>
							) : null}
							{selectedAclPreset?.preset === "source" ? (
								<PresetField
									selectedAclEntry={selectedAclEntry}
									selectedAclPreset={selectedAclPreset}
									updateSnapshot={updateSnapshot}
									label="Source IP / CIDR"
									field="primary"
								/>
							) : null}
							{selectedAclPreset?.preset === "method" ? (
								<PresetField
									selectedAclEntry={selectedAclEntry}
									selectedAclPreset={selectedAclPreset}
									updateSnapshot={updateSnapshot}
									label="HTTP Method"
									field="primary"
								/>
							) : null}
							{selectedAclPreset?.preset === "header" || selectedAclPreset?.preset === "header_regex" ? (
								<Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
									<PresetField
										selectedAclEntry={selectedAclEntry}
										selectedAclPreset={selectedAclPreset}
										updateSnapshot={updateSnapshot}
										label="Header Name"
										field="primary"
										fullWidth
									/>
									<PresetField
										selectedAclEntry={selectedAclEntry}
										selectedAclPreset={selectedAclPreset}
										updateSnapshot={updateSnapshot}
										label={selectedAclPreset.preset === "header" ? "Header Value" : "Header Regex"}
										field="secondary"
										fullWidth
									/>
								</Stack>
							) : null}
							{selectedAclPreset?.preset === "custom" ? (
								<Stack spacing={1.25}>
									<PresetField
										selectedAclEntry={selectedAclEntry}
										selectedAclPreset={selectedAclPreset}
										updateSnapshot={updateSnapshot}
										label="Condition Type"
										field="primary"
									/>
									<PresetField
										selectedAclEntry={selectedAclEntry}
										selectedAclPreset={selectedAclPreset}
										updateSnapshot={updateSnapshot}
										label="Value"
										field="secondary"
									/>
								</Stack>
							) : null}

							<Divider />
							<SectionHeader
								title="Used By"
								action={
									<Button size="small" variant="text" onClick={() => setSelection({ section: "mapping", frontendName: selectedAclEntry.frontendName })}>
										Open mapping
									</Button>
								}
							/>
							{selectedAclUsages.length > 0 ? (
								<Stack spacing={1}>
									{selectedAclUsages.map((usage) => (
										<Paper key={usage.id} sx={{ p: 1.25, backgroundColor: alpha(theme.palette.warning.main, 0.08) }}>
											<Stack spacing={0.5}>
												<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
													<Typography variant="body1">{usage.backendName}</Typography>
													<Chip size="small" label={usage.cond ?? "if"} color="warning" />
												</Stack>
												<Typography variant="body2" color="text.secondary">
													{usage.condTest ?? "No condition expression"}
												</Typography>
											</Stack>
										</Paper>
									))}
								</Stack>
							) : (
								<Paper sx={{ p: 1.25, backgroundColor: alpha(theme.palette.success.main, 0.08) }}>
									<Typography variant="body2" color="text.secondary">
										This ACL is not referenced by any mapping rule.
									</Typography>
								</Paper>
							)}
						</Stack>
					) : (
						<Stack spacing={1.5} alignItems="flex-start" justifyContent="center" sx={{ height: "100%" }}>
							<Typography color="text.secondary">Select an ACL from the current frontend or create a new one.</Typography>
							<Button size="small" variant="contained" startIcon={<Add fontSize="small" />} disabled={!aclFrontendName} onClick={() => createAcl(aclFrontendName)}>
								Create ACL
							</Button>
						</Stack>
					)}
				</Box>
			</Box>
		</Panel>
	);
}

type PresetFieldProps = {
	selectedAclEntry: AclCatalogEntry;
	selectedAclPreset: NonNullable<ReturnType<typeof resolveAclPresetState>>;
	updateSnapshot: (updater: (draft: HaproxyResourceSnapshot) => void) => void;
	label: string;
	field: "primary" | "secondary";
	fullWidth?: boolean;
};

function PresetField({ selectedAclEntry, selectedAclPreset, updateSnapshot, label, field, fullWidth }: Readonly<PresetFieldProps>) {
	return (
		<TextField
			size="small"
			label={label}
			fullWidth={fullWidth}
			value={selectedAclPreset[field]}
			onChange={(event) =>
				updateSnapshot((draft) => {
					const frontend = draft.frontends.find((item) => item.name === selectedAclEntry.frontendName);
					const matchingAcls = frontend?.acls.filter((item) => item.name === selectedAclEntry.acl.name) ?? [];
					const nextAcl = buildAclFromPresetState({ ...selectedAclPreset, [field]: event.target.value });
					matchingAcls.forEach((acl) => {
						acl.criterion = nextAcl.criterion;
						acl.value = nextAcl.value;
					});
				})
			}
		/>
	);
}
