import { Stack, Typography } from "@mui/material";

type InvalidConfigurationProps = {
	errorMsg: string;
};

export function InvalidConfiguration({ errorMsg }: Readonly<InvalidConfigurationProps>) {
	return (
		<Stack spacing={1} width={"100%"} height={"100%"} justifyContent={"center"} alignItems={"center"}>
			<Typography fontWeight={"bold"}>Invalid config</Typography>
			<Typography>{errorMsg}</Typography>
		</Stack>
	);
}
