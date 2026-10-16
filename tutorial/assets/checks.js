// The ticks are kept in this browser only (localStorage), keyed by the step's text,
// so that a new step in the page does not shift the ticks of the others.
(() => {
	const KEY = "subsub-tutorial";
	const boxes = [...document.querySelectorAll("ul.task-list input[type=checkbox]")];
	const keyOf = (b) => b.closest("li").textContent.replace(/\s+/g, " ").trim().slice(0, 120);
	let done = {};
	try {
		done = JSON.parse(localStorage.getItem(KEY) || "{}");
	} catch {
		done = {};
	}
	const save = () => {
		try {
			localStorage.setItem(KEY, JSON.stringify(done));
		} catch {
			/* private window: the ticks last until the page closes */
		}
	};
	const count = document.getElementById("progress-count");
	const show = () => {
		if (count) count.textContent = `${boxes.filter((b) => b.checked).length} of ${boxes.length} steps done`;
	};
	for (const b of boxes) {
		b.disabled = false;
		b.checked = Boolean(done[keyOf(b)]);
		b.addEventListener("change", () => {
			if (b.checked) done[keyOf(b)] = true;
			else delete done[keyOf(b)];
			save();
			show();
		});
	}
	document.getElementById("progress-reset")?.addEventListener("click", () => {
		if (!confirm("Clear all the ticks on this page?")) return;
		done = {};
		for (const b of boxes) b.checked = false;
		save();
		show();
	});
	show();

	// Reading mode: larger type and wider lines, remembered in this browser.
	const reading = document.getElementById("reading-mode");
	const setReading = (on) => {
		document.body.classList.toggle("reading", on);
		reading?.setAttribute("aria-pressed", String(on));
		try {
			localStorage.setItem(`${KEY}-reading`, String(on));
		} catch {
			/* private window */
		}
	};
	let on = false;
	try {
		on = localStorage.getItem(`${KEY}-reading`) === "true";
	} catch {
		on = false;
	}
	setReading(on);
	reading?.addEventListener("click", () => setReading(!document.body.classList.contains("reading")));
})();
