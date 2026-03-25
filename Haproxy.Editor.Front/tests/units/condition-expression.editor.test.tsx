import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConditionExpressionEditor } from "@components/management/ConditionExpressionEditor";

function EditorHarness() {
	const [value, setValue] = useState<string | null>("host_acl");

	return <ConditionExpressionEditor value={value} aclOptions={["host_acl", "path_acl"]} updateValue={setValue} />;
}

describe("ConditionExpressionEditor", () => {
	it("keeps a newly added nested group instead of flattening it into the root group", async () => {
		const user = userEvent.setup();

		render(<EditorHarness />);

		const addGroupButtons = screen.getAllByRole("button", { name: "Add group" });
		await user.click(addGroupButtons[0]);

		const andChips = screen.getAllByText("AND");
		expect(andChips.length).toBeGreaterThanOrEqual(2);
	});
});
