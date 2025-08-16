import { Stack } from "@mui/material";
import Typography from "@mui/material/Typography";

interface CardHeaderTitleProps {
	children: string;
	variant?: "dark" | "light";
}

export function CardHeaderTitle({ children, variant = "dark" }: Readonly<CardHeaderTitleProps>) {
	const bg = variant === "light" ? "rgba(231,231,231,0.6)" : "#343434";
	const textColor = variant === "light" ? "black" : "white";

	return (
		<Stack sx={{ background: bg }} alignItems={"center"} width={"100%"} py={0.5} px={1}>
			<Typography textTransform={"uppercase"} fontSize={"small"} fontWeight={"bold"} color={textColor}>
				{children}
			</Typography>
		</Stack>
	);
}
