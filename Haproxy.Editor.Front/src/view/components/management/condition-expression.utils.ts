export type ConditionOperator = "and" | "or";

export type ConditionAclClause = {
	kind: "acl";
	name: string;
	negated: boolean;
};

export type ConditionGroupClause = {
	kind: "group";
	operator: ConditionOperator;
	items: ConditionClause[];
	negated: boolean;
	preserveGrouping?: boolean;
};

export type ConditionClause = ConditionAclClause | ConditionGroupClause;

export type ParsedConditionExpression =
	| {
			kind: "tree";
			root: ConditionClause;
	  }
	| {
			kind: "raw";
			value: string;
	  };

type Token =
	| { kind: "identifier"; value: string }
	| { kind: "lparen"; value: string }
	| { kind: "rparen"; value: string }
	| { kind: "and"; value: string }
	| { kind: "or"; value: string }
	| { kind: "not"; value: string };

export function createAclClause(name = "", negated = false): ConditionAclClause {
	return {
		kind: "acl",
		name,
		negated,
	};
}

export function createGroupClause(
	operator: ConditionOperator = "and",
	items: ConditionClause[] = [createAclClause()],
	preserveGrouping = false
): ConditionGroupClause {
	return {
		kind: "group",
		operator,
		items,
		negated: false,
		preserveGrouping,
	};
}

export function createEmptyConditionExpression(defaultAcl = ""): ParsedConditionExpression {
	return {
		kind: "tree",
		root: createGroupClause("and", [createAclClause(defaultAcl)]),
	};
}

function tokenizeConditionExpression(value: string) {
	const tokens: Token[] = [];
	let index = 0;

	while (index < value.length) {
		const char = value[index];

		if (/\s/.test(char)) {
			index += 1;
			continue;
		}

		if (char === "(") {
			tokens.push({ kind: "lparen", value: char });
			index += 1;
			continue;
		}

		if (char === ")") {
			tokens.push({ kind: "rparen", value: char });
			index += 1;
			continue;
		}

		if (char === "!") {
			tokens.push({ kind: "not", value: char });
			index += 1;
			continue;
		}

		if (char === "&" && value[index + 1] === "&") {
			tokens.push({ kind: "and", value: "&&" });
			index += 2;
			continue;
		}

		if (char === "|" && value[index + 1] === "|") {
			tokens.push({ kind: "or", value: "||" });
			index += 2;
			continue;
		}

		const start = index;
		while (index < value.length && !/\s/.test(value[index]) && value[index] !== "(" && value[index] !== ")" && value[index] !== "!" && value[index] !== "&" && value[index] !== "|") {
			index += 1;
		}

		const word = value.slice(start, index);
		const normalized = word.toLowerCase();

		if (normalized === "and") {
			tokens.push({ kind: "and", value: word });
			continue;
		}

		if (normalized === "or") {
			tokens.push({ kind: "or", value: word });
			continue;
		}

		if (normalized === "not") {
			tokens.push({ kind: "not", value: word });
			continue;
		}

		tokens.push({ kind: "identifier", value: word });
	}

	return tokens;
}

class ConditionExpressionParser {
	private readonly tokens: Token[];
	private index = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	parse(): ConditionClause {
		const expression = this.parseOrExpression();
		if (!this.isAtEnd()) {
			throw new Error("Unexpected trailing tokens in condition expression.");
		}

		return expression;
	}

	private parseOrExpression(): ConditionClause {
		const items = [this.parseAndExpression()];

		while (this.match("or")) {
			items.push(this.parseAndExpression());
		}

		return this.normalizeGroup("or", items);
	}

	private parseAndExpression(): ConditionClause {
		const items = [this.parseUnaryExpression()];

		while (true) {
			if (this.match("and")) {
				items.push(this.parseUnaryExpression());
				continue;
			}

			if (this.peekStartsImplicitAnd()) {
				items.push(this.parseUnaryExpression());
				continue;
			}

			break;
		}

		return this.normalizeGroup("and", items);
	}

	private parseUnaryExpression(): ConditionClause {
		let negated = false;

		while (this.match("not")) {
			negated = !negated;
		}

		if (this.match("lparen")) {
			const nested = this.parseOrExpression();
			this.expect("rparen");
			return this.negateClause(nested.kind === "group" ? { ...nested, preserveGrouping: true } : createGroupClause("and", [nested], true), negated);
		}

		const identifier = this.consume("identifier");
		return {
			kind: "acl",
			name: identifier.value,
			negated,
		};
	}

