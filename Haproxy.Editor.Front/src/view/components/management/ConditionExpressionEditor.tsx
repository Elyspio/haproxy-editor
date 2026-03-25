import { AccountTreeOutlined, Add, DeleteOutline } from "@mui/icons-material";
import { Autocomplete, Box, Chip, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useState } from "react";
import {
	type ConditionClause,
	type ConditionGroupClause,
	createAclClause,
	createEmptyConditionExpression,
	createGroupClause,
	ensureTreeConditionExpression,
	parseConditionExpression,
	type ParsedConditionExpression,
	serializeConditionExpression
} from "./condition-expression.utils";

type ConditionExpressionEditorProps = {
	value: string | null;
	aclOptions: string[];
	updateValue: (nextValue: string | null) => void;
	label?: string;
	helperText?: string;
};

export function ConditionExpressionEditor({ value, aclOptions, updateValue, label = "Condition Expression", helperText }: Readonly<ConditionExpressionEditorProps>) {
	const [trackedValue, setTrackedValue] = useState(value);
	const [draftExpression, setDraftExpression] = useState(() => ensureTreeConditionExpression(parseConditionExpression(value)));

	if (value !== trackedValue) {
		setTrackedValue(value);
		setDraftExpression(ensureTreeConditionExpression(parseConditionExpression(value)));
	}

	const commitExpression = (nextExpression: ParsedConditionExpression) => {
		const serialized = serializeConditionExpression(nextExpression).trim();
		setDraftExpression(nextExpression.kind === "tree" ? ensureTreeConditionExpression(nextExpression) : createEmptyConditionExpression());

		if (serialized) {
			setTrackedValue(serialized);
			updateValue(serialized);
			return;
		}

		if ((value ?? "").trim()) {
			setTrackedValue(null);
			updateValue(null);
		}
	};

	if (draftExpression.kind === "raw") {
		return (
			<TextField
				size="small"
				fullWidth
				multiline
				minRows={2}
				label={label}
				value={draftExpression.value}
				onChange={(event) => updateValue(event.target.value || null)}
				helperText={helperText ?? "Use the tree builder syntax: ACL names combined with AND/OR and parentheses."}
			/>
		);
	}

	return (
		<Box sx={{ display: "grid", gap: 0.75 }} pt={0.5}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
				<Typography variant="body2" fontWeight={600}>
					{label}
				</Typography>
			</Stack>

			<CompactGroupEditor
				node={draftExpression.root.kind === "group" ? draftExpression.root : createGroupClause("and", [draftExpression.root])}
				aclOptions={aclOptions}
				depth={0}
				onChange={(nextNode) => commitExpression({ kind: "tree", root: nextNode })}
			/>
			{helperText ? (
				<Typography variant="caption" color="text.secondary">
					{helperText}
				</Typography>
			) : null}
		</Box>
	);
}

type CompactGroupEditorProps = {
	node: ConditionGroupClause;
	aclOptions: string[];
	depth: number;
	onChange: (nextNode: ConditionGroupClause) => void;
	onDelete?: () => void;
};

const DEPTH_COLORS = ["primary", "warning", "info", "success", "secondary"] as const;

function depthColor(depth: number) {
	return DEPTH_COLORS[depth % DEPTH_COLORS.length];
}

