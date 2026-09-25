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
