import { BaseNode, type DefaultNodeProps, NodeData } from "@components/shared/flows/BaseNode";

type ServerNodeProps = Omit<DefaultNodeProps, "data"> & { data: NodeData.Server };

export const serverBgColor = "rgba(122,235,255,0.92)";

export default function ServerNode(props: Readonly<ServerNodeProps>) {
	return <BaseNode {...props} textColor={"black"} bgColor={serverBgColor} data={{ label: props.data.name, subline: props.data.host }} sourcePosition={undefined} />;
}
