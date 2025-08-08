import { createSlice } from "@reduxjs/toolkit";
import type { ConfigState, HaproxyConfigurationFront } from "@modules/config/config.types";
import { _updateConfig, startApp, syncConfig } from "@modules/config/config.async.actions";
import { setPromiseStatus } from "@store/utils/utils.reducer";

const defaultConfig: HaproxyConfigurationFront = {
	defaults: "",
	global: "",
	backends: {},
	frontends: {},
};

const initialState: ConfigState = {
	current: defaultConfig,
	previous: defaultConfig,
	calls: {},
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

		builder.addCase(_updateConfig.fulfilled, (state, action) => {
			state.current = action.payload;
		});

		setPromiseStatus(builder, syncConfig, (x) => x.calls, "save");
	},
});

export const configReducer = slice.reducer;
