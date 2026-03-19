import { Save, Verified } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import { Stack } from "@mui/material";
import { useAppDispatch } from "@store/utils/utils.selectors";
import { useCallback } from "react";
import { syncConfig, validateConfig } from "@modules/config/config.async.actions";

export function ConfigToolbar() {
	const dispatch = useAppDispatch();

	const save = useCallback(() => {
		dispatch(syncConfig());
	}, [dispatch]);

	const verify = useCallback(() => {
		dispatch(validateConfig());
	}, [dispatch]);

	return (
		<Stack spacing={1} direction={"row"} alignItems={"center"} height={"100%"}>
			<IconButton onClick={verify}>
				<Verified />
			</IconButton>
			<IconButton onClick={save}>
				<Save />
			</IconButton>
		</Stack>
	);
}
