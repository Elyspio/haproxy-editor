import { createRoutesFromChildren, Navigate, Route, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/view/context/auth.context";
import { ProtectedRoute } from "@components/auth/ProtectedRoute";
import { AuthCallback } from "@pages/AuthCallback";
import { routes } from "@/config/view.config";
import { DashboardLayout } from "@pages/DashboardLayout";
import { createStore } from "@store/store.shared";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { Summary } from "@components/summary/Summary";
import { FlowDashboard } from "@components/summary/Flow.Dashboard";
import { RawView } from "@components/Raw.View";
import { ManagementWorkspace } from "@components/Management.Workspace";
import { createCockpitTheme } from "./theme/cockpit.theme";
import { useAppSelector } from "@store/utils/utils.selectors";

const router = createBrowserRouter(
	createRoutesFromChildren(
		<>
			<Route path={routes.oauth.callback.path} element={<AuthCallback />} />
			<Route
				path={routes.dashboard.summary.path}
				element={
					<ProtectedRoute>
						<DashboardLayout />
					</ProtectedRoute>
				}
			>
				<Route index element={<Summary />} />
				<Route path={routes.dashboard.flow.path.slice(1)} element={<FlowDashboard />} />
				<Route path={routes.dashboard.management.path.slice(1)} element={<ManagementWorkspace />} />
				<Route path={routes.raw.view.path.slice(1)} element={<RawView />} />
				<Route path={routes.frontend.create.path} element={<Navigate replace to={`${routes.dashboard.management.path}?section=frontend`} />} />
				<Route path={routes.frontend.edit.path} element={<Navigate replace to={`${routes.dashboard.management.path}?section=frontend`} />} />
				<Route path={routes.backend.create.path} element={<Navigate replace to={`${routes.dashboard.management.path}?section=backend`} />} />
				<Route path={routes.backend.edit.path} element={<Navigate replace to={`${routes.dashboard.management.path}?section=backend`} />} />
				<Route path={routes.global.edit.path} element={<Navigate replace to={`${routes.dashboard.management.path}?section=global`} />} />
				<Route path={routes.default.edit.path} element={<Navigate replace to={`${routes.dashboard.management.path}?section=global`} />} />
			</Route>
		</>
	)
);

window["haproxy-editor"].router = router;

const store = createStore();

function AppShell() {
	const themeMode = useAppSelector((state) => state.dashboard.themeMode);
	const theme = createCockpitTheme(themeMode);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<AuthProvider>
				<RouterProvider router={router} />
				<ToastContainer theme={themeMode} />
			</AuthProvider>
		</ThemeProvider>
	);
}

export const App = () => {
	return (
		<Provider store={store}>
			<AppShell />
		</Provider>
	);
};