	private normalizeGroup(operator: ConditionOperator, items: ConditionClause[]): ConditionClause {
		const normalized: ConditionClause[] = [];

		for (const item of items) {
			if (item.kind === "group" && !item.negated && !item.preserveGrouping && item.operator === operator) {
				normalized.push(...item.items);
			} else {
				normalized.push(item);
			}
		}

		if (normalized.length === 1) {
			return normalized[0];
		}

		return {
			kind: "group",
			operator,
			items: normalized,
			negated: false,
		};
	}

	private negateClause(clause: ConditionClause, negated: boolean): ConditionClause {
		if (!negated) {
			return clause;
		}

		return {
			...clause,
			negated: !clause.negated,
		};
	}

	private match(kind: Token["kind"]): boolean {
		const token = this.tokens[this.index];
		if (!token || token.kind !== kind) {
			return false;
		}

		this.index += 1;
		return true;
	}

	private expect(kind: Token["kind"]): Token {
		const token = this.tokens[this.index];
		if (!token || token.kind !== kind) {
			throw new Error(`Expected ${kind} token.`);
		}

		this.index += 1;
		return token;
	}

	private consume(kind: Extract<Token["kind"], "identifier">): Extract<Token, { kind: "identifier" }> {
		const token = this.tokens[this.index];
		if (!token || token.kind !== kind) {
			throw new Error(`Expected ${kind} token.`);
		}

		this.index += 1;
		return token;
	}

	private peekStartsImplicitAnd(): boolean {
		const token = this.tokens[this.index];
		return Boolean(token && (token.kind === "identifier" || token.kind === "lparen" || token.kind === "not"));
	}

	private isAtEnd(): boolean {
		return this.index >= this.tokens.length;
	}
}

function tryParseConditionExpression(value: string): ConditionClause {
	const parser = new ConditionExpressionParser(tokenizeConditionExpression(value));
	return parser.parse();
}

export function parseConditionExpression(value: string | null | undefined): ParsedConditionExpression {
	const trimmed = value?.trim() ?? "";

	if (!trimmed) {
		return createEmptyConditionExpression();
	}

	try {
		const root = tryParseConditionExpression(trimmed);
		return {
			kind: "tree",
			root,
		};
	} catch {
		return {
			kind: "raw",
			value: trimmed,
		};
	}
}

export function ensureTreeConditionExpression(value: ParsedConditionExpression): ParsedConditionExpression {
	if (value.kind !== "tree") {
		return value;
	}

	return {
		kind: "tree",
		root: normalizeConditionClause(value.root),
	};
}

function normalizeConditionClause(clause: ConditionClause): ConditionClause {
	if (clause.kind === "acl") {
		return clause;
	}

	const items = clause.items.map(normalizeConditionClause);
	const flattened: ConditionClause[] = [];

	for (const item of items) {
		if (item.kind === "group" && !item.negated && !item.preserveGrouping && item.operator === clause.operator) {
			flattened.push(...item.items);
		} else {
			flattened.push(item);
		}
	}

	if (flattened.length === 1 && !clause.negated && !clause.preserveGrouping) {
		return flattened[0];
	}

	return {
		...clause,
		items: flattened,
	};
}

function serializeConditionClause(clause: ConditionClause, parentOperator?: ConditionOperator): string {
	if (clause.kind === "acl") {
		const value = clause.name.trim();
		if (!value) {
			return "";
		}

		return clause.negated ? `!${value}` : value;
	}

	const serializedItems = clause.items.map((item) => serializeConditionClause(item, clause.operator)).filter((item) => item !== "");
	if (serializedItems.length === 0) {
		return "";
	}

	const joined = clause.operator === "and" ? serializedItems.join(" ") : serializedItems.join(" or ");
	const needsParens = clause.preserveGrouping || (parentOperator !== undefined && parentOperator !== clause.operator) || (clause.negated && serializedItems.length > 1);
	const wrapped = needsParens ? `(${joined})` : joined;
	return clause.negated ? `!${wrapped}` : wrapped;
}

