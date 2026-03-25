import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ConfigState, HaproxyResourceSnapshot } from "@modules/config/config.types";
import { startApp, syncConfig, validateConfig } from "@modules/config/config.async.actions";
import { createEmptySnapshot, recalculateSummary } from "@modules/config/config.utils";
import { setPromiseStatus } from "@store/utils/utils.reducer";

const initialSnapshot = createEmptySnapshot();

const initialState: ConfigState = {
	current: initialSnapshot,
	previous: initialSnapshot,
	calls: {},
};

const slice = createSlice({
	name: "config",
	initialState,
	reducers: {
		setCurrentSnapshot(state, { payload }: PayloadAction<HaproxyResourceSnapshot>) {
			state.current = recalculateSummary(payload);
		},
	},
	extraReducers: (builder) => {
		builder.addCase(startApp.fulfilled, (state, { payload }) => {
			state.previous = state.current;
			state.current = recalculateSummary(payload);
		});

		builder.addCase(syncConfig.fulfilled, (state, { payload }) => {
			state.previous = state.current;
			state.current = recalculateSummary(payload);
			state.calls.save = "fulfilled";
		});

		setPromiseStatus(builder, syncConfig, (x) => x.calls, "save", ["pending", "rejected"]);
		setPromiseStatus(builder, validateConfig, (x) => x.calls, "validate");
	},
});

export const { setCurrentSnapshot } = slice.actions;
export const configReducer = slice.reducer;
