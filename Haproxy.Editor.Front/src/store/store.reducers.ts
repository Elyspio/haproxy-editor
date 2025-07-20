import { authReducer } from "@modules/auth/auth.reducer";
import { StateFromReducersMapObject } from "@reduxjs/toolkit";

export const reducers = {
	auth: authReducer,
};

export type StoreState = StateFromReducersMapObject<typeof reducers>;
