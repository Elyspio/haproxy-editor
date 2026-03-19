import React from "react";
import { Card, CardContent, Chip, Stack } from "@mui/material";
import { useAppSelector } from "@store/utils/utils.selectors";
import { HaproxySummaryGraph } from "./HaproxySummaryGraph";
import { CardHeaderTitle } from "@components/shared/CardHeaderTitle";
import { frontendBgColor } from "@components/shared/flows/Frontend.Node";
import { serverBgColor } from "@components/shared/flows/Server.Node";
import { backendBgColor } from "@components/shared/flows/Backend.Node";

export function Summary() {
	const summary = useAppSelector((state) => state.config.current.summary);

	return (
		<Stack spacing={3}>
			<Card sx={{ width: "fit-content" }}>
				<CardHeaderTitle>Summary</CardHeaderTitle>
				<CardContent>
					<Stack spacing={3} alignItems={"center"}>
						<Stack direction={"row"} spacing={2}>
							<Chip variant={"outlined"} sx={{ bgcolor: frontendBgColor }} label={`Frontends: ${summary.frontendCount}`} />
							<Chip variant={"outlined"} sx={{ bgcolor: backendBgColor }} label={`Backends: ${summary.backendCount}`} />
							<Chip variant={"outlined"} sx={{ bgcolor: serverBgColor }} label={`Servers: ${summary.serverCount}`} />
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
