// Adds a Copy button to each command box (pre.cmd). Without JavaScript, the text can still be selected.
document.querySelectorAll("pre.cmd").forEach((pre) => {
	const button = document.createElement("button");
	button.type = "button";
	button.className = "copy";
	button.textContent = "Copy";
	button.addEventListener("click", async () => {
		try {
			await navigator.clipboard.writeText(pre.querySelector("code").innerText.trim());
			button.textContent = "Copied";
		} catch {
			button.textContent = "Select and copy";
		}
		setTimeout(() => (button.textContent = "Copy"), 1800);
	});
	pre.appendChild(button);
});
