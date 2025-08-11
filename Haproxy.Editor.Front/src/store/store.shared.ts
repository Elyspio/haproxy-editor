import {configureStore} from "@reduxjs/toolkit";
import {reducers} from "@store/store.reducers";
import {logErrorMiddleware} from "@store/utils/middlewares/log-error.middleware";
import {container} from "@/core/di/di";
import {updateParsedConfigMiddleware} from "@modules/config/config.middlewares";

export function createStore() {
	const store = configureStore({
		// Reducers  de l'application
		reducer: reducers,
		devTools: true,
		middleware: (getDefaultMiddleware) => {
			const middlewares = getDefaultMiddleware({
				serializableCheck: false,
				immutableCheck: true,
				thunk: {
					extraArgument: {
						container: container,
					},
				},
			});

			middlewares.push(logErrorMiddleware);
			middlewares.push(updateParsedConfigMiddleware);

			return middlewares;
		},
	});
	window["haproxy-editor"].store = store;

	return store;
}

export type StoreType = ReturnType<typeof createStore>;
