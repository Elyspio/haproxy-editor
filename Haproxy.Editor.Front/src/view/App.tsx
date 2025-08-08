import { createBrowserRouter, createRoutesFromChildren, Route, RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/view/context/auth.context";
import { ProtectedRoute } from "@components/auth/ProtectedRoute";
import AuthCallback from "@pages/AuthCallback";
import { routes } from "@/config/view.config";
import DashboardLayout from "@pages/DashboardLayout";
import { createStore } from "@store/store.shared";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { Provider } from "react-redux";
import { FrontendCreate } from "@components/frontend/Frontend.Create";
import { GlobalEdit } from "@components/Global.Edit";
import { useEffect } from "react";
import { useAppDispatch } from "@store/utils/utils.selectors";
import { startApp } from "@modules/config/config.async.actions";
import { DefaultEdit } from "@components/Default.Edit";

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
				<Route
					path={routes.frontend.create.path}
					element={
						<ProtectedRoute>
							<FrontendCreate />
						</ProtectedRoute>
					}
				/>
				<Route
					path={routes.global.edit.path}
					element={
						<ProtectedRoute>
							<GlobalEdit />
						</ProtectedRoute>
					}
				/>
				<Route
					path={routes.default.edit.path}
					element={
						<ProtectedRoute>
							<DefaultEdit />
						</ProtectedRoute>
					}
				/>
			</Route>
		</>
	)
);

window["haproxy-editor"].router = router;

const store = createStore();

const theme = createTheme();

export const App = () => {
	return (
		<ThemeProvider theme={theme}>
			<Provider store={store}>
				<AuthProvider>
					<RouterProvider router={router} />
				</AuthProvider>
			</Provider>
			<CssBaseline />
		</ThemeProvider>
	);
};
