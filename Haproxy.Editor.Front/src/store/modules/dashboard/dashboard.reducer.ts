import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { setPromiseStatus } from "@store/utils/utils.reducer";
import type { DashboardSelection, FlowViewMode, ThemeMode } from "./dashboard.types";
import { createInitialDashboardState } from "./dashboard.utils";
import { loadDashboard, refreshDashboard, saveThemePreference, searchDashboard } from "./dashboard.async.actions";

const initialState = createInitialDashboardState();

const slice = createSlice({
	name: "dashboard",
	initialState,
	reducers: {
		setDashboardSelection(state, { payload }: PayloadAction<DashboardSelection>) {
			state.selection = payload;
		},
		setFlowViewMode(state, { payload }: PayloadAction<FlowViewMode>) {
			state.flowViewMode = payload;
		},
		setThemeMode(state, { payload }: PayloadAction<ThemeMode>) {
			state.themeMode = payload;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(loadDashboard.fulfilled, (state, { payload }) => {
			state.snapshot = payload;
			state.calls.load = "fulfilled";
		});

		builder.addCase(refreshDashboard.fulfilled, (state, { payload }) => {
			state.snapshot = payload;
			state.calls.refresh = "fulfilled";
		});

		builder.addCase(saveThemePreference.fulfilled, (state, { payload }) => {
			state.themeMode = payload;
			state.calls.theme = "fulfilled";
		});

		builder.addCase(searchDashboard.fulfilled, (state, { payload }) => {
			state.searchQuery = payload.query;
			state.searchResults = payload.results;
			state.calls.search = "fulfilled";
		});

		setPromiseStatus(builder, loadDashboard, (x) => x.calls, "load", ["pending", "rejected"]);
		setPromiseStatus(builder, refreshDashboard, (x) => x.calls, "refresh", ["pending", "rejected"]);
		setPromiseStatus(builder, saveThemePreference, (x) => x.calls, "theme", ["pending", "rejected"]);
		setPromiseStatus(builder, searchDashboard, (x) => x.calls, "search", ["pending", "rejected"]);
	},
});

export const { setDashboardSelection, setFlowViewMode, setThemeMode } = slice.actions;
export const dashboardReducer = slice.reducer;
