import * as React from "react";

type IDashboardSideContext = {
	onPageItemClick: (id: string, hasNestedNavigation: boolean) => void;
	mini: boolean;
	fullyExpanded: boolean;
	fullyCollapsed: boolean;
	hasDrawerTransitions: boolean;
};

const DashboardSidebarContext = React.createContext<IDashboardSideContext | null>(null);

export default DashboardSidebarContext;
