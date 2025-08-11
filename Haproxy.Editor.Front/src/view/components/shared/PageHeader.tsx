import Typography from "@mui/material/Typography";
import { Chip, Stack } from "@mui/material";
import Box from "@mui/material/Box";

type PageHeaderProps = {
	text: string;
	subText: string;
};

export function PageHeader({ text, subText }: Readonly<PageHeaderProps>) {
	return (
		<Stack width={300} spacing={1}>
			<Stack direction={"row"} spacing={1} alignItems={"center"}>
				<Label>Element</Label>
				<Typography textTransform={"uppercase"} fontSize={"smaller"}>
					{text}
				</Typography>
			</Stack>
			<Stack direction={"row"} fontSize={"90%"} spacing={1} alignItems={"center"}>
				<Label color={"secondary"}>Mode</Label>
				<Typography textTransform={"uppercase"} fontSize={"smaller"}>
					{subText}
				</Typography>
			</Stack>
		</Stack>
	);
}

function Label({ children, color = "primary" }: Readonly<{ children: string; color?: "primary" | "secondary" }>) {
	return (
		<Box width={80}>
			<Chip
				label={children}
				size={"small"}
				variant={"outlined"}
				sx={{
					borderColor: `${color}.main`,
					textTransform: "uppercase",
					fontSize: "0.6rem",
				}}
			/>
		</Box>
	);
}
