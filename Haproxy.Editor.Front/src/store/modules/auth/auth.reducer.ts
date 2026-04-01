import { createSlice } from "@reduxjs/toolkit";
import { AuthState, AuthStep } from "@modules/auth/auth.types";
import { setAuth } from "@modules/auth/auth.async.actions";

const initialState: AuthState = {
	step: AuthStep.Disconnected,
	user: null,
};

const slice = createSlice({
	name: "auth",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(setAuth.fulfilled, (state, action) => {
			state.user = action.meta.arg;
			if (action.meta.arg != null) {
				state.step = AuthStep.Connected;
			} else {
				state.step = AuthStep.Disconnected;
			}
		});

		builder.addCase(setAuth.rejected, (state) => {
			state.step = AuthStep.Disconnected;
		});
	},
});

export const authReducer = slice.reducer;
