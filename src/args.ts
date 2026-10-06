/**
 * Some models send a list as a JSON string ("[\"topic/asthma\"]") or as
 * "a, b". pi validates tool arguments against the schema before Sub-Sub sees
 * them, so the schema also accepts a string where it wants a list of strings,
 * and Sub-Sub turns the string back into a list before the server gets it.
 * (Seen in the model test: three models lost several turns on this.)
 */

type Schema = Record<string, any>;

function isStringArray(s: Schema | undefined): boolean {
	if (!s || typeof s !== "object") return false;
	if (s.type === "array") return !s.items || s.items.type === "string";
	const alts = (s.anyOf ?? s.oneOf) as Schema[] | undefined;
	return Array.isArray(alts) && alts.some((a) => a?.type === "array" && (!a.items || a.items.type === "string"));
}

/** A copy of the input schema where top-level string lists also accept a string. */
export function loosenArrays(schema: Schema): Schema {
	if (!schema || typeof schema !== "object" || !schema.properties) return schema;
	const props: Schema = {};
	for (const [k, v] of Object.entries(schema.properties as Schema)) {
		if (!isStringArray(v as Schema)) {
			props[k] = v;
			continue;
		}
		const s = v as Schema;
		const alts = (s.anyOf ?? s.oneOf) as Schema[] | undefined;
		if (alts) {
			props[k] = { ...s, anyOf: [...alts, { type: "string" }], oneOf: undefined };
		} else {
			const { description, default: def, title, ...inner } = s;
			props[k] = { anyOf: [inner, { type: "string" }], description, default: def, title };
		}
		for (const key of Object.keys(props[k])) if (props[k][key] === undefined) delete props[k][key];
	}
	return { ...schema, properties: props };
}

export function toList(value: string): string[] {
	const t = value.trim();
	if (t.startsWith("[")) {
		try {
			const parsed = JSON.parse(t);
			if (Array.isArray(parsed)) return parsed.map((x) => String(x));
		} catch {
			/* fall through */
		}
	}
	return t
		.replace(/^\[|\]$/g, "")
		.split(/[,\n]/)
		.map((x) => x.trim().replace(/^["'`]|["'`]$/g, ""))
		.filter(Boolean);
}

/** Turn strings back into lists where the original schema wants a list of strings. Changes input in place. */
export function coerceArgs(original: Schema, input: Record<string, unknown>): Record<string, unknown> {
	const props = (original?.properties ?? {}) as Schema;
	for (const [k, v] of Object.entries(input)) {
		if (typeof v === "string" && isStringArray(props[k])) input[k] = toList(v);
	}
	return input;
}

/**
 * Arguments that name a file in the user's working folder (a manuscript, a report
 * folder, a bibliography to write). The servers run in their own working folder, so
 * Sub-Sub makes these paths absolute against its own, as pi's file tools read them.
 * Note paths (tag reviews, the import queue, linked notes) are not here: the servers
 * read those from the Sub-Sub folder.
 */
export const CWD_PATH_ARGS: Record<string, string[]> = {
	scholar_check_manuscript: ["path"],
	scholar_export_bibliography: ["output_path"],
	verify_check_manuscript: ["path", "report_dir"],
	verify_prepare_claims: ["path", "report_dir"],
	verify_record_claims: ["path", "report_dir"],
};

/** Make the working-folder paths of a tool call absolute. Changes input in place. */
export function resolvePathArgs(tool: string, input: Record<string, unknown>, toAbsolute: (p: string) => string): Record<string, unknown> {
	for (const k of CWD_PATH_ARGS[tool] ?? []) {
		const v = input[k];
		if (typeof v === "string" && v.trim()) input[k] = toAbsolute(v);
	}
	return input;
}
