import { useEffect, useMemo, useState } from "react";
import { Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { PageHeader } from "@components/shared/PageHeader";
import { ConfigToolbar } from "@components/shared/ConfigToolbar";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { setCurrentSnapshot } from "@modules/config/config.reducer";
import { withSnapshot } from "@modules/config/config.utils";

export function BackendEdit() {
	const snapshot = useAppSelector((x) => x.config.current);
	const dispatch = useAppDispatch();
	const [selectedName, setSelectedName] = useState(snapshot.backends[0]?.name ?? "");

	useEffect(() => {
		if (!snapshot.backends.some((item) => item.name === selectedName)) {
			setSelectedName(snapshot.backends[0]?.name ?? "");
		}
	}, [selectedName, snapshot.backends]);

	const selected = useMemo(() => snapshot.backends.find((item) => item.name === selectedName) ?? snapshot.backends[0], [selectedName, snapshot.backends]);

	const update = (updater: Parameters<typeof withSnapshot>[1]) => {
		dispatch(setCurrentSnapshot(withSnapshot(snapshot, updater)));
	};

	return (
		<Stack spacing={2} height={"100%"}>
			<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
				<PageHeader text={"Backend"} subText={"Typed Data Plane fields"} />
				<ConfigToolbar />
			</Stack>

			<Stack direction={"row"} spacing={1}>
				<Button
					variant="contained"
					onClick={() => {
						const nextName = `backend_${snapshot.backends.length + 1}`;
						setSelectedName(nextName);
						update((draft) => {
							draft.backends.push({
								name: nextName,
								mode: "http",
								balance: null,
								servers: [{ name: `${nextName}_server`, address: "127.0.0.1", port: 8080, check: "enabled" }],
							});
						});
					}}
				>
					Add backend
				</Button>
				{selected && (
					<Button
						color="error"
						variant="outlined"
						onClick={() =>
							update((draft) => {
								draft.backends = draft.backends.filter((item) => item.name !== selected.name);
							})
						}
					>
						Remove backend
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
									const backend = draft.backends.find((item) => item.name === selected.name);
									if (backend) backend.name = nextName;
								});
							}}
						/>
						<TextField
							label="Mode"
							variant="standard"
							value={selected.mode ?? ""}
							onChange={(event) =>
								update((draft) => {
									const backend = draft.backends.find((item) => item.name === selected.name);
									if (backend) backend.mode = event.target.value || null;
								})
							}
						/>
						<TextField
							label="Balance"
							variant="standard"
							value={selected.balance ?? ""}
							onChange={(event) =>
								update((draft) => {
									const backend = draft.backends.find((item) => item.name === selected.name);
									if (backend) backend.balance = event.target.value || null;
								})
							}
						/>
					</Stack>

					<Divider />
					<Typography variant="h6">Servers</Typography>
					<Stack spacing={2}>
						{selected.servers.map((server, index) => (
							<Stack key={server.name || index} direction={"row"} spacing={2} alignItems={"center"} flexWrap={"wrap"}>
								<TextField
									label="Name"
									variant="standard"
									value={server.name}
									onChange={(event) =>
										update((draft) => {
											const item = draft.backends.find((backend) => backend.name === selected.name)?.servers[index];
											if (item) item.name = event.target.value;
										})
									}
								/>
								<TextField
									label="Address"
									variant="standard"
									value={server.address ?? ""}
									onChange={(event) =>
										update((draft) => {
											const item = draft.backends.find((backend) => backend.name === selected.name)?.servers[index];
											if (item) item.address = event.target.value || null;
										})
									}
								/>
								<TextField
									label="Port"
									type="number"
									variant="standard"
									value={server.port ?? ""}
									onChange={(event) =>
										update((draft) => {
											const item = draft.backends.find((backend) => backend.name === selected.name)?.servers[index];
											if (item) item.port = event.target.value === "" ? null : Number(event.target.value);
										})
									}
								/>
								<TextField
									label="Check"
									variant="standard"
									value={server.check ?? ""}
									onChange={(event) =>
										update((draft) => {
											const item = draft.backends.find((backend) => backend.name === selected.name)?.servers[index];
											if (item) item.check = event.target.value || null;
										})
									}
								/>
								<Button
									color="error"
									onClick={() =>
										update((draft) => {
											const backend = draft.backends.find((item) => item.name === selected.name);
											if (backend) backend.servers.splice(index, 1);
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
									const backend = draft.backends.find((item) => item.name === selected.name);
									if (backend) backend.servers.push({ name: `${selected.name}_server_${backend.servers.length + 1}`, address: "127.0.0.1", port: 8080, check: null });
								})
							}
						>
							Add server
						</Button>
					</Stack>
				</Stack>
			) : (
				<Stack>No backend loaded.</Stack>
			)}
		</Stack>
	);
}
