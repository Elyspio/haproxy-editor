import { useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { ConfigEditor } from "@components/shared/ConfigEditor";
import { useCallback } from "react";
import { Stack } from "@mui/material";
import { PageHeader } from "@components/shared/PageHeader";
import { updateConfig } from "@modules/config/config.async.actions";
import { ConfigToolbar } from "@components/shared/ConfigToolbar";

export function GlobalEdit() {
	const content = useAppSelector((x) => x.config.current.global);

	const dispatch = useAppDispatch();

	const onChange = useCallback(
		(newContent?: string) => {
			dispatch(updateConfig({ key: "global", value: newContent ?? "" }));
		},
		[dispatch]
	);
	return (
		<Stack spacing={2} height={"100%"}>
			<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
				<PageHeader text={"Global"} subText={"Edit"} />
				<ConfigToolbar />
			</Stack>

			<ConfigEditor content={content} onChange={onChange} />
		</Stack>
	);
}
