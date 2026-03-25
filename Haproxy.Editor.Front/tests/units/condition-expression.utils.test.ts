import { describe, expect, it } from "vitest";
import { hasAclReference, replaceAclReferences } from "@components/management/acl.utils";
import {
	addClauseAtPath,
	createAclClause,
	createGroupClause,
	getClauseAtPath,
	parseConditionExpression,
	removeClauseAtPath,
	serializeConditionExpression,
	updateClauseAtPath,
} from "@components/management/condition-expression.utils";

function roundTrip(input: string): string {
	return serializeConditionExpression(parseConditionExpression(input));
}

describe("condition-expression.utils", () => {
	it("parses ACL trees and serializes them back to HAProxy syntax", () => {
		const parsed = parseConditionExpression("host_acl another_acl or !legacy_acl");

		expect(parsed.kind).toBe("tree");
		expect(serializeConditionExpression(parsed)).toBe("(host_acl another_acl) or !legacy_acl");
	});

	it("renames ACL references inside nested expressions", () => {
		expect(replaceAclReferences("host_acl or (api_acl another_acl)", "api_acl", "api_v2_acl")).toBe("host_acl or (api_v2_acl another_acl)");
		expect(hasAclReference("host_acl or (api_acl another_acl)", "another_acl")).toBe(true);
	});

	it("preserves explicit nested groups when serializing and parsing", () => {
		const value = {
			kind: "tree" as const,
			root: createGroupClause("and", [createAclClause("host_acl"), createGroupClause("and", [createAclClause("path_acl")], true)]),
		};

		expect(serializeConditionExpression(value)).toBe("host_acl (path_acl)");

		const reparsed = parseConditionExpression("host_acl (path_acl)");

		expect(reparsed.kind).toBe("tree");
		if (reparsed.kind !== "tree" || reparsed.root.kind !== "group") {
			throw new Error("Expected a grouped condition tree.");
		}

		expect(reparsed.root.items[1]).toMatchObject({
			kind: "group",
			preserveGrouping: true,
			items: [{ kind: "acl", name: "path_acl", negated: false }],
		});
	});

	it("falls back to raw mode for unsupported syntax", () => {
		const parsed = parseConditionExpression("host_acl )");

		expect(parsed.kind).toBe("raw");
		expect(serializeConditionExpression(parsed)).toBe("host_acl )");
	});

	describe("complex expression round-trips", () => {
		it("handles (A OR (NOT B)) AND C", () => {
			expect(roundTrip("(A or !B) C")).toBe("(A or !B) C");
			expect(roundTrip("(A OR (NOT B)) AND C")).toBe("(A or (!B)) C");
		});

		it("handles NOT (A OR B)", () => {
			expect(roundTrip("!(A or B)")).toBe("!(A or B)");
			expect(roundTrip("NOT (A OR B)")).toBe("!(A or B)");
		});

		it("handles operator precedence: A AND B OR C AND D", () => {
			expect(roundTrip("A B or C D")).toBe("(A B) or (C D)");
			expect(roundTrip("A AND B OR C AND D")).toBe("(A B) or (C D)");
		});

		it("handles implicit AND with double negation", () => {
			expect(roundTrip("!A !B")).toBe("!A !B");
		});

		it("handles deeply nested groups", () => {
			expect(roundTrip("((A or B) (C or D)) or E")).toBe("((A or B) (C or D)) or E");
		});

		it("handles single ACL", () => {
			expect(roundTrip("my_acl")).toBe("my_acl");
		});

		it("handles single negated ACL", () => {
			expect(roundTrip("!my_acl")).toBe("!my_acl");
		});

		it("handles empty/whitespace", () => {
			expect(roundTrip("")).toBe("");
			expect(roundTrip("   ")).toBe("");
		});

		it("handles mixed operators: A OR B AND C", () => {
			expect(roundTrip("A or B C")).toBe("A or (B C)");
			expect(roundTrip("A OR B AND C")).toBe("A or (B C)");
		});

		it("handles negated groups inside AND", () => {
			expect(roundTrip("A !(B or C)")).toBe("A !(B or C)");
		});

		it("handles symbolic operators", () => {
			expect(roundTrip("A && B || C")).toBe("(A B) or C");
			expect(roundTrip("!A || !B")).toBe("!A or !B");
		});
	});

	describe("tree mutation helpers", () => {
		it("adds a clause at the root level", () => {
			const root = createGroupClause("and", [createAclClause("A")]);
			const result = addClauseAtPath(root, [], createAclClause("B"));

			expect(result.items).toHaveLength(2);
			expect(result.items[1]).toMatchObject({ kind: "acl", name: "B" });
		});

		it("adds a clause inside a nested group", () => {
			const root = createGroupClause("and", [createGroupClause("or", [createAclClause("A")], true)]);
			const result = addClauseAtPath(root, [0], createAclClause("B"));

			expect(result.items[0]).toMatchObject({ kind: "group", items: [{ name: "A" }, { name: "B" }] });
		});

		it("removes a clause at a given path", () => {
			const root = createGroupClause("and", [createAclClause("A"), createAclClause("B"), createAclClause("C")]);
			const result = removeClauseAtPath(root, [1]);

			expect(result.items).toHaveLength(2);
			expect(result.items[0]).toMatchObject({ name: "A" });
			expect(result.items[1]).toMatchObject({ name: "C" });
		});

		it("updates a clause at a given path", () => {
			const root = createGroupClause("and", [createAclClause("A"), createAclClause("B")]);
			const result = updateClauseAtPath(root, [1], (clause) => ({ ...clause, negated: true }));

			expect(result.items[1]).toMatchObject({ name: "B", negated: true });
		});

		it("gets a clause at a given path", () => {
			const nested = createGroupClause("or", [createAclClause("X"), createAclClause("Y")], true);
			const root = createGroupClause("and", [createAclClause("A"), nested]);

			expect(getClauseAtPath(root, [1, 0])).toMatchObject({ kind: "acl", name: "X" });
			expect(getClauseAtPath(root, [1, 1])).toMatchObject({ kind: "acl", name: "Y" });
			expect(getClauseAtPath(root, [5])).toBeNull();
		});
	});
});
