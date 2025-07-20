import { ActionCreatorWithPayload, ActionReducerMapBuilder, AsyncThunk, Draft } from "@reduxjs/toolkit";
import { PartialRecord, PromiseState } from "./utils.types";
import { AppThunkParam, ExtraArgument } from "./utils.actions";
import { StoreState } from "@store/store.reducers";

export function setPromiseStatus<T, U extends string>(
	builder: Pick<ActionReducerMapBuilder<T>, "addCase">,
	thunk: AsyncThunk<unknown, unknown, AppThunkParam<ExtraArgument, StoreState>>,
	getProps: (state: Draft<T>) => PartialRecord<U, PromiseState | undefined>,
	prop: U,
	status: PromiseState[] = ["fulfilled", "pending", "rejected"]
) {
	for (const promiseStatus of status) {
		builder.addCase(thunk[promiseStatus], (state, action) => {
			getProps(state)[prop] = action.meta.requestStatus;
		});
	}
}
