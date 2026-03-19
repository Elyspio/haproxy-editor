import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import { PageHeader } from "@components/shared/PageHeader";
import { ConfigToolbar } from "@components/shared/ConfigToolbar";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { setCurrentSnapshot } from "@modules/config/config.reducer";
import { withSnapshot } from "@modules/config/config.utils";

export function GlobalEdit() {
	const snapshot = useAppSelector((x) => x.config.current);
	const dispatch = useAppDispatch();

	const update = (updater: Parameters<typeof withSnapshot>[1]) => {
		dispatch(setCurrentSnapshot(withSnapshot(snapshot, updater)));
	};

	return (
		<Stack spacing={2} height={"100%"}>
			<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
				<PageHeader text={"Global"} subText={"Typed Data Plane fields"} />
				<ConfigToolbar />
			</Stack>

			<Stack spacing={2} width={420}>
				<FormControlLabel
					control={<Checkbox checked={snapshot.global.daemon} onChange={(event) => update((draft) => void (draft.global.daemon = event.target.checked))} />}
					label="Daemon"
				/>
			</Stack>
		</Stack>
	);
}
