import { useMemo } from "react";
import { Stack } from "@mui/material";
import { useAppSelector } from "@store/utils/utils.selectors";
import { ConfigEditor } from "@components/shared/ConfigEditor";
import { PageHeader } from "@components/shared/PageHeader";

export function RawView() {
	const snapshot = useAppSelector((x) => x.config.current);
	const content = useMemo(() => JSON.stringify(snapshot, null, 2), [snapshot]);

	return (
		<Stack spacing={2} height={"100%"}>
			<PageHeader text={"Diagnostics"} subText={"Read-only snapshot"} />
			<ConfigEditor content={content} language="json" disabled />
		</Stack>
	);
}
