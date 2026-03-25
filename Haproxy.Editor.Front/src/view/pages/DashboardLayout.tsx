import * as React from "react";
import Box from "@mui/material/Box";
import { Outlet } from "react-router";
import { SidebarDashboard } from "@components/dashboard/Sidebar.Dashboard";
import HaproxyIcon from "@/view/icons/HaproxyIcon";
import { DashboardHeader } from "@components/dashboard/Header.Dashboard";

export function DashboardLayout() {
	const [navigationExpanded, setNavigationExpanded] = React.useState(true);

	return (
		<Box
			sx={{
				display: "flex",
				height: "100dvh",
				width: "100%",
				overflow: "hidden",
			}}
		>
			<SidebarDashboard expanded={navigationExpanded} setExpanded={setNavigationExpanded} />
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					minWidth: 0,
					minHeight: 0,
				}}
			>
			<DashboardHeader logo={<HaproxyIcon />} menuOpen={navigationExpanded} onToggleMenu={setNavigationExpanded} />
				<Box component="main" sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
					<Outlet />
				</Box>
			</Box>
		</Box>
	);
}
