import React, {useCallback, useEffect, useState} from 'react';
import {addEdge, ConnectionLineType, type Node, Panel, ReactFlow,} from '@xyflow/react';
import dagre from '@dagrejs/dagre';

import '@xyflow/react/dist/style.css';
import type {Edge} from "@xyflow/react/dist/esm/types";
import type {Connection} from "@xyflow/system/dist/esm/types/general";
import {useAppSelector} from "@store/utils/utils.selectors";
import {type ConfigState} from "@modules/config/config.types";
import {Accordion, AccordionDetails, AccordionSummary, Autocomplete, Stack, TextField, Typography} from '@mui/material';
import {CardHeaderTitle} from '../shared/CardHeaderTitle';


const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 300;
const nodeHeight = 36;

type Direction = 'LR' | 'TB';
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: Direction) => {
	const isHorizontal = direction === 'LR';
	dagreGraph.setGraph({rankdir: direction});

	for (const node of nodes) {
		dagreGraph.setNode(node.id, {width: nodeWidth, height: nodeHeight});
	}

	for (const edge of edges) {
		dagreGraph.setEdge(edge.source, edge.target);
	}

	dagre.layout(dagreGraph);

	const newNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		const newNode = {
			...node,
			targetPosition: isHorizontal ? 'left' : 'top',
			sourcePosition: isHorizontal ? 'right' : 'bottom',
			// We are shifting the dagre node position (anchor=center center) to the top left
			// so it matches the React Flow node anchor point (top left).
			position: {
				x: nodeWithPosition.x - nodeWidth / 2,
				y: nodeWithPosition.y - nodeHeight / 2,
			},
		};

		return newNode as Node;
	});

	return {nodes: newNodes, edges};
};


const getId = (type: "frontend" | "backend", key: string) => `${type}-${key}`;

function convertConfigToFlow(conf: ConfigState["parsed"]): { nodes: Node[]; edges: Edge[] } {
	// This function should convert the parsed Haproxy config into nodes and edges
	const edges: Edge[] = [];
	const nodes: Node[] = [];


	for (const [id, frontend] of Object.entries(conf.frontends)) {
		const idFrontend = getId("frontend", id);
		const node: Node = {
			id: idFrontend,
			type: 'frontend',
			data: {label: `Frontend: ${id}`},
			position: {x: 0, y: 0}, // Position will be set later
		};

		nodes.push(node);

		for (const mapping of frontend.mappings) {
			edges.push({
				id: `edge-${id}-${mapping.backend}`,
				source: idFrontend,
				data: {label: mapping.acl ? `host: ${frontend.acls}` : ``},
				target: getId("backend", mapping.backend),
				type: 'backend',
			});
		}
	}


	const backendsWithFrontends = Object.values(conf.frontends).flatMap(f => f.mappings.flatMap(m => m.backend))

	for (const [id, backend] of Object.entries(conf.backends)) {
		if (!backendsWithFrontends.includes(id)) {
			continue; // Skip backends that are not linked to any frontend
		}

		const idBackend = getId("backend", id);
		const node: Node = {
			id: idBackend,
			type: 'backend',
			data: {label: `Backend: ${id}`},
			position: {x: 0, y: 0}, // Position will be set later
		};

		nodes.push(node);

		for (const server of backend.servers) {
			nodes.push({
				id: `${idBackend}-${server.name}`,
				type: 'server',
				data: {label: `Server: ${server.name} (${server.host}:${server.port})`},
				position: {x: 0, y: 0}, // Position will be set later
			});

			edges.push({
				id: `edge-${id}-${server.name}`,
				source: idBackend,
				target: `${idBackend}-${server.name}`,
				data: {label: server.checked ? 'Checked' : 'Unchecked'},
				type: 'server',
			});
		}
	}


	return {
		edges,
		nodes,
	}


}

const directionsLabels: Record<Direction, string> = {
	'LR': 'Left to Right',
	'TB': 'Top to Bottom',
}

export const HaproxySummaryGraph = () => {

	const parsedConfig = useAppSelector(x => x.config.parsed);


	const [nodes, setNodes] = useState([] as Node[]);
	const [edges, setEdges] = useState([] as Edge[]);

	const [direction, setDirection] = React.useState<Direction>('LR');

	useEffect(() => {

		const {nodes, edges} = convertConfigToFlow(parsedConfig);
		const layoutValues = getLayoutedElements(nodes, edges, direction);

		setNodes(layoutValues.nodes);
		setEdges(layoutValues.edges);

	}, [parsedConfig, direction])


	const onConnect = useCallback(
		(params: Connection) =>
			setEdges((eds) =>
				addEdge({...params, type: ConnectionLineType.SmoothStep, animated: true}, eds),
			),
		[],
	);
	const onLayout = useCallback(
		(direction: Direction) => {
			const {nodes: layoutedNodes, edges: layoutedEdges} = getLayoutedElements(
				nodes,
				edges,
				direction,
			);

			setNodes([...layoutedNodes]);
			setEdges([...layoutedEdges]);
		},
		[nodes, edges],
	);


	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onConnect={onConnect}
			connectionLineType={ConnectionLineType.SmoothStep}
			fitView
			proOptions={{hideAttribution: true}}

		>
			<Panel position="top-right">
				<Accordion sx={{p: 0}}>
					<AccordionSummary sx={{p: 0}} >
						<CardHeaderTitle variant={"light"}>Options</CardHeaderTitle>
					</AccordionSummary>
					<AccordionDetails>
						<Stack px={3}  spacing={2}>
							<Typography variant={"caption"}>Only backends with an associated frontend are shown</Typography>
							<Autocomplete
								sx={{width: 200}}
								size={"small"}
								value={direction}
								onChange={(_, value) => setDirection(value as Direction)}
								options={['LR', 'TB'] as Direction[]}
								getOptionLabel={option => directionsLabels[option]}
								disableClearable
								renderInput={(params) => <TextField {...params} label="Direction" variant="standard"/>}
							/>
						</Stack>

					</AccordionDetails>
				</Accordion>
			</Panel>
		</ReactFlow>
	);
};

