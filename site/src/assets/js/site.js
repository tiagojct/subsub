// Sub-Sub website: theme switch, menu, install tabs, copy buttons, page contents.

(function () {
	"use strict";

	var root = document.documentElement;
	var pt = (root.lang || "").indexOf("pt") === 0;

	function currentTheme() {
		if (root.dataset.theme) return root.dataset.theme;
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}

	function ready() {
		// ---- theme: the button switches between light and dark and remembers the choice
		var themeBtn = document.getElementById("theme-toggle");
		if (themeBtn) {
			themeBtn.addEventListener("click", function () {
				var next = currentTheme() === "dark" ? "light" : "dark";
				root.dataset.theme = next;
				try {
					localStorage.setItem("subsub-site-theme", next);
				} catch (e) {}
			});
		}

		// ---- menu: on narrow screens the button shows and hides the page list
		var menuBtn = document.getElementById("menu-toggle");
		var nav = document.getElementById("site-nav");
		if (menuBtn && nav) {
			menuBtn.addEventListener("click", function () {
				var open = menuBtn.getAttribute("aria-expanded") !== "true";
				menuBtn.setAttribute("aria-expanded", String(open));
				document.body.classList.toggle("menu-open", open);
			});
			document.addEventListener("keydown", function (e) {
				if (e.key !== "Escape" || menuBtn.getAttribute("aria-expanded") !== "true") return;
				menuBtn.setAttribute("aria-expanded", "false");
				document.body.classList.remove("menu-open");
				menuBtn.focus();
			});
		}

		// ---- install tabs (arrow keys move between tabs)
		document.querySelectorAll("[data-tabs]").forEach(function (box) {
			var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
			function select(tab) {
				tabs.forEach(function (t) {
					var on = t === tab;
					t.setAttribute("aria-selected", String(on));
					t.tabIndex = on ? 0 : -1;
					document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
				});
			}
			// Start on the visitor's system: Windows gets the PowerShell command.
			var platform = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || "").toLowerCase();
			var win = tabs.filter(function (t) {
				return t.dataset.os === "windows";
			})[0];
			if (win && platform.indexOf("win") === 0) select(win);
			tabs.forEach(function (tab, i) {
				tab.addEventListener("click", function () {
					select(tab);
				});
				tab.addEventListener("keydown", function (e) {
					var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
					if (j === null) return;
					e.preventDefault();
					var next = tabs[(j + tabs.length) % tabs.length];
					select(next);
					next.focus();
				});
			});
		});

		// ---- copy buttons on commands
		document.querySelectorAll("pre.cmd").forEach(function (pre) {
			var btn = document.createElement("button");
			btn.type = "button";
			btn.className = "copy-btn";
			btn.textContent = pt ? "Copiar" : "Copy";
			btn.addEventListener("click", function () {
				var text = (pre.querySelector("code") || pre).textContent.trim();
				var done = function () {
					btn.textContent = pt ? "Copiado" : "Copied";
					btn.classList.add("copied");
					setTimeout(function () {
						btn.textContent = pt ? "Copiar" : "Copy";
						btn.classList.remove("copied");
					}, 1600);
				};
				if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
			});
			pre.appendChild(btn);
		});

		var prose = document.querySelector(".prose");
		if (!prose) return;

		// ---- a numbered list that starts after a command keeps counting
		prose.querySelectorAll("ol[start]").forEach(function (ol) {
			var start = parseInt(ol.getAttribute("start"), 10);
			if (start > 1) ol.style.counterReset = "li " + (start - 1);
		});

		// ---- tables scroll on narrow screens; the profile matrix gets centred marks
		prose.querySelectorAll("table").forEach(function (table) {
			if (!table.parentElement.classList.contains("table-wrap")) {
				var wrap = document.createElement("div");
				wrap.className = "table-scroll";
				table.parentNode.insertBefore(wrap, table);
				wrap.appendChild(table);
			}
			var cells = table.querySelectorAll("td:not(:first-child)");
			// A table of short marks (yes, sim, a number, a word or two) is a matrix with centred cells.
			var marks = Array.prototype.filter.call(cells, function (td) {
				return td.textContent.trim().length <= 14 && !td.querySelector("code, a");
			});
			if (cells.length > 8 && marks.length === cells.length) {
				table.classList.add("matrix");
				cells.forEach(function (td) {
					if (/^(yes|sim)$/.test(td.textContent.trim())) td.classList.add("yes");
				});
			}
		});

		// ---- "On this page", for pages with four sections or more
		var toc = document.getElementById("toc");
		var heads = prose.querySelectorAll("h2[id]");
		if (!toc || heads.length < 4) return;
		var list = toc.querySelector("ol");
		var links = [];
		heads.forEach(function (h) {
			var li = document.createElement("li");
			var a = document.createElement("a");
			a.href = "#" + h.id;
			a.textContent = h.textContent;
			li.appendChild(a);
			list.appendChild(li);
			links.push(a);
		});
		toc.hidden = false;
		if (!("IntersectionObserver" in window)) return;
		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return;
					links.forEach(function (a) {
						a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
					});
				});
			},
			{ rootMargin: "-15% 0px -70% 0px" },
		);
		heads.forEach(function (h) {
			observer.observe(h);
		});
	}

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
	else ready();
})();
