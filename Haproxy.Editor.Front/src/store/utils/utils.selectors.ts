import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { StoreState } from "@store/store.reducers";
import { createDraftSafeSelector } from "@reduxjs/toolkit";

export const createAppSelector = createDraftSafeSelector.withTypes<StoreState>();

export type TDispatch<ReturnType> = (action: any) => ReturnType;
export const useAppDispatch = <ReturnType>() => useDispatch() as TDispatch<ReturnType>;
export const useAppSelector: TypedUseSelectorHook<StoreState> = useSelector;
