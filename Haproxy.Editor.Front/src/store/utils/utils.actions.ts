import { AsyncThunkPayloadCreator, createAction as _createAction, createAsyncThunk as _createAsyncThunk, isRejected, type UnknownAction } from "@reduxjs/toolkit";
import type { IdWindow } from "./utils.types";
import type { StoreState } from "@store/store.reducers";
import { Container, ServiceIdentifier } from "inversify";
import { ReactNode } from "react";
import { toast, ToastOptions } from "react-toastify";

export type ExtraArgument = {
	container: Container;
	idWindow: IdWindow;
};

export function getService<T>(service: ServiceIdentifier<T>, extra: ExtraArgument): T {
	const s = extra.container.get(service);

	if (!s) throw new Error(`Service ${String(service)} not found in container`);

	return s;
}

export function throwIfRejected(action: UnknownAction) {
	if (isRejected(action)) throw new Error((action as { error: Error }).error.message);
}

export type AppThunkParam<Extra extends ExtraArgument, State extends StoreState> = {
	extra: Extra;
	state: State;
	pendingMeta: {
		idWindow: IdWindow;
	};
};

type CreateAsyncActionGeneratorOptions = {
	noPrefix?: true;
};

export function createAsyncActionGenerator<Extra extends ExtraArgument = ExtraArgument, State extends StoreState = StoreState>(prefix: string) {
	return <Ret, Arg = void>(suffix: string, payloadCreator: AsyncThunkPayloadCreator<Ret, Arg, AppThunkParam<Extra, State>>, opts: CreateAsyncActionGeneratorOptions = {}) => {
		const name = opts.noPrefix ? suffix : `${prefix}/${suffix}`;
		return _createAsyncThunk<Ret, Arg, AppThunkParam<Extra, State>>(name, payloadCreator, {
			getPendingMeta: (meta, { extra }) => ({
				idWindow: extra.idWindow,
				...meta,
			}),
		});
	};
}

export function createActionGenerator(prefix: string) {
	return <Arg = void>(suffix: string) => _createAction<Arg>(`${prefix}/${suffix}`);
}

/**
 * En cas d'erreur, affiche un message d'erreur dans le toast (width = fit-content par défaut)
 * @param fn Fonction qui peut lancer une erreur
 * @param errorMessage Message d'erreur à afficher
 * @param options Options du toast
 */
export async function wrapErrorWithToast<T>(fn: Promise<T>, errorMessage: ReactNode, options: ToastOptions = {}): Promise<T> {
	try {
		return (await fn) as T;
	} catch (e) {
		toast.error(errorMessage, { ...options, style: { ...(options.style ?? {}) } });
		throw e;
	}
}
