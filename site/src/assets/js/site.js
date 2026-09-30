// Sub-Sub: Vintage & Minimal interactive behaviors (theme, installation tabs, desk preview, copy)

(function () {
  "use strict";

  // --- Theme Toggle ---
  const THEME_KEY = "subsub-theme";

  function getTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.textContent = theme === "dark" ? "Light theme" : "Dark theme";
    }
  }

  // Initial theme
  applyTheme(getTheme());

  window.addEventListener("DOMContentLoaded", () => {
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      applyTheme(getTheme());
      themeBtn.addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme") || "light";
        const next = cur === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    }

    // --- Installer Platform Switcher ---
    const installBtns = document.querySelectorAll(".install-os-btn");
    const cmdEl = document.getElementById("install-code-text");
    const noteEl = document.getElementById("install-note-text");

    const commands = {
      unix: {
        cmd: "curl -fsSL https://subsub.tiagojacinto.eu/install.sh | sh",
        prefix: "$ ",
        note: "Requires macOS or Linux. Installs uv and Node 22 automatically if missing.",
      },
      windows: {
        cmd: "powershell -ExecutionPolicy ByPass -c \"irm https://subsub.tiagojacinto.eu/install.ps1 | iex\"",
        prefix: "> ",
        note: "Requires Windows with PowerShell. Adds desktop and Start menu shortcuts.",
      },
      npm: {
        cmd: "npm install -g @tiagojct/subsub && subsub init",
        prefix: "$ ",
        note: "Requires Node.js 22.19+ and Zotero 10+ with local API communication enabled.",
      },
      pi: {
        cmd: "pi install npm:@tiagojct/subsub",
        prefix: "$ ",
        note: "Installs Sub-Sub as an extension into your existing pi assistant environment.",
      },
    };

    if (installBtns.length && cmdEl) {
      installBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const os = btn.dataset.os;
          const conf = commands[os];
          if (!conf) return;

          installBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          cmdEl.innerHTML = `<span class="cmd-prefix">${conf.prefix}</span>${conf.cmd}`;
          if (noteEl && conf.note) noteEl.textContent = conf.note;
        });
      });
    }

    // --- Desk Demonstration (Librarian vs Researcher) ---
    const toggleLibrarian = document.getElementById("desk-tab-librarian");
    const toggleResearcher = document.getElementById("desk-tab-researcher");
    const viewLibrarian = document.getElementById("desk-view-librarian");
    const viewResearcher = document.getElementById("desk-view-researcher");

    if (toggleLibrarian && toggleResearcher && viewLibrarian && viewResearcher) {
      toggleLibrarian.addEventListener("click", () => {
        toggleLibrarian.classList.add("active");
        toggleResearcher.classList.remove("active");
        viewLibrarian.style.display = "block";
        viewResearcher.style.display = "none";
      });

      toggleResearcher.addEventListener("click", () => {
        toggleResearcher.classList.add("active");
        toggleLibrarian.classList.remove("active");
        viewLibrarian.style.display = "none";
        viewResearcher.style.display = "block";
      });

      const approveBtn = document.getElementById("demo-approve-btn");
      const approveResult = document.getElementById("demo-approve-result");
      if (approveBtn && approveResult) {
        approveBtn.addEventListener("click", (e) => {
          e.preventDefault();
          approveBtn.style.display = "none";
          approveResult.style.display = "inline";
        });
      }
    }

    // --- Universal Copy Buttons ---
    const isPt = document.documentElement.lang && document.documentElement.lang.startsWith("pt");
    const copyLabel = isPt ? "Copiar" : "Copy";
    const copiedLabel = isPt ? "Copiado" : "Copied";

    document.querySelectorAll(".vintage-cmd-wrap, pre.cmd").forEach((wrap) => {
      if (wrap.querySelector(".copy-btn")) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = copyLabel;

      btn.addEventListener("click", async () => {
        const text = wrap.innerText.replace(/^\$\s+|^>\s+/, "").replace(/Copy$|Copied$/, "").trim();
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = copiedLabel;
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = copyLabel;
            btn.classList.remove("copied");
          }, 1800);
        } catch {
          // fallback
          const t = document.createElement("textarea");
          t.value = text;
          document.body.appendChild(t);
          t.select();
          document.execCommand("copy");
          document.body.removeChild(t);
          btn.textContent = copiedLabel;
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = copyLabel;
            btn.classList.remove("copied");
          }, 1800);
        }
      });

      wrap.appendChild(btn);
    });
  });
})();
