import { authReducer } from "@modules/auth/auth.reducer";
import { StateFromReducersMapObject } from "@reduxjs/toolkit";
import { configReducer } from "@modules/config/config.reducer";

export const reducers = {
	auth: authReducer,
	config: configReducer,
};

export type StoreState = StateFromReducersMapObject<typeof reducers>;