export function serializeConditionExpression(value: ParsedConditionExpression): string {
	if (value.kind === "raw") {
		return value.value.trim();
	}

	return serializeConditionClause(normalizeConditionClause(value.root));
}

function collectConditionAclNames(clause: ConditionClause, names: Set<string>) {
	if (clause.kind === "acl") {
		if (clause.name.trim()) {
			names.add(clause.name.trim());
		}
		return;
	}

	for (const item of clause.items) {
		collectConditionAclNames(item, names);
	}
}

export function getConditionAclNames(value: string | null | undefined): Set<string> {
	const names = new Set<string>();
	const parsed = parseConditionExpression(value);

	if (parsed.kind === "tree") {
		collectConditionAclNames(parsed.root, names);
	}

	return names;
}

function renameConditionAclInClause(clause: ConditionClause, previousName: string, nextName: string): ConditionClause {
	if (clause.kind === "acl") {
		return clause.name === previousName ? { ...clause, name: nextName } : clause;
	}

	return {
		...clause,
		items: clause.items.map((item) => renameConditionAclInClause(item, previousName, nextName)),
	};
}

export function replaceAclReferencesInConditionExpression(
	value: string | null | undefined,
	previousName: string,
	nextName: string
): string | null {
	if (!value || !previousName || !nextName || previousName === nextName) {
		return value ?? null;
	}

	const parsed = parseConditionExpression(value);
	if (parsed.kind === "tree") {
		return serializeConditionExpression({
			kind: "tree",
			root: renameConditionAclInClause(parsed.root, previousName, nextName),
		}) || null;
	}

	const pattern = createConditionAclReferencePattern(previousName);
	return value.replace(pattern, `$1${nextName}`);
}

export function hasAclReferenceInConditionExpression(value: string | null | undefined, aclName: string) {
	if (!value || !aclName) {
		return false;
	}

	const parsed = parseConditionExpression(value);
	if (parsed.kind === "tree") {
		const names = new Set<string>();
		collectConditionAclNames(parsed.root, names);
		return names.has(aclName);
	}

	return createConditionAclReferencePattern(aclName).test(value);
}

export function createConditionAclReferencePattern(aclName: string) {
	return new RegExp(`(^|[^A-Za-z0-9_-])(${escapeRegExp(aclName)})(?=[^A-Za-z0-9_-]|$)`, "g");
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- Tree mutation helpers (immutable) ---

export type ClausePath = number[];

export function updateClauseAtPath(root: ConditionGroupClause, path: ClausePath, updater: (clause: ConditionClause) => ConditionClause): ConditionGroupClause {
	if (path.length === 0) {
		const result = updater(root);
		return result.kind === "group" ? result : createGroupClause("and", [result]);
	}

	const [head, ...rest] = path;
	const nextItems = [...root.items];
	const target = nextItems[head];

	if (!target) {
		return root;
	}

	if (rest.length === 0) {
		nextItems[head] = updater(target);
	} else if (target.kind === "group") {
		nextItems[head] = updateClauseAtPath(target, rest, updater);
	}

	return { ...root, items: nextItems };
}

export function removeClauseAtPath(root: ConditionGroupClause, path: ClausePath): ConditionGroupClause {
	if (path.length === 0) {
		return root;
	}

	const [head, ...rest] = path;

	if (rest.length === 0) {
		return { ...root, items: root.items.filter((_, i) => i !== head) };
	}

	const target = root.items[head];
	if (!target || target.kind !== "group") {
		return root;
	}

	const nextItems = [...root.items];
	nextItems[head] = removeClauseAtPath(target, rest);
	return { ...root, items: nextItems };
}

export function addClauseAtPath(root: ConditionGroupClause, path: ClausePath, clause: ConditionClause): ConditionGroupClause {
	if (path.length === 0) {
		return { ...root, items: [...root.items, clause] };
	}

	return updateClauseAtPath(root, path, (target) => {
		if (target.kind !== "group") {
			return target;
		}
		return { ...target, items: [...target.items, clause] };
	});
}

export function getClauseAtPath(root: ConditionClause, path: ClausePath): ConditionClause | null {
	let current: ConditionClause = root;

	for (const index of path) {
		if (current.kind !== "group") {
			return null;
		}
		const child = current.items[index];
		if (!child) {
			return null;
		}
		current = child;
	}

	return current;
}
