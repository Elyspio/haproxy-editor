import {createAsyncActionGenerator, getService} from "@store/utils/utils.actions";
import {ConfigService} from "@services/config.service";
import {type PayloadAction} from "@reduxjs/toolkit";
import {toast} from "react-toastify";
import {InvalidConfiguration} from "@components/toasts/InvalidConfiguration";
import React from "react";
import type {ConfigState, HaproxyConfigurationFront} from "@modules/config/config.types";
import {HaproxyConfigurationParser} from "@services/parser.service";

const createAsyncThunk = createAsyncActionGenerator("config");

export const startApp = createAsyncThunk(
	"start",
	async (_, {extra}) => {
		const configService = getService(ConfigService, extra);
		const [raw, front] = await configService.getConfig();




		return {raw, front};
	},
	{noPrefix: true}
);

export const syncConfig = createAsyncThunk("sync", async (_, {extra, getState, dispatch}) => {
	const configService = getService(ConfigService, extra);
	const {payload} = (await dispatch(validateConfig())) as PayloadAction<Awaited<ReturnType<ConfigService["validateConfig"]>>>;

	if (!payload.success) {
		throw new Error(`Configuration validation failed: ${payload.error}`);
	}

	const config = getState().config.current;

	return await configService.updateConfig(config);
});


export const syncParsedConfig = createAsyncThunk("sync/parsed", (_, {extra, getState}): ConfigState["parsed"] => {

	const parserService = getService(HaproxyConfigurationParser, extra);

	const raw = getState().config.raw;

	return {
		frontends: parserService.parseFrontends(raw.frontends),
		backends: parserService.parseBackends(raw.backends)
	}
})

export const validateConfig = createAsyncThunk("validate", async (_, {extra, getState}) => {
	const service = getService(ConfigService, extra);

	const config = getState().config.current;

	const result = await service.validateConfig(config);

	if (!result.success) {
		toast.error(React.createElement(InvalidConfiguration, {errorMsg: result.error!}), {style: {width: 500}, hideProgressBar: true});
	}

	return result;
});

type UpdateConfigParam<K extends keyof HaproxyConfigurationFront> = {
	key: K;
	value: string;
} & (K extends "frontend" | "backend"
	? {
		name: string;
	}
	: object);

export const _updateConfig = createAsyncThunk("update", async (param: UpdateConfigParam<keyof HaproxyConfigurationFront>, {getState}) => {
	const state = getState();
	const config = structuredClone(state.config.current);

	if (param.key === "frontends" || param.key === "backends") {
		if (!("name" in param)) {
			throw new Error("Name is required for frontend/backend updates");
		}
		config[param.key][param.name as string] = param.value;
	} else {
		config[param.key] = param.value;
	}

	return config;
});

export const updateConfig = <T extends keyof HaproxyConfigurationFront>(params: UpdateConfigParam<T>) => _updateConfig(params);
