import type { NodeProps } from "@xyflow/react/dist/esm/types";
import { Paper, Stack, Typography } from "@mui/material";
import { Handle } from "@xyflow/react";
import { Parsed } from "@modules/config/config.types";
import FrontendAcl = Parsed.FrontendAcl;

export type DefaultNodeProps = NodeProps & {
	data: {
		label: string;
		subline?: string;
	};
	type: NodeData.Any["type"];
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace NodeData {
	export type Frontend = { type: "frontend"; name: string };
	export type Server = { type: "server"; name: string; host: string };
	export type Backend = { type: "backend"; name: string; acl: FrontendAcl };
	export type Any = NodeData.Frontend | NodeData.Backend | NodeData.Server;
}

type BaseNodeProps = DefaultNodeProps & {
	bgColor?: string;
	textColor?: string;
};

export function BaseNode(props: Readonly<BaseNodeProps>) {
	return (
		<Paper>
			<Stack p={1.75} sx={{ background: props.bgColor }} spacing={0.5} alignItems={"center"}>
				<Typography variant={"subtitle2"} color={props.textColor}>
					{props.data.label}
				</Typography>

				{props.data.subline && (
					<Typography variant={"subtitle2"} color={"gray"}>
						{props.data.subline}
					</Typography>
				)}
				{props.sourcePosition && <Handle type="source" position={props.sourcePosition} />}
				{props.targetPosition && <Handle type="target" position={props.targetPosition} />}
			</Stack>
		</Paper>
	);
}
