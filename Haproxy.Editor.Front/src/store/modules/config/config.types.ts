import type { PromiseState } from "@store/utils/utils.types";
import type { HaproxyConfiguration } from "@apis/generated";

export type HaproxyConfigurationFront = {
	raw: string;
	global: string;
	defaults: string;
	frontends: Record<string, string>;
	backends: Record<string, string>;
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Parsed {
	export type Config = {
		frontends: Record<string, Parsed.Frontend>;
		backends: Record<string, Parsed.Backend>;
	};

	export type Frontend = {
		// Name of the frontend
		name: string;

		// Mappings of backends to use
		mappings: FrontendMapping[];

		// ACL present in this mapping
		acls: Record<FrontendAcl["name"], FrontendAcl>;
	};

	export type FrontendAcl = {
		// Name of the ACL
		name: string;

		activator: HostAclActivator;
	};

	export type HostAclActivator = {
		host: string;
	};

	export type FrontendMapping = {
		// Name of the ACL to use
		acl?: string;
		// Name of the backend to use
		backend: string;
	};

	export type Backend = {
		name: string;
		servers: BackendServer[];
	};

	export type BackendServer = {
		name: string;
		host: string;
		port: number;
		checked: boolean;
	};
}

export type ConfigState = {
	raw: HaproxyConfiguration;
	parsed: Parsed.Config;
	current: HaproxyConfigurationFront;
	previous: HaproxyConfigurationFront;
	calls: {
		validate?: PromiseState;
		save?: PromiseState;
	};
};
