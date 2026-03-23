(function () {
  const defaults = {
    brandName: "QuantRadar",
    siteUrl: "https://www.quantradar.one",
    startFreeUrl: "./app.html",
    samplePageUrl: "./sample.html",
    sampleReportHtml: "./reports/sample-site-current/report.html",
    sampleReportPdf: "./reports/sample-site-current/report.pdf",
    proCheckoutUrl: "https://buy.stripe.com/aFa8wJ7w6fSAcpv6XXe7m00",
    portfolioCheckoutUrl: "https://buy.stripe.com/5kQ5kx8Aa5dWgFL4PPe7m01",
    checkoutApiUrl: "/api/checkout/session",
    checkoutSuccessUrl: "./checkout-success.html",
    checkoutCancelUrl: "./checkout-cancel.html",
    deskContactUrl: "mailto:fortuneinsight@outlook.com?subject=QuantRadar%20Desk%20Plan%20Inquiry",
    contactMailto: "mailto:fortuneinsight@outlook.com?subject=QuantRadar%20Launch%20Inquiry",
    xUrl: "https://www.quantradar.one",
    waitlistEndpoint: "/api/waitlist",
    waitlistMethod: "POST"
  };

  const config = Object.assign({}, defaults, window.SITE_CONFIG || {});

  document.querySelectorAll("[data-config-text]").forEach((node) => {
    const key = node.getAttribute("data-config-text");
    if (config[key]) {
      node.textContent = config[key];
    }
  });

  document.querySelectorAll("[data-link]").forEach((node) => {
    const key = node.getAttribute("data-link");
    if (config[key]) {
      node.setAttribute("href", config[key]);
    }
  });

  const surfaceModes = {
    premarket: {
      label: "Pre-Market Mode",
      title: "Open with the names that deserve your attention first.",
      summary:
        "Before the open, QuantRadar compresses your watchlist into a ranked agenda, so you do not spend the first hour rebuilding context.",
      focus: "Priority setups and opening game plan",
      change: "Gap risk, overnight context, and regime tone",
      ignore: "Long post-close reporting and low-priority names",
      state: "Priority Queue Live",
      actions: [
        "Rank the watchlist by urgency and structure.",
        "Separate breakouts from names that need more time.",
        "Map the first decision window before the open."
      ]
    },
    position: {
      label: "Position Defense Mode",
      title: "When you are in risk, the workspace should defend the position.",
      summary:
        "Once capital is deployed, the interface shifts toward active risk, trim zones, and exit enforcement instead of fresh idea hunting.",
      focus: "Support, trim, and break-even discipline",
      change: "PnL pressure, risk concentration, and vulnerable levels",
      ignore: "Wide watchlist exploration and low-priority scanning",
      state: "Risk Layer Active",
      actions: [
        "Show the positions that need a decision first.",
        "Map support, trim, and invalidation levels in one view.",
        "Keep exits visible before narrative bias takes over."
      ]
    },
    event: {
      label: "Event Shock Mode",
      title: "When volatility hits, switch the entire surface to exception handling.",
      summary:
        "Earnings, macro shocks, and abnormal moves deserve a different interface. The product should foreground fast context and suppress everything else.",
      focus: "Event-driven names and abnormal movement",
      change: "Volatility spike, catalyst context, and liquidity stress",
      ignore: "Routine reporting and slow-moving names",
      state: "Shock Response",
      actions: [
        "Pull the catalyst, price reaction, and risk map into one screen.",
        "Separate signal from noise while volatility is elevated.",
        "Keep the next action clear under pressure."
      ]
    },
    review: {
      label: "Post-Market Review",
      title: "After the close, the interface should turn into a review and learning layer.",
      summary:
        "The market is closed, so the product should stop acting like a live dashboard and become a review surface for attribution, journaling, and tomorrow's agenda.",
      focus: "Attribution, review, and next-session preparation",
      change: "Closed-market context and completed decisions",
      ignore: "Reactive intraday prompts and false urgency",
      state: "Review Queue Ready",
      actions: [
        "Summarize what changed in the portfolio today.",
        "Capture mistakes, strong decisions, and unresolved risk.",
        "Turn review into tomorrow's priority queue."
      ]
    }
  };

  const surfaceNodes = {
    label: document.getElementById("surface-mode-label"),
    title: document.getElementById("surface-title"),
    summary: document.getElementById("surface-summary"),
    focus: document.getElementById("surface-focus"),
    change: document.getElementById("surface-change"),
    ignore: document.getElementById("surface-ignore"),
    state: document.getElementById("surface-state-pill"),
    actions: document.getElementById("surface-actions")
  };

  function renderSurface(mode) {
    const payload = surfaceModes[mode];
    if (!payload || !surfaceNodes.label || !surfaceNodes.actions) {
      return;
    }
    surfaceNodes.label.textContent = payload.label;
    surfaceNodes.title.textContent = payload.title;
    surfaceNodes.summary.textContent = payload.summary;
    surfaceNodes.focus.textContent = payload.focus;
    surfaceNodes.change.textContent = payload.change;
    surfaceNodes.ignore.textContent = payload.ignore;
    surfaceNodes.state.textContent = payload.state;
    surfaceNodes.actions.innerHTML = payload.actions.map((item) => `<li>${item}</li>`).join("");
  }

  document.querySelectorAll("[data-mode]").forEach((node) => {
    node.addEventListener("click", () => {
      const mode = node.getAttribute("data-mode");
      if (!mode) {
        return;
      }
      document.querySelectorAll("[data-mode]").forEach((pill) => {
        pill.classList.toggle("is-active", pill === node);
      });
      renderSurface(mode);
    });
  });

  renderSurface("premarket");

  function getWorkspaceContext() {
    try {
      const payload = JSON.parse(localStorage.getItem("quantradar_workspace") || "null");
      if (!payload || !payload.id) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }

  async function launchCheckout(plan, fallbackUrl) {
    if (!config.checkoutApiUrl) {
      window.location.href = fallbackUrl;
      return;
    }

    try {
      const workspace = getWorkspaceContext();
      const response = await fetch(config.checkoutApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan,
          workspace_id: workspace && workspace.id ? workspace.id : null,
          email: workspace && workspace.email ? workspace.email : null
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.checkout_url) {
        throw new Error(payload.detail || "Checkout session failed");
      }
      window.location.href = payload.checkout_url;
    } catch (error) {
      window.location.href = fallbackUrl;
    }
  }

  document.querySelectorAll("[data-checkout-plan]").forEach((node) => {
    node.addEventListener("click", (event) => {
      const plan = node.getAttribute("data-checkout-plan");
      if (!plan) {
        return;
      }
      event.preventDefault();
      launchCheckout(plan, node.getAttribute("href") || config.proCheckoutUrl);
    });
  });

  const form = document.getElementById("waitlist-form");
  const note = document.getElementById("form-note");
  if (!form || !note) {
    return;
  }

  const openMailFallback = (payload) => {
    const base = config.contactMailto || "mailto:fortuneinsight@outlook.com?subject=QuantRadar%20Launch%20Inquiry";
    const parts = base.split("?");
    const mailto = parts[0];
    const params = new URLSearchParams(parts[1] || "");
    if (!params.get("subject")) {
      params.set("subject", "QuantRadar Launch Inquiry");
    }

    const lines = [
      "QuantRadar lead submission",
      "",
      `Name: ${payload.name || ""}`,
      `Email: ${payload.email || ""}`,
      `Use case: ${payload.use_case || ""}`,
      "",
      "Message:",
      payload.message || ""
    ];
    params.set("body", lines.join("\n"));
    window.location.href = `${mailto}?${params.toString()}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.submitted_at = new Date().toISOString();

    if (!config.waitlistEndpoint) {
      const key = "quantradar_waitlist_submissions";
      const current = JSON.parse(localStorage.getItem(key) || "[]");
      current.push(payload);
      localStorage.setItem(key, JSON.stringify(current));
      note.textContent = "Opening your email client with a prefilled lead note to fortuneinsight@outlook.com. A local backup is also stored in this browser.";
      note.classList.add("success");
      openMailFallback(payload);
      form.reset();
      return;
    }

    try {
      const response = await fetch(config.waitlistEndpoint, {
        method: config.waitlistMethod || "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      note.textContent = "Submission received. QuantRadar stored your lead and you can follow up from site_state/waitlist_submissions.jsonl.";
      note.classList.add("success");
      form.reset();
    } catch (error) {
      note.textContent = "The configured endpoint did not accept the submission. Falling back to your contact email instead.";
      note.classList.remove("success");
      openMailFallback(payload);
    }
  });
})();
