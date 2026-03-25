import { createAsyncActionGenerator, getService } from "@store/utils/utils.actions";
import { DashboardService } from "@services/dashboard.service";
import type { ThemeMode } from "./dashboard.types";
import { searchDashboardSnapshot, THEME_STORAGE_KEY } from "./dashboard.utils";

const createAsyncThunk = createAsyncActionGenerator("dashboard");

export const loadDashboard = createAsyncThunk("load", async (_, { extra }) => {
	const dashboardService = getService(DashboardService, extra);
	return await dashboardService.getDashboardSnapshot();
});

export const refreshDashboard = createAsyncThunk("refresh", async (_, { extra }) => {
	const dashboardService = getService(DashboardService, extra);
	return await dashboardService.getDashboardSnapshot();
});

export const saveThemePreference = createAsyncThunk("theme", async (mode: ThemeMode) => {
	window.localStorage.setItem(THEME_STORAGE_KEY, mode);
	return mode;
});

export const searchDashboard = createAsyncThunk("search", async (query: string, { getState }) => {
	return {
		query,
		results: searchDashboardSnapshot(query, getState().config.current, getState().dashboard.snapshot),
	};
});
