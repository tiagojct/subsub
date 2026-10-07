/** Model providers that take an API key, and plain words for their common errors. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const KEY_PROVIDERS: Array<{ id: string; label: string; url: string }> = [
	{ id: "opencode-go", label: "OpenCode Go", url: "https://opencode.ai/auth" },
	{ id: "openrouter", label: "OpenRouter", url: "https://openrouter.ai/keys" },
	{ id: "anthropic", label: "Anthropic", url: "https://console.anthropic.com/settings/keys" },
	{ id: "openai", label: "OpenAI", url: "https://platform.openai.com/api-keys" },
	{ id: "google", label: "Google Gemini", url: "https://aistudio.google.com/apikey" },
	{ id: "mistral", label: "Mistral", url: "https://console.mistral.ai/api-keys" },
	{ id: "deepseek", label: "DeepSeek", url: "https://platform.deepseek.com/api_keys" },
];

/** Save an API key the way pi's /login does: auth.json in the agent folder, readable only by the user. */
export function saveApiKey(agentDir: string, provider: string, key: string): void {
	if (!KEY_PROVIDERS.some((p) => p.id === provider)) throw new Error(`Unknown provider: ${provider}`);
	const clean = key.trim();
	if (!clean || /\s/.test(clean) || clean.length > 400) throw new Error("That does not look like an API key.");
	mkdirSync(agentDir, { recursive: true });
	const file = join(agentDir, "auth.json");
	let data: Record<string, unknown> = {};
	if (existsSync(file)) {
		try {
			data = JSON.parse(readFileSync(file, "utf8")) ?? {};
		} catch {
			throw new Error(`${file} is not valid JSON; fix it or type /login in the terminal.`);
		}
	}
	data[provider] = { type: "api_key", key: clean };
	// Write through a symlink (a shared pi auth.json) rather than replacing it.
	writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
}


export type Trouble = "quota" | "busy" | "blocked" | "key";

/** What a provider's error means for the user, or undefined when it is something else. */
export function providerTrouble(text: string | undefined): Trouble | undefined {
	if (!text) return undefined;
	if (/RESOURCE_EXHAUSTED|\b429\b|quota|rate.?limit|too many requests|usage limit/i.test(text)) return "quota";
	if (/\b(503|529)\b|UNAVAILABLE|high demand|overloaded/i.test(text)) return "busy";
	if (/RECITATION|SAFETY|PROHIBITED_CONTENT/.test(text)) return "blocked";
	if (/\b(401|403)\b|API key not valid|invalid api key|PERMISSION_DENIED|UNAUTHENTICATED/i.test(text)) return "key";
	return undefined;
}

/** The terminal's words for each kind (the web view has its own, in English and Portuguese). */
export const TROUBLE_TEXT: Record<Trouble, string> = {
	quota: "The model provider refused the request: a limit of your account was reached. Free tiers limit the text sent each minute and the requests each day. Wait a minute and ask Sub-Sub to continue; if it happens again, the daily limit is used up (it resets the next day). Or use another model (/model).",
	busy: "The model provider is busy at the moment. Try again in a few minutes, or use another model (/model).",
	blocked: "The model provider stopped the reply (for example, because it repeated a source word for word). Ask again in other words, or use another model (/model).",
	key: "The model provider did not accept the API key. Check it, or enter a new one with /login.",
};
