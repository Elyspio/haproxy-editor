import { useEffect, useMemo, useState } from "react";
import { Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { PageHeader } from "@components/shared/PageHeader";
import { ConfigToolbar } from "@components/shared/ConfigToolbar";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { setCurrentSnapshot } from "@modules/config/config.reducer";
import { withSnapshot } from "@modules/config/config.utils";

export function FrontendCreate() {
	const snapshot = useAppSelector((x) => x.config.current);
	const dispatch = useAppDispatch();
	const [selectedName, setSelectedName] = useState(snapshot.frontends[0]?.name ?? "");

	useEffect(() => {
		if (!snapshot.frontends.some((item) => item.name === selectedName)) {
			setSelectedName(snapshot.frontends[0]?.name ?? "");
		}
	}, [selectedName, snapshot.frontends]);

	const selected = useMemo(() => snapshot.frontends.find((item) => item.name === selectedName) ?? snapshot.frontends[0], [selectedName, snapshot.frontends]);

	const update = (updater: Parameters<typeof withSnapshot>[1]) => {
		dispatch(setCurrentSnapshot(withSnapshot(snapshot, updater)));
	};

	return (
		<Stack spacing={2} height={"100%"}>
			<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
				<PageHeader text={"Frontend"} subText={"Typed Data Plane fields"} />
				<ConfigToolbar />
			</Stack>

			<Stack direction={"row"} spacing={1}>
				<Button
					variant="contained"
					onClick={() => {
						const nextName = `frontend_${snapshot.frontends.length + 1}`;
						setSelectedName(nextName);
						update((draft) => {
							draft.frontends.push({
								name: nextName,
								mode: "http",
								defaultBackend: null,
								binds: [{ name: `${nextName}_bind`, address: "127.0.0.1", port: 80 }],
								acls: [],
								backendSwitchingRules: [],
							});
						});
					}}
				>
					Add frontend
				</Button>
				{selected && (
					<Button
						color="error"
						variant="outlined"
						onClick={() =>
							update((draft) => {
								draft.frontends = draft.frontends.filter((item) => item.name !== selected.name);
							})
						}
					>
						Remove frontend
					</Button>
				)}
			</Stack>

			{selected ? (
				<Stack spacing={2}>
					<Stack direction={"row"} spacing={2} flexWrap={"wrap"}>
						<TextField
							label="Name"
							variant="standard"
							value={selected.name}
							onChange={(event) => {
								const nextName = event.target.value;
								setSelectedName(nextName);
								update((draft) => {
									const frontend = draft.frontends.find((item) => item.name === selected.name);
									if (frontend) frontend.name = nextName;
								});
							}}
						/>
						<TextField
							label="Mode"
							variant="standard"
							value={selected.mode ?? ""}
							onChange={(event) =>
								update((draft) => {
									const frontend = draft.frontends.find((item) => item.name === selected.name);
									if (frontend) frontend.mode = event.target.value || null;
								})
							}
						/>
						<TextField
							label="Default backend"
							variant="standard"
							value={selected.defaultBackend ?? ""}
							onChange={(event) =>
								update((draft) => {
									const frontend = draft.frontends.find((item) => item.name === selected.name);
									if (frontend) frontend.defaultBackend = event.target.value || null;
								})
							}
						/>
					</Stack>

					<Divider />
					<Typography variant="h6">Binds</Typography>
					<Stack spacing={2}>
						{selected.binds.map((bind, index) => (
							<Stack key={bind.name || index} direction={"row"} spacing={2} alignItems={"center"} flexWrap={"wrap"}>
								<TextField
									label="Name"
									variant="standard"
									value={bind.name}
									onChange={(event) =>
										update((draft) => {
											const item = draft.frontends.find((frontend) => frontend.name === selected.name)?.binds[index];
											if (item) item.name = event.target.value;
										})
									}
								/>
								<TextField
									label="Address"
									variant="standard"
									value={bind.address ?? ""}
									onChange={(event) =>
										update((draft) => {
											const item = draft.frontends.find((frontend) => frontend.name === selected.name)?.binds[index];
											if (item) item.address = event.target.value || null;
										})
									}
								/>
								<TextField
									label="Port"
									type="number"
									variant="standard"
									value={bind.port ?? ""}
									onChange={(event) =>
										update((draft) => {
											const item = draft.frontends.find((frontend) => frontend.name === selected.name)?.binds[index];
											if (item) item.port = event.target.value === "" ? null : Number(event.target.value);
										})
									}
								/>
								<Button
									color="error"
									onClick={() =>
										update((draft) => {
											const frontend = draft.frontends.find((item) => item.name === selected.name);
											if (frontend) frontend.binds.splice(index, 1);
										})
									}
								>
									Remove
								</Button>
							</Stack>
						))}
						<Button
							variant="outlined"
							onClick={() =>
								update((draft) => {
									const frontend = draft.frontends.find((item) => item.name === selected.name);
									if (frontend) frontend.binds.push({ name: `${selected.name}_bind_${frontend.binds.length + 1}`, address: "127.0.0.1", port: 80 });
								})
							}
						>
							Add bind
						</Button>
					</Stack>

					<Divider />
					<Typography variant="h6">ACLs</Typography>
					<Stack spacing={2}>
						{selected.acls.map((acl, index) => (
							<Stack key={acl.name || index} direction={"row"} spacing={2} alignItems={"center"} flexWrap={"wrap"}>
								<TextField
									label="Name"
									variant="standard"
									value={acl.name}
									onChange={(event) =>
										update((draft) => {
											const item = draft.frontends.find((frontend) => frontend.name === selected.name)?.acls[index];
											if (item) item.name = event.target.value;
										})
									}
								/>
								<TextField
									label="Criterion"
									variant="standard"
									value={acl.criterion ?? ""}
									onChange={(event) =>
										update((draft) => {
											const item = draft.frontends.find((frontend) => frontend.name === selected.name)?.acls[index];
											if (item) item.criterion = event.target.value || null;
										})
									}
								/>
								<TextField
									label="Value"
									variant="standard"
									value={acl.value ?? ""}
									onChange={(event) =>
										update((draft) => {
											const item = draft.frontends.find((frontend) => frontend.name === selected.name)?.acls[index];
											if (item) item.value = event.target.value || null;
										})
									}
								/>
								<Button
									color="error"
									onClick={() =>
										update((draft) => {
											const frontend = draft.frontends.find((item) => item.name === selected.name);
											if (frontend) frontend.acls.splice(index, 1);
										})
									}
								>
									Remove
								</Button>
							</Stack>
						))}
						<Button
							variant="outlined"
							onClick={() =>
								update((draft) => {
									const frontend = draft.frontends.find((item) => item.name === selected.name);
									if (frontend) frontend.acls.push({ name: `acl_${frontend.acls.length + 1}`, criterion: "hdr(host)", value: "example.com" });
								})
							}
						>
							Add ACL
						</Button>
					</Stack>

					<Divider />
					<Typography variant="h6">Backend switching rules</Typography>
					<Stack spacing={2}>
						{selected.backendSwitchingRules.map((rule, index) => (
							<Stack key={`${rule.backendName}-${index}`} direction={"row"} spacing={2} alignItems={"center"} flexWrap={"wrap"}>
								<TextField
									label="Backend"
									variant="standard"
									value={rule.backendName}
									onChange={(event) =>
										update((draft) => {
											const item = draft.frontends.find((frontend) => frontend.name === selected.name)?.backendSwitchingRules[index];
											if (item) item.backendName = event.target.value;
										})
									}
								/>
								<TextField
									label="Condition"
									variant="standard"
									value={rule.cond ?? ""}
									onChange={(event) =>
										update((draft) => {
											const item = draft.frontends.find((frontend) => frontend.name === selected.name)?.backendSwitchingRules[index];
											if (item) item.cond = event.target.value || null;
										})
									}
								/>
								<TextField
									label="Cond test"
									variant="standard"
									value={rule.condTest ?? ""}
									onChange={(event) =>
										update((draft) => {
											const item = draft.frontends.find((frontend) => frontend.name === selected.name)?.backendSwitchingRules[index];
											if (item) item.condTest = event.target.value || null;
										})
									}
								/>
								<Button
									color="error"
									onClick={() =>
										update((draft) => {
											const frontend = draft.frontends.find((item) => item.name === selected.name);
											if (frontend) frontend.backendSwitchingRules.splice(index, 1);
										})
									}
								>
									Remove
								</Button>
							</Stack>
						))}
						<Button
							variant="outlined"
							onClick={() =>
								update((draft) => {
									const frontend = draft.frontends.find((item) => item.name === selected.name);
									if (frontend) {
										frontend.backendSwitchingRules.push({
											backendName: snapshot.backends[0]?.name ?? "backend_1",
											cond: "if",
											condTest: "TRUE",
										});
									}
								})
							}
						>
							Add rule
						</Button>
					</Stack>
				</Stack>
			) : (
				<Stack>No frontend loaded.</Stack>
			)}
		</Stack>
	);
}
