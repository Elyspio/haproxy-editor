import { createAsyncActionGenerator, getService } from "@store/utils/utils.actions";
import { ConfigService } from "@services/config.service";
import { toast } from "react-toastify";
import { InvalidConfiguration } from "@components/toasts/InvalidConfiguration";
import React from "react";

const createAsyncThunk = createAsyncActionGenerator("config");

export const startApp = createAsyncThunk(
	"start",
	async (_, { extra }) => {
		const configService = getService(ConfigService, extra);
		return await configService.getConfig();
	},
	{ noPrefix: true }
);

export const syncConfig = createAsyncThunk("sync", async (_, { extra, getState, dispatch }) => {
	const configService = getService(ConfigService, extra);
	const validation = await configService.validateConfig(getState().config.current);

	if (!validation.success) {
		toast.error(React.createElement(InvalidConfiguration, { errorMsg: validation.error }), { style: { width: 500 }, hideProgressBar: true });
		throw new Error(`Configuration validation failed: ${validation.error}`);
	}

	await configService.updateConfig(getState().config.current);
	return getState().config.current;
});

export const validateConfig = createAsyncThunk("validate", async (_, { extra, getState }) => {
	const service = getService(ConfigService, extra);
	const result = await service.validateConfig(getState().config.current);

	if (!result.success) {
		toast.error(React.createElement(InvalidConfiguration, { errorMsg: result.error }), { style: { width: 500 }, hideProgressBar: true });
	}

	return result;
});
