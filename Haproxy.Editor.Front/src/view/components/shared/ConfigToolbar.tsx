import { Refresh, Save, Verified } from "@mui/icons-material";
import { Button, type ButtonProps, keyframes, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { useCallback } from "react";
import { syncConfig, validateConfig } from "@modules/config/config.async.actions";
import { refreshDashboard } from "@modules/dashboard/dashboard.async.actions";
import type { PromiseState } from "@store/utils/utils.types";

const GLOW_DURATION_MS = 1500;

const successGlow = keyframes`
	0%   { box-shadow: 0 0 0 0 var(--glow-color); }
	40%  { box-shadow: 0 0 12px 4px var(--glow-color); }
	100% { box-shadow: 0 0 0 0 var(--glow-color); }
`;

function glowSx(state: PromiseState | undefined, color: string): ButtonProps["sx"] {
	if (state !== "fulfilled") return undefined;
	return {
		"--glow-color": color,
		animation: `${successGlow} ${GLOW_DURATION_MS}ms ease-out`,
		borderColor: color,
	} as ButtonProps["sx"];
}

export function ConfigToolbar() {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const glowColor = alpha(theme.palette.success.main, 0.6);

	const saveState = useAppSelector((state) => state.config.calls.save);
	const validateState = useAppSelector((state) => state.config.calls.validate);
	const refreshState = useAppSelector((state) => state.dashboard.calls.refresh);

	const save = useCallback(() => {
		dispatch(syncConfig());
	}, [dispatch]);

	const verify = useCallback(() => {
		dispatch(validateConfig());
	}, [dispatch]);

	const refresh = useCallback(() => {
		dispatch(refreshDashboard());
	}, [dispatch]);

	return (
		<Stack spacing={1} direction={"row"} alignItems={"center"} height={"100%"}>
			<Button variant="outlined" size="small" startIcon={<Refresh fontSize="small" />} onClick={refresh} sx={glowSx(refreshState, glowColor)}>
				Refresh
			</Button>
			<Button variant="outlined" size="small" startIcon={<Verified fontSize="small" />} onClick={verify} sx={glowSx(validateState, glowColor)}>
				Validate
			</Button>
			<Button variant="contained" size="small" startIcon={<Save fontSize="small" />} onClick={save} sx={glowSx(saveState, glowColor)}>
				Save
			</Button>
		</Stack>
	);
}
