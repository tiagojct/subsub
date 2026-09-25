import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createSubsub } from "../src/subsub.ts";

export default async function subsub(pi: ExtensionAPI): Promise<void> {
	await createSubsub(pi);
}
