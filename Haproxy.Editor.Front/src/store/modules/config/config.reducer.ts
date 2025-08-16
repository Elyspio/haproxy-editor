import { createSlice } from "@reduxjs/toolkit";
import type { ConfigState, HaproxyConfigurationFront } from "@modules/config/config.types";
import { _updateConfig, startApp, syncConfig, syncParsedConfig } from "@modules/config/config.async.actions";
import { setPromiseStatus } from "@store/utils/utils.reducer";

const defaultConfig: HaproxyConfigurationFront = {
	defaults: "",
	raw: "",
	global: "",
	backends: {},
	frontends: {},
};

const initialState: ConfigState = {
	raw: { raw: "", backends: {}, frontends: {}, global: [], defaults: [] },
	current: defaultConfig,
	previous: defaultConfig,
	parsed: {
		frontends: {},
		backends: {},
	},
	calls: {},
};

const slice = createSlice({
	name: "config",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(startApp.fulfilled, (state, action) => {
			state.current = action.payload.front;
			state.raw = action.payload.raw;
			state.previous = structuredClone(state.current);
		});

		builder.addCase(_updateConfig.fulfilled, (state, action) => {
			state.current = action.payload;
		});

		builder.addCase(syncParsedConfig.fulfilled, (state, action) => {
			state.parsed = action.payload;
		});

		setPromiseStatus(builder, syncConfig, (x) => x.calls, "save");
	},
});

export const configReducer = slice.reducer;
