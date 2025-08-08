import React from "react";
import Typography from "@mui/material/Typography";
import { Chip, Stack } from "@mui/material";

type PageHeaderProps = {
	text: string;
	subText: string;
};

export function PageHeader({ text, subText }: Readonly<PageHeaderProps>) {
	return (
		<Stack width={300} spacing={2} direction={"row"} alignItems={"center"}>
			<Chip color={"primary"} sx={{ textTransform: "uppercase" }} variant={"outlined"} size={"medium"} label={text} />
			<Typography color={"gray"} fontSize={"small"}>
				&gt;
			</Typography>
			<Typography textTransform={"uppercase"} color={"secondary"} fontSize={"smaller"}>
				{subText}
			</Typography>
		</Stack>
	);
}
