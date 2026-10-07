/** Model providers that take an API key, and plain words for their common errors. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * `where`: where the provider processes the data, as a key into the web view's strings
 * (eu, us, cn, varies). Shown next to the key form, so the choice of provider is an informed one.
 */
export const KEY_PROVIDERS: Array<{ id: string; label: string; url: string; where: "eu" | "us" | "cn" | "varies" }> = [
	{ id: "opencode-go", label: "OpenCode Go", url: "https://opencode.ai/auth", where: "varies" },
	{ id: "openrouter", label: "OpenRouter", url: "https://openrouter.ai/keys", where: "varies" },
	{ id: "anthropic", label: "Anthropic", url: "https://console.anthropic.com/settings/keys", where: "us" },
	{ id: "openai", label: "OpenAI", url: "https://platform.openai.com/api-keys", where: "us" },
	{ id: "google", label: "Google Gemini", url: "https://aistudio.google.com/apikey", where: "us" },
	{ id: "mistral", label: "Mistral (EU)", url: "https://console.mistral.ai/api-keys", where: "eu" },
	{ id: "deepseek", label: "DeepSeek", url: "https://platform.deepseek.com/api_keys", where: "cn" },
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


export type Trouble = "quota" | "busy" | "blocked" | "key" | "region";

/** What a provider's error means for the user, or undefined when it is something else. */
export function providerTrouble(text: string | undefined): Trouble | undefined {
	if (!text) return undefined;
	if (/requires Global regions|not available in your region|region.{0,40}not (supported|allowed)/i.test(text)) return "region";
	if (/RESOURCE_EXHAUSTED|\b429\b|quota|rate.?limit|too many requests|usage limit/i.test(text)) return "quota";
	if (/\b(503|529)\b|UNAVAILABLE|high demand|overloaded/i.test(text)) return "busy";
	if (/RECITATION|SAFETY|PROHIBITED_CONTENT/.test(text)) return "blocked";
	if (/\b(401|403)\b|API key not valid|invalid api key|PERMISSION_DENIED|UNAUTHENTICATED/i.test(text)) return "key";
	return undefined;
}

/** The words for each kind in notices (the web view has its own, in web/i18n.js). */
export const TROUBLE_TEXT_PT: Record<Trouble, string> = {
	quota: "O fornecedor do modelo recusou o pedido: atingiu um limite da sua conta. Os níveis gratuitos limitam o texto enviado por minuto e os pedidos por dia. Espere um minuto e peça ao Sub-Sub para continuar; se voltar a acontecer, esgotou o limite diário (renova-se no dia seguinte). Ou use outro modelo (/model).",
	busy: "O fornecedor do modelo está sobrecarregado neste momento. Tente outra vez dentro de alguns minutos ou use outro modelo (/model).",
	blocked: "O fornecedor do modelo interrompeu a resposta (por exemplo, por repetir uma fonte palavra por palavra). Peça outra vez por outras palavras ou use outro modelo (/model).",
	key: "O fornecedor do modelo não aceitou a chave da API. Verifique-a ou introduza uma nova com /login.",
	region: "O fornecedor recusa este modelo com a definição de região da sua conta. No OpenCode, permita as regiões globais (Global) nas definições de privacidade do workspace, ou escolha um modelo que a sua região permita (/model).",
};
export const TROUBLE_TEXT: Record<Trouble, string> = {
	quota: "The model provider refused the request: a limit of your account was reached. Free tiers limit the text sent each minute and the requests each day. Wait a minute and ask Sub-Sub to continue; if it happens again, the daily limit is used up (it resets the next day). Or use another model (/model).",
	busy: "The model provider is busy at the moment. Try again in a few minutes, or use another model (/model).",
	blocked: "The model provider stopped the reply (for example, because it repeated a source word for word). Ask again in other words, or use another model (/model).",
	key: "The model provider did not accept the API key. Check it, or enter a new one with /login.",
	region: "The provider refuses this model with your account's region setting. In OpenCode, allow Global regions in the workspace's Privacy settings, or choose a model your region allows (/model).",
};

/**
 * Seconds to wait before a per-minute limit lets the request through again, or undefined when the
 * error is not a per-minute limit (a daily limit, a spent balance, anything else). pi does not
 * retry Google's per-minute 429, because its text mentions billing.
 */
export function perMinuteWait(text: string | undefined): number | undefined {
	if (!text || providerTrouble(text) !== "quota") return undefined;
	if (/PerDay|per day|daily/i.test(text)) return undefined;
	const delay = /retryDelay\\*"\s*:\s*\\*"(\d+(?:\.\d+)?)s/.exec(text);
	const seconds = delay?.[1] ?? /retry in (\d+(?:\.\d+)?)s/i.exec(text)?.[1];
	if (seconds) return Math.min(120, Math.ceil(Number(seconds)) + 2);
	return /PerMinute|per minute/i.test(text) ? 60 : undefined;
}
