// Adds a Copy button to each command box (pre.cmd). Without JavaScript, the text can still be selected.
const pt = document.documentElement.lang.startsWith("pt");
const label = pt
	? { copy: "Copiar", copied: "Copiado", manual: "Selecione e copie" }
	: { copy: "Copy", copied: "Copied", manual: "Select and copy" };
document.querySelectorAll("pre.cmd").forEach((pre) => {
	const button = document.createElement("button");
	button.type = "button";
	button.className = "copy";
	button.textContent = label.copy;
	button.addEventListener("click", async () => {
		try {
			await navigator.clipboard.writeText(pre.querySelector("code").innerText.trim());
			button.textContent = label.copied;
		} catch {
			button.textContent = label.manual;
		}
		setTimeout(() => (button.textContent = label.copy), 1800);
	});
	pre.appendChild(button);
});