function CompactGroupEditor({ node, aclOptions, depth, onChange, onDelete }: Readonly<CompactGroupEditorProps>) {
	const theme = useTheme();
	const color = depthColor(depth);

	const updateItem = (itemIndex: number, nextItem: ConditionClause) => {
		const nextItems = [...node.items];
		nextItems[itemIndex] = nextItem;
		onChange({ ...node, items: nextItems });
	};

	const removeItem = (itemIndex: number) => {
		onChange({ ...node, items: node.items.filter((_, i) => i !== itemIndex) });
	};

	const addAcl = () => {
		onChange({ ...node, items: [...node.items, createAclClause()] });
	};

	const addGroup = () => {
		onChange({ ...node, items: [...node.items, createGroupClause("and", [createAclClause()], true)] });
	};

	const toggleOperator = () => {
		onChange({ ...node, operator: node.operator === "and" ? "or" : "and" });
	};

	const toggleNegated = () => {
		onChange({ ...node, negated: !node.negated });
	};

	return (
		<Box
			sx={{
				borderLeft: `2px solid ${alpha(theme.palette[color].main, 0.4)}`,
				pl: 1.5,
				py: 0.5,
			}}
		>
			<Stack spacing={0.5}>
				{/* Group header */}
				<Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
					{node.negated ? (
						<Chip
							label="NOT"
							size="small"
							color="error"
							variant="outlined"
							onDelete={toggleNegated}
							sx={{ fontWeight: 600, height: 24 }}
						/>
					) : null}
					{node.items.length > 1 ? (
						<Chip
							label={node.operator.toUpperCase()}
							size="small"
							color={color}
							variant="filled"
							onClick={toggleOperator}
							sx={{ fontWeight: 600, height: 24, cursor: "pointer" }}
						/>
					) : null}
					{!node.negated ? (
						<Tooltip title="Negate group" arrow>
							<Chip
								label="!"
								size="small"
								variant="outlined"
								onClick={toggleNegated}
								sx={{ fontWeight: 700, height: 24, minWidth: 28, cursor: "pointer", opacity: 0.5, "&:hover": { opacity: 1 } }}
							/>
						</Tooltip>
					) : null}
					<Tooltip title="Add ACL" arrow>
						<IconButton size="small" onClick={addAcl} sx={{ width: 24, height: 24 }}>
							<Add sx={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
					<Tooltip title="Add group" arrow>
						<IconButton size="small" onClick={addGroup} sx={{ width: 24, height: 24 }}>
							<AccountTreeOutlined sx={{ fontSize: 14 }} />
						</IconButton>
					</Tooltip>
					{onDelete ? (
						<Tooltip title="Delete group" arrow>
							<IconButton size="small" color="error" onClick={onDelete} sx={{ width: 24, height: 24 }}>
								<DeleteOutline sx={{ fontSize: 16 }} />
							</IconButton>
						</Tooltip>
					) : null}
				</Stack>

				{/* Items */}
				{node.items.length > 0 ? (
					<Stack spacing={0.25}>
						{node.items.map((item, itemIndex) => (
							<Box key={`${depth}-${itemIndex}`}>
								{itemIndex > 0 ? (
									<Typography variant="caption" sx={{ pl: 0.5, color: theme.palette[color].main, fontWeight: 600, fontSize: "0.65rem", userSelect: "none" }}>
										{node.operator.toUpperCase()}
									</Typography>
								) : null}
								{item.kind === "acl" ? (
									<AclClauseRow
										item={item}
										aclOptions={aclOptions}
										onNameChange={(name) => updateItem(itemIndex, { ...item, name })}
										onNegatedToggle={() => updateItem(itemIndex, { ...item, negated: !item.negated })}
										onDelete={() => removeItem(itemIndex)}
									/>
								) : (
									<CompactGroupEditor
										node={item}
										aclOptions={aclOptions}
										depth={depth + 1}
										onChange={(next) => updateItem(itemIndex, next)}
										onDelete={() => removeItem(itemIndex)}
									/>
								)}
							</Box>
						))}
					</Stack>
				) : (
					<Typography variant="caption" color="text.disabled" sx={{ pl: 0.5 }}>
						Empty group
					</Typography>
				)}
			</Stack>
		</Box>
	);
}

type AclClauseRowProps = {
	item: { name: string; negated: boolean };
	aclOptions: string[];
	onNameChange: (name: string) => void;
	onNegatedToggle: () => void;
	onDelete: () => void;
};

function AclClauseRow({ item, aclOptions, onNameChange, onNegatedToggle, onDelete }: Readonly<AclClauseRowProps>) {
	return (
		<Stack direction="row" alignItems="center" spacing={0.5}>
			<Chip
				label={item.negated ? "NOT" : "ACL"}
				size="small"
				variant={item.negated ? "filled" : "outlined"}
				color={item.negated ? "error" : "default"}
				onClick={onNegatedToggle}
				sx={{ fontWeight: 600, height: 24, minWidth: 40, cursor: "pointer", fontSize: "0.7rem" }}
			/>
			<Autocomplete
				size="small"
				freeSolo
				options={aclOptions}
				value={item.name}
				inputValue={item.name}
				onChange={(_, nextValue) => onNameChange(typeof nextValue === "string" ? nextValue : nextValue ?? "")}
				onInputChange={(_, nextValue, reason) => {
					if (reason === "reset") return;
					onNameChange(nextValue);
				}}
				renderInput={(params) => <TextField {...params} placeholder="ACL name" variant="outlined" sx={{ "& .MuiInputBase-root": { py: "2px" } }} />}
				sx={{ flex: 1, minWidth: 160 }}
			/>
			<Tooltip title="Delete" arrow>
				<IconButton size="small" color="error" onClick={onDelete} sx={{ width: 24, height: 24 }}>
					<DeleteOutline sx={{ fontSize: 16 }} />
				</IconButton>
			</Tooltip>
		</Stack>
	);
}
