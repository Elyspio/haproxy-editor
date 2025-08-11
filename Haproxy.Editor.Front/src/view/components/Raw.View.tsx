import { useAppSelector } from "@store/utils/utils.selectors";
import { ConfigEditor } from "@components/shared/ConfigEditor";
import { Stack } from "@mui/material";
import { PageHeader } from "@components/shared/PageHeader";

export function RawView() {
	const content = useAppSelector((x) => x.config.current.raw);

	return (
		<Stack spacing={2} height={"100%"}>
			<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
				<PageHeader text={"Raw"} subText={"View"} />
			</Stack>

			<ConfigEditor content={content} disabled />
		</Stack>
	);
}
