// Exercise timer: click the minutes on an exercise slide ("4 min") to count down; click again to reset.
(() => {
	const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
	document.addEventListener("click", (e) => {
		const el = e.target.closest(".ex .min");
		if (!el) return;
		el.dataset.label ??= el.textContent;
		if (el.dataset.timer) {
			clearInterval(Number(el.dataset.timer));
			delete el.dataset.timer;
			el.textContent = el.dataset.label;
			el.classList.remove("running", "over");
			return;
		}
		const end = Date.now() + parseInt(el.dataset.label, 10) * 60000;
		const tick = () => {
			const left = Math.max(0, Math.round((end - Date.now()) / 1000));
			el.textContent = fmt(left);
			if (left === 0) el.classList.replace("running", "over");
		};
		el.classList.add("running");
		tick();
		el.dataset.timer = String(setInterval(tick, 250));
	});
})();
