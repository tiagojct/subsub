/**
 * The cost limit of a session (`costLimit` in the settings, in US dollars). At 80% Sub-Sub says so once; from 100%
 * it asks before each new request. A running answer is never cut.
 */

export type CostLevel = "ok" | "near" | "over";

/** Where the session's cost is against the limit. An unknown cost (null) or no limit is "ok". */
export function costStatus(spent: number | null, limit: number | undefined): { level: CostLevel; spent: number; limit?: number } {
	if (spent === null || !limit || limit <= 0) return { level: "ok", spent: spent ?? 0, limit };
	return { level: spent >= limit ? "over" : spent >= 0.8 * limit ? "near" : "ok", spent, limit };
}

export const money = (n: number) => `$${n.toFixed(2)}`;

/** Commands that do not send anything to the model: no question for these. */
export const LOCAL_COMMANDS = new Set(["subsub", "researcher", "librarian", "history", "undo", "notes", "library", "actions", "feedback"]);

export function usesModel(text: string): boolean {
	const cmd = /^\/([\w-]+)(?:\s|$)/.exec(text.trim())?.[1];
	return !cmd || !(cmd.startsWith("subsub-") || LOCAL_COMMANDS.has(cmd));
}
