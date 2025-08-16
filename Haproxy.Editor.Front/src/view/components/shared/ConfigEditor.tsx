import Editor, { type Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";

function handleEditorWillMount(monaco: Monaco) {
	monaco.languages.register({ id: "haproxy" });

	monaco.languages.setMonarchTokensProvider("haproxy", {
		tokenizer: {
			root: [
				[/#.*$/, "comment"],
				[/\b(global|defaults|frontend|backend|listen)\b/, "keyword"],
				[
					/\b(server|daemon|bind|mode|option|timeout|log|acl|http-request|http-response|stick-table|stick|use_backend|default_backend|redirect|errorfile|balance|stats|tcp-request|tcp-response|monitor-uri|compression|http-check|retries|maxconn|maxconnrate|maxsessrate|maxsslconn|maxsslrate|source|unique-id-format|unique-id-header|rspadd|rspdel|rspiden|reqadd|reqdel|reqiden)\b/,
					"identifier",
				],
				[/\b(on|off|true|false|enabled|disabled)\b/, "constant"],
				[/\b\d+\b/, "number"],
				[/\b\d{1,3}(\.\d{1,3}){3}(:\d+)?\b/, "number"],
				[/"[^"]*"/, "string"],
				[/'[^']*'/, "string"],
			],
		},
	});

	monaco.editor.defineTheme("haproxyTheme", {
		base: "vs", // or "vs-dark"
		inherit: true,
		colors: {},
		rules: [
			{ token: "keyword", foreground: "007acc", fontStyle: "bold" },
			{ token: "identifier", foreground: "795e26" },
			{ token: "number", foreground: "098658" },
			{ token: "comment", foreground: "008000", fontStyle: "italic" },
			{ token: "string", foreground: "a31515" },
			{ token: "constant", foreground: "aa00aa" },
		],
	});

	monaco.languages.registerCompletionItemProvider("haproxy", {
		provideCompletionItems: (model, position) => {
			const word = model.getWordUntilPosition(position);

			const range = {
				startLineNumber: position.lineNumber,
				endLineNumber: position.lineNumber,
				startColumn: word.startColumn,
				endColumn: word.endColumn,
			};

			return {
				suggestions: [
					{ label: "frontend", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "frontend ", range },
					{ label: "backend", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "backend ", range },
					{ label: "listen", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "listen ", range },
					{ label: "global", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "global\n", range },
					{ label: "defaults", kind: monaco.languages.CompletionItemKind.Keyword, insertText: "defaults\n", range },
					{ label: "server", kind: monaco.languages.CompletionItemKind.Function, insertText: "server ", range },
					{ label: "bind", kind: monaco.languages.CompletionItemKind.Function, insertText: "bind ", range },
					{ label: "mode", kind: monaco.languages.CompletionItemKind.Property, insertText: "mode ", range },
					{ label: "option", kind: monaco.languages.CompletionItemKind.Property, insertText: "option ", range },
					{ label: "timeout", kind: monaco.languages.CompletionItemKind.Property, insertText: "timeout ", range },
					{ label: "acl", kind: monaco.languages.CompletionItemKind.Function, insertText: "acl ", range },
					{ label: "http-request", kind: monaco.languages.CompletionItemKind.Function, insertText: "http-request ", range },
					{ label: "http-response", kind: monaco.languages.CompletionItemKind.Function, insertText: "http-response ", range },
					{ label: "balance", kind: monaco.languages.CompletionItemKind.Property, insertText: "balance ", range },
					{ label: "stats", kind: monaco.languages.CompletionItemKind.Function, insertText: "stats ", range },
					{ label: "tcp-request", kind: monaco.languages.CompletionItemKind.Function, insertText: "tcp-request ", range },
					{ label: "tcp-response", kind: monaco.languages.CompletionItemKind.Function, insertText: "tcp-response ", range },
					{ label: "use_backend", kind: monaco.languages.CompletionItemKind.Function, insertText: "use_backend ", range },
					{ label: "default_backend", kind: monaco.languages.CompletionItemKind.Function, insertText: "default_backend ", range },
					{ label: "errorfile", kind: monaco.languages.CompletionItemKind.Function, insertText: "errorfile ", range },
					{ label: "log", kind: monaco.languages.CompletionItemKind.Property, insertText: "log ", range },
					{ label: "stick-table", kind: monaco.languages.CompletionItemKind.Function, insertText: "stick-table ", range },
					{ label: "stick", kind: monaco.languages.CompletionItemKind.Function, insertText: "stick ", range },
					{ label: "reqadd", kind: monaco.languages.CompletionItemKind.Function, insertText: "reqadd ", range },
					{ label: "rspadd", kind: monaco.languages.CompletionItemKind.Function, insertText: "rspadd ", range },
				],
			};
		},
	});
}

type ConfigEditorProps = {
	content: string;
} & ({ disabled: true } | { disabled?: false; onChange: (value: string | undefined, ev: editor.IModelContentChangedEvent) => void });

export function ConfigEditor(props: ConfigEditorProps) {
	return (
		<Editor
			theme="haproxyTheme"
			language={"haproxy"}
			height={"100%"}
			defaultLanguage="haproxy"
			defaultValue={props.content}
			beforeMount={handleEditorWillMount}
			onChange={!props.disabled ? props.onChange : undefined}
		/>
	);
}
