/**
 * A model provider that pi does not include: a server that speaks the OpenAI API (an institution's
 * server, Ollama, LM Studio, vLLM). Sub-Sub writes it to pi's models.json in the agent folder.
 * The FMUP model service will be one of these.
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { writeFileSafe } from "./write.ts";
import { join } from "node:path";
import { KEY_PROVIDERS } from "./keys.ts";

export interface CustomProvider {
	/** The provider name in pi (models are "<name>/<model id>"). */
	name: string;
	baseUrl: string;
	/** Empty for a local server without a key. */
	apiKey?: string;
	models: string[];
}

export const CUSTOM_DEFAULT_NAME = "custom";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** The problem with a custom provider, or undefined when it can be saved. */
export function customProviderProblem(p: CustomProvider): string | undefined {
	if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(p.name)) return "The provider name can have only lowercase letters, digits and hyphens.";
	if (KEY_PROVIDERS.some((k) => k.id === p.name)) return `${p.name} is a provider that pi already has: select it in the list.`;
	let url: URL;
	try {
		url = new URL(p.baseUrl.trim());
	} catch {
		return "The address must be a full URL, for example https://llm.example.org/v1.";
	}
	if (url.protocol !== "https:" && url.protocol !== "http:") return "The address must start with https://.";
	if (url.protocol === "http:" && !LOCAL_HOSTS.has(url.hostname)) return "Use https:// for a server on another computer, so that your key and your messages are encrypted.";
	const key = (p.apiKey ?? "").trim();
	if (/\s/.test(key) || key.length > 400) return "That does not look like an API key.";
	const ids = p.models.map((m) => m.trim()).filter(Boolean);
	if (!ids.length) return "Give at least one model id.";
	if (ids.some((m) => /\s/.test(m) || m.length > 200)) return "A model id has no spaces.";
	return undefined;
}

/**
 * Add or replace the provider in <agentDir>/models.json; other providers stay. The file is readable only by
 * the user, because it can hold the key. Returns the model specs ("<name>/<id>").
 */
export function saveCustomProvider(agentDir: string, p: CustomProvider): string[] {
	const problem = customProviderProblem(p);
	if (problem) throw new Error(problem);
	mkdirSync(agentDir, { recursive: true });
	const file = join(agentDir, "models.json");
	let data: { providers?: Record<string, unknown> } & Record<string, unknown> = {};
	if (existsSync(file)) {
		try {
			data = JSON.parse(readFileSync(file, "utf8")) ?? {};
		} catch {
			throw new Error(`${file} is not valid JSON; fix it first.`);
		}
	}
	const ids = [...new Set(p.models.map((m) => m.trim()).filter(Boolean))];
	data.providers = {
		...(data.providers ?? {}),
		// pi shows a provider's models only when it has a key; a local server ignores the placeholder.
		[p.name]: { baseUrl: p.baseUrl.trim(), api: "openai-completions", apiKey: (p.apiKey ?? "").trim() || "none", models: ids.map((id) => ({ id })) },
	};
	writeFileSafe(file, `${JSON.stringify(data, null, 2)}\n`, { private: true });
	return ids.map((id) => `${p.name}/${id}`);
}

/** The providers in <agentDir>/models.json that have at least one model. */
export function customProviders(agentDir: string): string[] {
	try {
		const data = JSON.parse(readFileSync(join(agentDir, "models.json"), "utf8"));
		return Object.entries((data?.providers ?? {}) as Record<string, { models?: unknown[] }>)
			.filter(([, v]) => Array.isArray(v?.models) && v.models.length > 0)
			.map(([k]) => k);
	} catch {
		return [];
	}
}
