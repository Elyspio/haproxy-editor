import type { HaproxyAclResource, HaproxyBackendSwitchingRuleResource } from "@modules/config/config.types";
import { hasAclReferenceInConditionExpression, replaceAclReferencesInConditionExpression } from "./condition-expression.utils";

export type AclPresetId = "path_prefix" | "path_exact" | "path_regex" | "host" | "host_prefix" | "host_regex" | "source" | "method" | "header" | "header_regex" | "custom";

export type AclPresetState = {
	preset: AclPresetId;
	primary: string;
	secondary: string;
};

export type AclUsage = HaproxyBackendSwitchingRuleResource & {
	id: string;
};

export type AclCatalogEntry = {
	id: string;
	frontendName: string;
	acl: HaproxyAclResource;
	usages: AclUsage[];
	usageCount: number;
	duplicateCount: number;
};

export const ACL_PRESET_OPTIONS: Array<{ value: AclPresetId; label: string }> = [
	{ value: "path_prefix", label: "Path Prefix" },
	{ value: "path_exact", label: "Path Exact" },
	{ value: "path_regex", label: "Path Regex" },
	{ value: "host", label: "Host Exact" },
	{ value: "host_prefix", label: "Host Prefix" },
	{ value: "host_regex", label: "Host Regex" },
	{ value: "source", label: "Source IP/CIDR" },
	{ value: "method", label: "HTTP Method" },
	{ value: "header", label: "Header Exact" },
	{ value: "header_regex", label: "Header Regex" },
	{ value: "custom", label: "Custom" },
];

export function hasAclReference(value: string | null | undefined, aclName: string) {
	if (!value || !aclName) {
		return false;
	}

	return hasAclReferenceInConditionExpression(value, aclName);
}

export function replaceAclReferences(value: string | null | undefined, previousName: string, nextName: string) {
	if (!value || !previousName || !nextName || previousName === nextName) {
		return value ?? null;
	}

	return replaceAclReferencesInConditionExpression(value, previousName, nextName);
}

export function createUniqueAclName(existingNames: string[], baseName: string) {
	if (!existingNames.includes(baseName)) {
		return baseName;
	}

	let index = 2;
	let nextName = `${baseName}_${index}`;
	while (existingNames.includes(nextName)) {
		index += 1;
		nextName = `${baseName}_${index}`;
	}

	return nextName;
}

function stripCaseInsensitiveFlag(value: string | null | undefined) {
	if (!value) {
		return "";
	}

	return value.startsWith("-i ") ? value.slice(3) : value;
}

function withCaseInsensitiveFlag(value: string) {
	return value.trim() ? `-i ${value.trim()}` : null;
}

export function resolveAclPresetState(acl: Pick<HaproxyAclResource, "criterion" | "value">): AclPresetState {
	const criterion = acl.criterion ?? "";
	const value = acl.value ?? "";

	if (criterion === "path_beg") {
		return { preset: "path_prefix", primary: value, secondary: "" };
	}

	if (criterion === "path") {
		return { preset: "path_exact", primary: value, secondary: "" };
	}

	if (criterion === "path_reg") {
		return { preset: "path_regex", primary: value, secondary: "" };
	}

	if (criterion === "hdr(host)") {
		return { preset: "host", primary: stripCaseInsensitiveFlag(value), secondary: "" };
	}

	if (criterion === "hdr_beg(host)") {
		return { preset: "host_prefix", primary: stripCaseInsensitiveFlag(value), secondary: "" };
	}

	if (criterion === "hdr_reg(host)") {
		return { preset: "host_regex", primary: value, secondary: "" };
	}

	if (criterion === "src") {
		return { preset: "source", primary: value, secondary: "" };
	}

	if (criterion === "method") {
		return { preset: "method", primary: stripCaseInsensitiveFlag(value), secondary: "" };
	}

	const headerExactMatch = criterion.match(/^hdr\((.+)\)$/);
	if (headerExactMatch && headerExactMatch[1] !== "host") {
		return { preset: "header", primary: headerExactMatch[1], secondary: stripCaseInsensitiveFlag(value) };
	}

	const headerRegexMatch = criterion.match(/^hdr_reg\((.+)\)$/);
	if (headerRegexMatch && headerRegexMatch[1] !== "host") {
		return { preset: "header_regex", primary: headerRegexMatch[1], secondary: value };
	}

	return {
		preset: "custom",
		primary: criterion,
		secondary: value,
	};
}

export function buildAclFromPresetState(state: AclPresetState): Pick<HaproxyAclResource, "criterion" | "value"> {
	switch (state.preset) {
		case "path_prefix":
			return { criterion: "path_beg", value: state.primary.trim() || null };
		case "path_exact":
			return { criterion: "path", value: state.primary.trim() || null };
		case "path_regex":
			return { criterion: "path_reg", value: state.primary.trim() || null };
		case "host":
			return { criterion: "hdr(host)", value: withCaseInsensitiveFlag(state.primary) };
		case "host_prefix":
			return { criterion: "hdr_beg(host)", value: withCaseInsensitiveFlag(state.primary) };
		case "host_regex":
			return { criterion: "hdr_reg(host)", value: state.primary.trim() || null };
		case "source":
			return { criterion: "src", value: state.primary.trim() || null };
		case "method":
			return { criterion: "method", value: withCaseInsensitiveFlag(state.primary) };
		case "header":
			return {
				criterion: state.primary.trim() ? `hdr(${state.primary.trim()})` : null,
				value: withCaseInsensitiveFlag(state.secondary),
			};
		case "header_regex":
			return {
				criterion: state.primary.trim() ? `hdr_reg(${state.primary.trim()})` : null,
				value: state.secondary.trim() || null,
			};
		case "custom":
		default:
			return { criterion: state.primary.trim() || null, value: state.secondary.trim() || null };
	}
}

export function getAclKindLabel(acl: Pick<HaproxyAclResource, "criterion" | "value">) {
	const preset = resolveAclPresetState(acl);
	return ACL_PRESET_OPTIONS.find((option) => option.value === preset.preset)?.label ?? acl.criterion ?? "Custom";
}
