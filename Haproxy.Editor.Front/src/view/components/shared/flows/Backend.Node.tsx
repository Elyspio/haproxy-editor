import { BaseNode, type DefaultNodeProps, NodeData } from "@components/shared/flows/BaseNode";

type BackendNodeProps = Omit<DefaultNodeProps, "data"> & { data: NodeData.Backend };

export const backendBgColor = "#ffdd88";

export default function BackendNode(props: Readonly<BackendNodeProps>) {
	const aclText = props.data.acl ? `${props.data.acl.name}: ${props.data.acl.value ?? ""}` : props.data.mode ?? "";
	return <BaseNode textColor={"black"} bgColor={backendBgColor} {...props} data={{ label: props.data.name, subline: aclText }} />;
}
