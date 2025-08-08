import { createSlice } from "@reduxjs/toolkit";
import type { ConfigState, HaproxyConfigurationFront } from "@modules/config/config.types";
import { startApp } from "@modules/config/config.async.actions";

const defaultConfig: HaproxyConfigurationFront = {
	defaults: "",
	global: "",
	backends: {},
	frontends: {},
};

const initialState: ConfigState = {
	current: defaultConfig,
	previous: defaultConfig,
	updates: {},
};

const slice = createSlice({
	name: "config",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(startApp.fulfilled, (state, action) => {
			state.current = action.payload;
			state.previous = structuredClone(state.current);
		});
	},
});

export const configReducer = slice.reducer;
