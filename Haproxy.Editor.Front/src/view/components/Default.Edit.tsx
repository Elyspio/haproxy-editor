import { createAppSelector, useAppDispatch, useAppSelector } from "@store/utils/utils.selectors";
import { ConfigEditor } from "@components/shared/ConfigEditor";
import { useCallback } from "react";
import { Stack } from "@mui/material";
import { PageHeader } from "@components/shared/PageHeader";
import IconButton from "@mui/material/IconButton";
import { Save } from "@mui/icons-material";
import { updateConfig } from "@modules/config/config.async.actions";
import { ConfigToolbar } from "@components/shared/ConfigToolbar";

export function DefaultEdit() {
	const content = useAppSelector((x) => x.config.current.defaults);

	const dispatch = useAppDispatch();

	const onChange = useCallback(
		(newContent?: string) => {
			dispatch(updateConfig({ key: "defaults", value: newContent ?? "" }));
		},
		[dispatch]
	);

	return (
		<Stack spacing={2} height={"100%"}>
			<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
				<PageHeader text={"Default"} subText={"Edit"} />
				<ConfigToolbar />
			</Stack>

			<ConfigEditor content={content} onChange={onChange} />
		</Stack>
	);
}
