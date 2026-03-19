import type { NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { Paper, Stack, Typography } from "@mui/material";
import type { HaproxyAclResource, HaproxyBindResource } from "@modules/config/config.types";

export type DefaultNodeProps = NodeProps & {
	data: {
		label: string;
		subline?: string;
	};
	type: NodeData.Any["type"];
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace NodeData {
	export type Frontend = { type: "frontend"; name: string; bindings: HaproxyBindResource[] };
	export type Server = { type: "server"; name: string; host: string };
	export type Backend = { type: "backend"; name: string; acl?: HaproxyAclResource; mode?: string };
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
