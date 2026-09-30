// Sub-Sub modern interactive scripts: theme toggle, installer tabs, terminal simulator, copy feedback

(function () {
  "use strict";

  // --- Theme Controller ---
  const THEME_KEY = "subsub-theme";

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-label", `Current theme: ${theme}. Click to switch.`);
      const iconLight = btn.querySelector(".theme-icon-light");
      const iconDark = btn.querySelector(".theme-icon-dark");
      if (iconLight && iconDark) {
        if (theme === "light") {
          iconLight.style.display = "none";
          iconDark.style.display = "block";
        } else {
          iconLight.style.display = "block";
          iconDark.style.display = "none";
        }
      }
    }
  }

  // Set initial theme immediately
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  window.addEventListener("DOMContentLoaded", () => {
    // Theme toggle button
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      applyTheme(getPreferredTheme());
      themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    }

    // --- Interactive Installer Tabs ---
    const installTabs = document.querySelectorAll(".install-tab");
    const installCode = document.getElementById("install-code");
    const installLabel = document.getElementById("install-requirements");

    const installCommands = {
      unix: {
        cmd: "curl -fsSL https://subsub.tiagojacinto.eu/install.sh | sh",
        prefix: "$ ",
        req: "Requires macOS or Linux. Installs uv and Node 22 automatically if missing.",
      },
      windows: {
        cmd: "powershell -ExecutionPolicy ByPass -c \"irm https://subsub.tiagojacinto.eu/install.ps1 | iex\"",
        prefix: "> ",
        req: "Requires Windows 10/11 with PowerShell. Sets up desktop and Start menu shortcuts.",
      },
      npm: {
        cmd: "npm install -g @tiagojct/subsub && subsub init",
        prefix: "$ ",
        req: "Requires Node.js 22.19+ and Zotero 10+ with local API enabled.",
      },
      pi: {
        cmd: "pi install npm:@tiagojct/subsub",
        prefix: "$ ",
        req: "Installs Sub-Sub as an extension into your existing pi assistant environment.",
      },
    };

    if (installTabs.length && installCode) {
      installTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const key = tab.dataset.os;
          const conf = installCommands[key];
          if (!conf) return;

          installTabs.forEach((t) => {
            t.classList.remove("active");
            t.setAttribute("aria-selected", "false");
          });
          tab.classList.add("active");
          tab.setAttribute("aria-selected", "true");

          installCode.innerHTML = `<span class="cmd-prefix">${conf.prefix}</span><span class="cmd-text">${conf.cmd}</span>`;
          if (installLabel && conf.req) {
            installLabel.textContent = conf.req;
          }
        });
      });
    }

    // --- Universal Copy Buttons ---
    const isPt = document.documentElement.lang && document.documentElement.lang.startsWith("pt");
    const copyText = isPt ? "Copiar" : "Copy";
    const copiedText = isPt ? "✓ Copiado" : "✓ Copied";

    document.querySelectorAll("pre.cmd, .code-snippet").forEach((pre) => {
      // Don't add duplicate buttons
      if (pre.querySelector(".copy-btn")) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.setAttribute("aria-label", "Copy command to clipboard");
      btn.innerHTML = `<span class="copy-label">${copyText}</span>`;

      btn.addEventListener("click", async () => {
        let textToCopy = "";
        const codeEl = pre.querySelector(".cmd-text") || pre.querySelector("code") || pre;
        textToCopy = codeEl.innerText.replace(/^\$\s+|^>\s+/, "").trim();

        try {
          await navigator.clipboard.writeText(textToCopy);
          btn.classList.add("copied");
          btn.innerHTML = `<span class="copy-label">${copiedText}</span>`;
          setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = `<span class="copy-label">${copyText}</span>`;
          }, 2000);
        } catch {
          // fallback
          const tempInput = document.createElement("textarea");
          tempInput.value = textToCopy;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand("copy");
          document.body.removeChild(tempInput);
          btn.classList.add("copied");
          btn.innerHTML = `<span class="copy-label">${copiedText}</span>`;
          setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = `<span class="copy-label">${copyText}</span>`;
          }, 2000);
        }
      });

      pre.appendChild(btn);
    });

    // --- Interactive Terminal Showcase (Librarian vs Researcher) ---
    const termLibrarianTab = document.getElementById("term-tab-librarian");
    const termResearcherTab = document.getElementById("term-tab-researcher");
    const termLibrarianView = document.getElementById("term-view-librarian");
    const termResearcherView = document.getElementById("term-view-researcher");

    if (termLibrarianTab && termResearcherTab && termLibrarianView && termResearcherView) {
      termLibrarianTab.addEventListener("click", () => {
        termLibrarianTab.classList.add("active");
        termResearcherTab.classList.remove("active");
        termLibrarianView.style.display = "block";
        termResearcherView.style.display = "none";
      });

      termResearcherTab.addEventListener("click", () => {
        termResearcherTab.classList.add("active");
        termLibrarianTab.classList.remove("active");
        termLibrarianView.style.display = "none";
        termResearcherView.style.display = "block";
      });

      // Interactive Approve Button in Terminal Simulation
      const approveBtn = document.getElementById("demo-approve-btn");
      const approveResult = document.getElementById("demo-approve-result");
      if (approveBtn && approveResult) {
        approveBtn.addEventListener("click", (e) => {
          e.preventDefault();
          approveBtn.style.display = "none";
          approveResult.style.display = "block";
        });
      }
    }
  });
})();
