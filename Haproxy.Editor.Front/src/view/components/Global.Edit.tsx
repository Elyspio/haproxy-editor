import { createAppSelector, useAppSelector } from "@store/utils/utils.selectors";
import { ConfigEditor } from "@components/shared/ConfigEditor";
import { useCallback } from "react";
import { Stack } from "@mui/material";
import { PageHeader } from "@components/shared/PageHeader";
import IconButton from "@mui/material/IconButton";
import { Save } from "@mui/icons-material";

export function GlobalEdit() {
	const content = useAppSelector((x) => x.config.current.global);

	const onChange = useCallback((newContent?: string) => {
		console.log(newContent);
	}, []);

	return (
		<Stack spacing={2} height={"100%"}>
			<Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
				<PageHeader text={"Global"} subText={"Edit"} />
				<Stack>
					<IconButton>
						<Save />
					</IconButton>
				</Stack>
			</Stack>

			<ConfigEditor content={content} onChange={onChange} />
		</Stack>
	);
}
