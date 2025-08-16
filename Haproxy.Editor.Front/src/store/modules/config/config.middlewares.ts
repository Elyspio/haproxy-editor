import { isAction, Middleware, UnknownAction } from "@reduxjs/toolkit";
import { _updateConfig, startApp, syncParsedConfig } from "@modules/config/config.async.actions";

const actionsWithUpdateParsedConfig = [startApp.fulfilled, _updateConfig.fulfilled];

export const updateParsedConfigMiddleware: Middleware =
	({ dispatch }) =>
	(next) =>
	(action) => {
		next(action);

		if (!isAction(action) || !actionsWithUpdateParsedConfig.some((a: any) => a.type === action.type)) {
			return;
		}

		dispatch(syncParsedConfig() as unknown as UnknownAction);
	};
