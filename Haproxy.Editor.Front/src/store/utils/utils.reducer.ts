import { ActionReducerMapBuilder, AsyncThunk, Draft } from "@reduxjs/toolkit";
import { PartialRecord, PromiseState } from "./utils.types";
import { AppThunkParam, ExtraArgument } from "./utils.actions";
import { StoreState } from "@store/store.reducers";

export function setPromiseStatus<Reducer, PropKey extends string, ActionPayload, ThunkArg>(
	builder: Pick<ActionReducerMapBuilder<Reducer>, "addCase">,
	thunk: AsyncThunk<ActionPayload, ThunkArg, AppThunkParam<ExtraArgument, StoreState>>,
	getProps: (state: Draft<Reducer>) => PartialRecord<PropKey, PromiseState | undefined>,
	prop: PropKey,
	status: PromiseState[] = ["fulfilled", "pending", "rejected"],
) {
	for (const promiseStatus of status) {
		builder.addCase(thunk[promiseStatus], (state, action) => {
			getProps(state)[prop] = action.meta.requestStatus;
		});
	}
}
