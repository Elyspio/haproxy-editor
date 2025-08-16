import { Stack, TextField } from "@mui/material";
import { PageHeader } from "@components/shared/PageHeader";

export function FrontendCreate() {
	return (
		<Stack m={4} spacing={2}>
			<PageHeader text={"Frontend"} subText={"Create"} />

			<Stack width={300}>
				<TextField variant={"standard"} type={"text"} label={"Name"} />
			</Stack>
		</Stack>
	);
}
