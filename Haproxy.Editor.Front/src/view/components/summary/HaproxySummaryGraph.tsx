import React, { useCallback, useEffect, useState } from "react";
import type { Edge } from "@xyflow/react";
import { addEdge, Background, type Connection, ConnectionLineType, type Node, ReactFlow } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { useAppSelector } from "@store/utils/utils.selectors";
import { type HaproxyAclResource, type HaproxyResourceSnapshot } from "@modules/config/config.types";
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

function findAcl(frontendAcls: HaproxyAclResource[], condTest: string): HaproxyAclResource | undefined {
	return frontendAcls.find((acl) => condTest.includes(acl.name));
}

export function convertSnapshotToFlow(conf: HaproxyResourceSnapshot): { nodes: Node[]; edges: Edge[] } {
	const edges: Edge[] = [];
	const nodes: Node[] = [];

	for (const frontend of conf.frontends) {
		const idFrontend = getId("frontend", frontend.name);
		const node = {
			id: idFrontend,
			type: "frontend",
			data: getNodeData({ type: "frontend", name: frontend.name, bindings: frontend.binds }),
			position: { x: 0, y: 0 },
		};

		nodes.push(node);

		for (const mapping of frontend.backendSwitchingRules) {
			edges.push({
				id: `edge-${frontend.name}-${mapping.backendName}`,
				source: idFrontend,
				data: { label: String(mapping.condTest ?? "") },
				target: getId("backend", mapping.backendName),
				type: "default",
			});
		}
	}

	for (const backend of conf.backends) {
		const frontend = conf.frontends.find((f) => f.backendSwitchingRules.some((m) => m.backendName === backend.name));

		if (!frontend) {
			continue;
		}

		const rule = frontend.backendSwitchingRules.find((m) => m.backendName === backend.name);
		const acl = rule ? findAcl(frontend.acls, String(rule.condTest ?? "")) : undefined;

		const idBackend = getId("backend", backend.name);
		const node: Node = {
			id: idBackend,
			type: "backend",
			data: getNodeData({ type: "backend", acl, name: backend.name, mode: String(backend.mode ?? "") }),
			position: { x: 0, y: 0 },
		};

		nodes.push(node);

		for (const server of backend.servers) {
			nodes.push({
				id: `${idBackend}-${server.name}`,
				type: "server",
				data: getNodeData({ type: "server", name: server.name, host: `${server.address ?? ""}:${server.port ?? ""}` }),
				position: { x: 0, y: 0 },
			});

			edges.push({
				id: `edge-${backend.name}-${server.name}`,
				source: idBackend,
				target: `${idBackend}-${server.name}`,
				data: { label: String(server.check ?? "") },
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
	const snapshot = useAppSelector((x) => x.config.current);

	const [nodes, setNodes] = useState([] as Node[]);
	const [edges, setEdges] = useState([] as Edge[]);

	const [direction] = React.useState<Direction>("LR");

	useEffect(() => {
		const { nodes, edges } = convertSnapshotToFlow(snapshot);
		const layoutValues = getLayoutedElements(nodes, edges, direction);

		setNodes(layoutValues.nodes);
		setEdges(layoutValues.edges);
	}, [snapshot, direction]);

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
