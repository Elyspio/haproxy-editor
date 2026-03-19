import { BaseNode, type DefaultNodeProps, NodeData } from "./BaseNode";

type FrontendNodeProps = Omit<DefaultNodeProps, "data"> & { data: NodeData.Frontend };

export const frontendBgColor = "#ff9a58"; // Color for frontend nodes

export default function FrontendNode(props: Readonly<FrontendNodeProps>) {
	const subline = props.data.bindings.map((bind) => `${bind.address ?? ""}:${bind.port ?? ""}`).filter(Boolean).join(", ");

	return <BaseNode {...props} textColor={"black"} bgColor={frontendBgColor} data={{ label: props.data.name, subline: subline }} targetPosition={undefined} />;
}
