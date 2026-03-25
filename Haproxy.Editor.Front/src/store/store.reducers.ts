import { authReducer } from "@modules/auth/auth.reducer";
import { StateFromReducersMapObject } from "@reduxjs/toolkit";
import { configReducer } from "@modules/config/config.reducer";
import { dashboardReducer } from "@modules/dashboard/dashboard.reducer";

export const reducers = {
	auth: authReducer,
	config: configReducer,
	dashboard: dashboardReducer,
};

export type StoreState = StateFromReducersMapObject<typeof reducers>;
