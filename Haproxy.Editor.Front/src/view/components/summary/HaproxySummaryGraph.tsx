import React, { useCallback, useEffect, useState } from "react";
import { addEdge, Background, ConnectionLineType, type Node, ReactFlow } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import type { Edge } from "@xyflow/react/dist/esm/types";
import type { Connection } from "@xyflow/system/dist/esm/types/general";
import { useAppSelector } from "@store/utils/utils.selectors";
import { type ConfigState } from "@modules/config/config.types";
import { NodeData } from "@components/shared/flows/BaseNode";

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 300;
const nodeHeight = 36;

type Direction = "LR" | "TB";

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: Direction) => {
	const isHorizontal = direction === "LR";
	dagreGraph.setGraph({ rankdir: direction });

	for (const node of nodes) {
		dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
	}

	for (const edge of edges) {
		dagreGraph.setEdge(edge.source, edge.target);
	}

	dagre.layout(dagreGraph);

	const newNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		const newNode = {
			...node,
			targetPosition: isHorizontal ? "left" : "top",
			sourcePosition: isHorizontal ? "right" : "bottom",
			// We are shifting the dagre node position (anchor=center) to the top left
			// so it matches the React Flow node anchor point (top left).
			position: {
				x: nodeWithPosition.x - nodeWidth / 2,
				y: nodeWithPosition.y - nodeHeight / 2,
			},
		};

		return newNode as Node;
	});

	return { nodes: newNodes, edges };
};

const getId = (type: "frontend" | "backend", key: string) => `${type}-${key}`;

function getNodeData(props: NodeData.Any) {
	return props;
}

function convertConfigToFlow(conf: ConfigState["parsed"]): { nodes: Node[]; edges: Edge[] } {
	// This function should convert the parsed Haproxy config into nodes and edges
	const edges: Edge[] = [];
	const nodes: Node[] = [];

	for (const [id, frontend] of Object.entries(conf.frontends)) {
		const idFrontend = getId("frontend", id);
		const node = {
			id: idFrontend,
			type: "frontend",
			data: getNodeData({ type: "frontend", name: id }),
			position: { x: 0, y: 0 }, // Position will be set later
		};

		nodes.push(node);

		for (const mapping of frontend.mappings) {
			edges.push({
				id: `edge-${id}-${mapping.backend}`,
				source: idFrontend,
				data: { label: mapping.acl ? `host: ${mapping.acl}` : `` },
				target: getId("backend", mapping.backend),
				type: "default",
			});
		}
	}

	for (const [id, backend] of Object.entries(conf.backends)) {
		const frontend = Object.values(conf.frontends).find((f) => f.mappings.some((m) => m.backend === id));

		if (!frontend) {
			continue; // Skip backends that are not linked to any frontend
		}

		const aclName = frontend.mappings.find((m) => m.backend === id)!.acl!;
		const acl = frontend.acls[aclName];

		const idBackend = getId("backend", id);
		const node: Node = {
			id: idBackend,
			type: "backend",
			data: getNodeData({ type: "backend", acl, name: id }),
			position: { x: 0, y: 0 }, // Position will be set later
		};

		nodes.push(node);

		for (const server of backend.servers) {
			nodes.push({
				id: `${idBackend}-${server.name}`,
				type: "server",
				data: getNodeData({ type: "server", name: server.name, host: `${server.host}:${server.port}` }),
				position: { x: 0, y: 0 }, // Position will be set later
			});

			edges.push({
				id: `edge-${id}-${server.name}`,
				source: idBackend,
				target: `${idBackend}-${server.name}`,
				data: { label: server.checked ? "Checked" : "Unchecked" },
			});
		}
	}

	return {
		edges,
		nodes,
	};
}

const nodeTypes = {
	frontend: React.lazy(() => import("../shared/flows/Frontend.Node")),
	backend: React.lazy(() => import("../shared/flows/Backend.Node")),
	server: React.lazy(() => import("../shared/flows/Server.Node")),
};

export const HaproxySummaryGraph = () => {
	const parsedConfig = useAppSelector((x) => x.config.parsed);

	const [nodes, setNodes] = useState([] as Node[]);
	const [edges, setEdges] = useState([] as Edge[]);

	const [direction] = React.useState<Direction>("LR");

	useEffect(() => {
		const { nodes, edges } = convertConfigToFlow(parsedConfig);
		const layoutValues = getLayoutedElements(nodes, edges, direction);

		setNodes(layoutValues.nodes);
		setEdges(layoutValues.edges);
	}, [parsedConfig, direction]);

	const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds)), []);

	return (
		<ReactFlow
			nodes={nodes}
			nodeTypes={nodeTypes}
			edges={edges}
			onConnect={onConnect}
			connectionLineType={ConnectionLineType.SmoothStep}
			fitView
			proOptions={{ hideAttribution: true }}
		>
			<Background />
		</ReactFlow>
	);
};
