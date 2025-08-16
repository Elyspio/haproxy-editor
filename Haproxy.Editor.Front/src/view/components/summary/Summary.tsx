import React from "react";
import { Card, CardContent, Chip, Stack } from "@mui/material";
import { createAppSelector, useAppSelector } from "@store/utils/utils.selectors";
import { HaproxySummaryGraph } from "./HaproxySummaryGraph";
import { CardHeaderTitle } from "@components/shared/CardHeaderTitle";
import { frontendBgColor } from "@components/shared/flows/Frontend.Node";
import { serverBgColor } from "@components/shared/flows/Server.Node";
import { backendBgColor } from "@components/shared/flows/Backend.Node";

const selectors = {
	frontendCount: createAppSelector(
		(state) => state.config.current.frontends,
		(frontends) => Object.keys(frontends).length
	),
	backendCount: createAppSelector(
		(state) => state.config.current.backends,
		(backends) => Object.keys(backends).length
	),
	serverCount: createAppSelector(
		(state) => state.config.current.backends,
		(backends) =>
			Object.values<string>(backends).reduce((count, backend) => {
				const lines = backend.split("\n");
				return count + lines.filter((line) => line.trim().includes("server ")).length;
			}, 0)
	),
};

export function Summary() {
	const frontendCount = useAppSelector(selectors.frontendCount);
	const backendCount = useAppSelector(selectors.backendCount);
	const serverCount = useAppSelector(selectors.serverCount);

	return (
		<Stack spacing={3}>
			<Card sx={{ width: "fit-content" }}>
				<CardHeaderTitle>Summary</CardHeaderTitle>
				<CardContent>
					<Stack spacing={3} alignItems={"center"}>
						<Stack direction={"row"} spacing={2}>
							<Chip variant={"outlined"} sx={{ bgcolor: frontendBgColor }} label={`Frontends: ${frontendCount}`} />
							<Chip variant={"outlined"} sx={{ bgcolor: backendBgColor }} label={`Backends: ${backendCount}`} />
							<Chip variant={"outlined"} sx={{ bgcolor: serverBgColor }} label={`Servers: ${serverCount}`} />
						</Stack>
					</Stack>
				</CardContent>
			</Card>

			<Card sx={{ width: "100%" }}>
				<CardHeaderTitle>Flow</CardHeaderTitle>
				<CardContent>
					<Stack spacing={3} alignItems={"center"} height={"50vh"}>
						<HaproxySummaryGraph />
					</Stack>
				</CardContent>
			</Card>
		</Stack>
	);
}
