import * as React from "react";
import Divider from "@mui/material/Divider";
import DashboardSidebarContext from "@/view/context/Sidebar.Dashboard.context";
import { getDrawerSxTransitionMixin } from "@/view/styles/dashboard.mixins";

export function DividerItemSidebarDashboard() {
	const sidebarContext = React.useContext(DashboardSidebarContext);
	if (!sidebarContext) {
		throw new Error("Sidebar context was used without a provider.");
	}
	const { fullyExpanded = true, hasDrawerTransitions } = sidebarContext;

	return (
		<li>
			<Divider
				sx={{
					borderBottomWidth: 1,
					my: 1,
					mx: -0.5,
					...(hasDrawerTransitions ? getDrawerSxTransitionMixin(fullyExpanded, "margin") : {}),
				}}
			/>
		</li>
	);
}
