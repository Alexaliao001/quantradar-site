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

  async function launchCheckout(plan, fallbackUrl) {
    if (!config.checkoutApiUrl) {
      window.location.href = fallbackUrl;
      return;
    }

    try {
      const response = await fetch(config.checkoutApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan })
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
