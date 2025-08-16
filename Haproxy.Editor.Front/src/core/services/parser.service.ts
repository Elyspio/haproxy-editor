/* eslint-disable @typescript-eslint/no-unused-vars */
import { injectable } from "inversify";
import { Parsed } from "@modules/config/config.types";
import type { HaproxyConfiguration } from "@apis/generated";

@injectable()
export class HaproxyConfigurationParser {
	// region frontends

	public parseFrontends(conf: HaproxyConfiguration["frontends"]): Parsed.Config["frontends"] {
		return Object.entries(conf).reduce(
			(arr, [name, content]) => {
				arr[name] = this.parseFrontend(name, content);
				return arr;
			},
			{} as Parsed.Config["frontends"]
		);
	}

	public parseBackends(conf: HaproxyConfiguration["backends"]): Parsed.Config["backends"] {
		return Object.entries(conf).reduce(
			(arr, [name, content]) => {
				arr[name] = this.parseBackend(name, content);
				return arr;
			},
			{} as Parsed.Config["backends"]
		);
	}

	private parseFrontend(name: string, content: string[]): Parsed.Frontend {
		content = content.map((line) => line.trim().replaceAll(/ +/g, " ")).filter((line) => line.length > 0 && !line.startsWith("#"));

		const acls: Record<Parsed.FrontendAcl["name"], Parsed.FrontendAcl> = {};
		const mappings: Parsed.FrontendMapping[] = [];

		for (const line of content) {
			const acl = this.tryParseAcl(line);
			if (acl) acls[acl.name] = acl;

			const mapping = this.tryParseMapping(line);
			if (mapping) mappings.push(mapping);
		}

		return {
			name: name.trim(),
			acls: acls,
			mappings,
		};
	}

	private tryParseAcl(line: string): Parsed.FrontendAcl | false {
		const matches = aclHostRegex.exec(line)?.values();
		if (!matches) return false;

		const [_, name, host] = matches;

		return {
			name: name.trim(),
			activator: {
				host: host.trim(),
			},
		};
	}

	// endregion frontends

	// region backends

	private tryParseMapping(line: string): Parsed.FrontendMapping | false {
		const matches = mappingRegex.exec(line)?.values();
		if (!matches) return false;
		const [_, backend, acl] = matches;
		return {
			acl: acl.trim(),
			backend: backend.trim(),
		};
	}

	private parseBackend(name: string, content: string[]): Parsed.Backend {
		content = content.map((line) => line.trim().replaceAll(/ +/g, " ")).filter((line) => line.length > 0 && !line.startsWith("#"));

		const servers: Parsed.BackendServer[] = [];

		for (const line of content) {
			const server = this.tryParseServer(line);
			if (server) servers.push(server);
		}

		return {
			name,
			servers,
		};
	}

	private tryParseServer(line: string): Parsed.BackendServer | false {
		const matches = serverRegex.exec(line)?.values();
		if (!matches) return false;

		const [_, name, hostWithPort, check] = matches;

		const startOfPort = hostWithPort.indexOf(":");

		const host = startOfPort === -1 ? hostWithPort : hostWithPort.slice(0, startOfPort);

		const port = startOfPort !== -1 ? Number.parseInt(hostWithPort.slice(startOfPort + 1)) : 80;

		return {
			name: name.trim(),
			host: host.trim(),
			port,
			checked: !!check,
		};
	}

	// endregion backends
}

const aclHostRegex = /acl (.+) *hdr\(host\) *-i * (.*)$/;
const mappingRegex = /use_backend (.+) *if *(.+)$/;
const serverRegex = /server\s+(\S+)\s+(\S+)(?:\s+(check))?$/;
