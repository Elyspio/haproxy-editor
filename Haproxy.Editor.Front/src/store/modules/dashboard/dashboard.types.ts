import type { PromiseState } from "@store/utils/utils.types";

export type ThemeMode = "dark" | "light";
export type FlowViewMode = "logical" | "infrastructure";

export type DashboardKpi = {
	title: string;
	value: number;
	subtitle: string;
	tone: string;
	trend: number[];
};

export type DashboardAlert = {
	id: string;
	severity: string;
	message: string;
	resourceType: string | null;
	resourceName: string | null;
};

export type RuntimeServerStatus = {
	name: string;
	status: string;
	address: string | null;
	port: number | null;
	adminState: string | null;
	operationalState: string | null;
	checkStatus: string | null;
	currentSessions: number;
	sessionRate: number;
};

export type RuntimeBackendStatus = {
	name: string;
	status: string;
	currentSessions: number;
	sessionRate: number;
	bytesIn: number;
	bytesOut: number;
	healthyServers: number;
	downServers: number;
	maintenanceServers: number;
	servers: RuntimeServerStatus[];
};

export type DashboardSummary = {
	generatedAt: string;
	runtimeStatus: string;
	alerts: DashboardKpi;
	routes: DashboardKpi;
	services: DashboardKpi;
};

export type DashboardSnapshot = {
	summary: DashboardSummary;
	alerts: DashboardAlert[];
	backends: RuntimeBackendStatus[];
	cluster: ClusterDashboardSnapshot;
};

export type ClusterNodeDashboardSnapshot = {
	nodeId: string;
	displayName: string;
	enabled: boolean;
	runtimeStatus: string;
	syncStatus: string;
	lastAttemptAt: string | null;
	lastSuccessAt: string | null;
	lastError: string | null;
};

export type ClusterDashboardSnapshot = {
	clusterId: string;
	currentRevision: number;
	status: string;
	totalNodes: number;
	syncedNodes: number;
	nodes: ClusterNodeDashboardSnapshot[];
};

export type DashboardSelection = {
	section: "summary" | "global" | "defaults" | "frontend" | "mapping" | "backend" | "acl" | "quickmap" | "raw";
	frontendName?: string | null;
	backendName?: string | null;
	aclName?: string | null;
	serverName?: string | null;
};

export type DashboardSearchResult = {
	id: string;
	kind: "route" | "frontend" | "backend" | "server" | "acl" | "bind" | "rule";
	title: string;
	subtitle: string;
	route: string;
	selection: DashboardSelection;
};

export type DashboardState = {
	snapshot: DashboardSnapshot;
	searchQuery: string;
	searchResults: DashboardSearchResult[];
	themeMode: ThemeMode;
	flowViewMode: FlowViewMode;
	selection: DashboardSelection;
	calls: {
		load?: PromiseState;
		refresh?: PromiseState;
		theme?: PromiseState;
		search?: PromiseState;
	};
};
