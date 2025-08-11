export type PartialRecord<K extends keyof any, T> = {
	[P in K]?: T;
};

export type PromiseState = "fulfilled" | "rejected" | "pending";

export type IdWindow = number | "web";

export type Primitive = boolean | string | number;

export type KeepOnlyPrimitives<T> = {
	[P in keyof T]: T[P] extends Primitive ? T[P] : never;
};

export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/**
 * Applique KeepOnlyPrimitives à toutes les propriétés d'un objet
 */
export type KeepOnlyPrimitivesIn<T> = {
	[key in keyof T]: OmitNever<KeepOnlyPrimitives<T[key]>>;
};

export type Constructor<T> = new (...arg1: any) => T;

export type OmitStrict<T, K extends keyof T> = Omit<T, K>;

export type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never;
