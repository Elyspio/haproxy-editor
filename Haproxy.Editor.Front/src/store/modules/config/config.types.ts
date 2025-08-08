import type { PartialRecord, PromiseState } from "@store/utils/utils.types";

export type HaproxyConfigurationFront = {
	global: string;
	defaults: string;
	frontends: Record<string, string>;
	backends: Record<string, string>;
};

export type ConfigState = {
	current: HaproxyConfigurationFront;
	previous: HaproxyConfigurationFront;
	updates: PartialRecord<keyof HaproxyConfigurationFront, PromiseState>;
};
