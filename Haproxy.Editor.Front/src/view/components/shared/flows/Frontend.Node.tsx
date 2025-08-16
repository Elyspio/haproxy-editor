import React from "react";
import { BaseNode, type DefaultNodeProps, NodeData } from "@components/shared/flows/BaseNode";

type FrontendNodeProps = Omit<DefaultNodeProps, "data"> & { data: NodeData.Frontend };

export const frontendBgColor = "#ff9a58"; // Color for frontend nodes

export default function FrontendNode(props: Readonly<FrontendNodeProps>) {
	return <BaseNode {...props} textColor={"black"} bgColor={frontendBgColor} data={{ label: props.data.name }} targetPosition={undefined} />;
}
