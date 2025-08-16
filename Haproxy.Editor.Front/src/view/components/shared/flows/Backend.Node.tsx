import { BaseNode, type DefaultNodeProps, NodeData } from "@components/shared/flows/BaseNode";

type BackendNodeProps = Omit<DefaultNodeProps, "data"> & { data: NodeData.Backend };

export const backendBgColor = "#ffdd88";

export default function BackendNode(props: Readonly<BackendNodeProps>) {
	return <BaseNode textColor={"black"} bgColor={backendBgColor} {...props} data={{ label: props.data.name, subline: `host: ${props.data.acl.activator.host}` }} />;
}
