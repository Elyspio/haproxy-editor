import { useEffect, useMemo, useState } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { PageHeader } from "@components/shared/PageHeader";
import { ConfigToolbar } from "@components/shared/ConfigToolbar";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { setCurrentSnapshot } from "@modules/config/config.reducer";
import { withSnapshot } from "@modules/config/config.utils";

export function DefaultEdit() {
	const snapshot = useAppSelector((x) => x.config.current);
	const dispatch = useAppDispatch();
	const [selectedName, setSelectedName] = useState(snapshot.defaults[0]?.name ?? "");

	useEffect(() => {
		if (!snapshot.defaults.some((item) => item.name === selectedName)) {
			setSelectedName(snapshot.defaults[0]?.name ?? "");
		}
	}, [selectedName, snapshot.defaults]);

	const selected = useMemo(() => snapshot.defaults.find((item) => item.name === selectedName) ?? snapshot.defaults[0], [selectedName, snapshot.defaults]);

	const update = (updater: Parameters<typeof withSnapshot>[1]) => {
		dispatch(setCurrentSnapshot(withSnapshot(snapshot, updater)));
	};

	return (
		<Stack spacing={2} height={"100%"}>
			<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
				<PageHeader text={"Defaults"} subText={"Typed Data Plane fields"} />
				<ConfigToolbar />
			</Stack>

			<Stack direction={"row"} spacing={1}>
				<Button
					variant="contained"
					onClick={() => {
						const nextName = `defaults_${snapshot.defaults.length + 1}`;
						setSelectedName(nextName);
						update((draft) => {
							draft.defaults.push({ name: nextName, mode: "http" });
						});
					}}
				>
					Add section
				</Button>
				{selected && (
					<Button
						color="error"
						variant="outlined"
						onClick={() =>
							update((draft) => {
								draft.defaults = draft.defaults.filter((item) => item.name !== selected.name);
							})
						}
					>
						Remove section
					</Button>
				)}
			</Stack>

			{selected ? (
				<Stack spacing={2} width={420}>
					<TextField
						label="Section name"
						variant="standard"
						value={selected.name}
						onChange={(event) => {
							const nextName = event.target.value;
							setSelectedName(nextName);
							update((draft) => {
								const item = draft.defaults.find((defaults) => defaults.name === selected.name);
								if (item) {
									item.name = nextName;
								}
							});
						}}
					/>
					<TextField
						label="Mode"
						variant="standard"
						value={selected.mode ?? ""}
						onChange={(event) =>
							update((draft) => {
								const item = draft.defaults.find((defaults) => defaults.name === selected.name);
								if (item) {
									item.mode = event.target.value || null;
								}
							})
						}
					/>
				</Stack>
			) : (
				<Stack>No defaults section loaded.</Stack>
			)}
		</Stack>
	);
}
