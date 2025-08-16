import * as React from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Toolbar from "@mui/material/Toolbar";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/Layers";
import { matchPath, useLocation } from "react-router";
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from "@/config/view.constants";
import { PageItemSidebarDashboard } from "@components/dashboard/PageItem.Sidebar.Dashboard";
import { HeaderItemSidebarDashboard } from "@components/dashboard/HeaderItem.Sidebar.Dashboard";
import { DividerItemSidebarDashboard } from "@components/dashboard/DividerItem.Sidebar.Dashboard";
import { getDrawerSxTransitionMixin, getDrawerWidthTransitionMixin } from "@/view/styles/dashboard.mixins";
import DashboardSidebarContext from "@/view/context/Sidebar.Dashboard.context";
import { routes } from "@/config/view.config";
import { Public } from "@mui/icons-material";
import ConveyorBeltIcon from "@mui/icons-material/ConveyorBelt";

export interface DashboardSidebarProps {
	expanded?: boolean;
	setExpanded: (expanded: boolean) => void;
	disableCollapsibleSidebar?: boolean;
	container?: Element;
}

export function SidebarDashboard({ expanded = true, setExpanded, disableCollapsibleSidebar = false, container }: Readonly<DashboardSidebarProps>) {
	const theme = useTheme();

	const { pathname } = useLocation();

	const [expandfrontendemIds, setExpandfrontendemIds] = React.useState<string[]>([]);

	const isOverSmViewport = useMediaQuery(theme.breakpoints.up("sm"));
	const isOverMdViewport = useMediaQuery(theme.breakpoints.up("md"));

	const [isFullyExpanded, setIsFullyExpanded] = React.useState(expanded);
	const [isFullyCollapsed, setIsFullyCollapsed] = React.useState(!expanded);

	React.useEffect(() => {
		if (expanded) {
			const drawerWidthTransitionTimeout = setTimeout(() => {
				setIsFullyExpanded(true);
			}, theme.transitions.duration.enteringScreen);

			return () => clearTimeout(drawerWidthTransitionTimeout);
		}

		setIsFullyExpanded(false);

		return () => {};
	}, [expanded, theme.transitions.duration.enteringScreen]);

	React.useEffect(() => {
		if (!expanded) {
			const drawerWidthTransitionTimeout = setTimeout(() => {
				setIsFullyCollapsed(true);
			}, theme.transitions.duration.leavingScreen);

			return () => clearTimeout(drawerWidthTransitionTimeout);
		}

		setIsFullyCollapsed(false);

		return () => {};
	}, [expanded, theme.transitions.duration.leavingScreen]);

	const mini = !disableCollapsibleSidebar && !expanded;

	const handleSetSidebarExpanded = React.useCallback(
		(newExpanded: boolean) => () => {
			setExpanded(newExpanded);
		},
		[setExpanded]
	);

	const handlePageItemClick = React.useCallback(
		(itemId: string, hasNestedNavigation: boolean) => {
			if (hasNestedNavigation && !mini) {
				setExpandfrontendemIds((previousValue) =>
					previousValue.includes(itemId) ? previousValue.filter((previousValueItemId) => previousValueItemId !== itemId) : [...previousValue, itemId]
				);
			} else if (!isOverSmViewport && !hasNestedNavigation) {
				setExpanded(false);
			}
		},
		[mini, setExpanded, isOverSmViewport]
	);

	const hasDrawerTransitions = isOverSmViewport && (!disableCollapsibleSidebar || isOverMdViewport);

	const getDrawerContent = React.useCallback(
		(viewport: "phone" | "tablet" | "desktop") => (
			<>
				<Toolbar />
				<Box
					component="nav"
					aria-label={`${viewport.charAt(0).toUpperCase()}${viewport.slice(1)}`}
					sx={{
						height: "100%",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						overflow: "auto",
						scrollbarGutter: mini ? "stable" : "auto",
						overflowX: "hidden",
						pt: !mini ? 0 : 2,
						...(hasDrawerTransitions ? getDrawerSxTransitionMixin(isFullyExpanded, "padding") : {}),
					}}
				>
					<List
						dense
						sx={{
							padding: mini ? 0 : 0.5,
							mb: 4,
							width: mini ? MINI_DRAWER_WIDTH : "auto",
						}}
					>
						<HeaderItemSidebarDashboard>Dashboard</HeaderItemSidebarDashboard>

						<PageItemSidebarDashboard id="Summary" title="  Summary" icon={<BarChartIcon />} href="/" selected={pathname === "/"} />
						<PageItemSidebarDashboard id="raw" title="Raw" icon={<LayersIcon />} href={routes.raw.view.path} selected={!!matchPath(routes.raw.view.path, pathname)} />

						<DividerItemSidebarDashboard />

						<HeaderItemSidebarDashboard>Modify</HeaderItemSidebarDashboard>

						<PageItemSidebarDashboard
							id="global"
							title="Global"
							icon={<LayersIcon />}
							href={routes.global.edit.path}
							selected={!!matchPath(routes.global.edit.path, pathname)}
						/>
						<PageItemSidebarDashboard
							id="default"
							title="Default"
							icon={<LayersIcon />}
							href={routes.default.edit.path}
							selected={!!matchPath(routes.default.edit.path, pathname)}
						/>
						<PageItemSidebarDashboard
							id="frontend"
							title="Frontend"
							icon={<Public />}
							href="/frontend"
							selected={!!matchPath("/frontend", pathname)}
							defaultExpanded={!!matchPath("/frontend", pathname)}
							expanded={expandfrontendemIds.includes("frontend")}
							nestedNavigation={
								<List
									dense
									sx={{
										padding: 0,
										my: 1,
										pl: mini ? 0 : 1,
										minWidth: 240,
									}}
								>
									<PageItemSidebarDashboard
										id="create"
										title="Create"
										href={routes.frontend.create.path}
										selected={!!matchPath(routes.frontend.create.path, pathname)}
									/>
									<PageItemSidebarDashboard id="edit" title="Edit" href={routes.frontend.edit.path} selected={!!matchPath(routes.frontend.edit.path, pathname)} />
								</List>
							}
						/>
						<PageItemSidebarDashboard
							id="backend"
							title="Backend"
							icon={<ConveyorBeltIcon />}
							href="/backend"
							selected={!!matchPath("/backend", pathname)}
							defaultExpanded={!!matchPath("/backend", pathname)}
							expanded={expandfrontendemIds.includes("backend")}
							nestedNavigation={
								<List
									dense
									sx={{
										padding: 0,
										my: 1,
										pl: mini ? 0 : 1,
										minWidth: 240,
									}}
								>
									<PageItemSidebarDashboard
										id="Backend"
										title="Create"
										href={routes.backend.create.path}
										selected={!!matchPath(routes.backend.create.path, pathname)}
									/>
									<PageItemSidebarDashboard
										id="Backend"
										title="Edit"
										href={routes.backend.edit.path}
										selected={!!matchPath(routes.backend.edit.path, pathname)}
									/>
								</List>
							}
						/>
					</List>
				</Box>
			</>
		),
		[mini, hasDrawerTransitions, isFullyExpanded, expandfrontendemIds, pathname]
	);

	const getDrawerSharedSx = React.useCallback(
		(isTemporary: boolean) => {
			const drawerWidth = mini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;

			return {
				displayPrint: "none",
				width: drawerWidth,
				flexShrink: 0,
				...getDrawerWidthTransitionMixin(expanded),
				...(isTemporary ? { position: "absolute" } : {}),
				[`& .MuiDrawer-paper`]: {
					position: "absolute",
					width: drawerWidth,
					boxSizing: "border-box",
					backgroundImage: "none",
					...getDrawerWidthTransitionMixin(expanded),
				},
			};
		},
		[expanded, mini]
	);

	const sidebarContextValue = React.useMemo(() => {
		return {
			onPageItemClick: handlePageItemClick,
			mini,
			fullyExpanded: isFullyExpanded,
			fullyCollapsed: isFullyCollapsed,
			hasDrawerTransitions,
		};
	}, [handlePageItemClick, mini, isFullyExpanded, isFullyCollapsed, hasDrawerTransitions]);

	return (
		<DashboardSidebarContext.Provider value={sidebarContextValue}>
			<Drawer
				container={container}
				variant="temporary"
				open={expanded}
				onClose={handleSetSidebarExpanded(false)}
				ModalProps={{
					keepMounted: true, // Better open performance on mobile.
				}}
				sx={{
					display: {
						xs: "block",
						sm: disableCollapsibleSidebar ? "block" : "none",
						md: "none",
					},
					...getDrawerSharedSx(true),
				}}
			>
				{getDrawerContent("phone")}
			</Drawer>
			<Drawer
				variant="permanent"
				sx={{
					display: {
						xs: "none",
						sm: disableCollapsibleSidebar ? "none" : "block",
						md: "none",
					},
					...getDrawerSharedSx(false),
				}}
			>
				{getDrawerContent("tablet")}
			</Drawer>
			<Drawer
				variant="permanent"
				sx={{
					display: { xs: "none", md: "block" },
					...getDrawerSharedSx(false),
				}}
			>
				{getDrawerContent("desktop")}
			</Drawer>
		</DashboardSidebarContext.Provider>
	);
}
