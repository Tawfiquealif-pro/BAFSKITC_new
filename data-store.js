"use strict";

(function initSiteDataStore() {
  const defaultSiteData = {
    siteText: {
      clubName: "BAF Shaheen College Kurmitola IT Club",
      established: "Est. 2016",
      heroTitle: "Welcome to BAF Shaheen College Kurmitola IT Club",
      heroSubtitle: "A student-driven club where curiosity, creativity, and technology come together through learning, sharing, and real community.",
      aboutHeading: "More Than a Club.<br /><span class=\"gradient-text\">A Learning Community.</span>",
      aboutTextOne: "BAF Shaheen College Kurmitola IT Club is a place for students who want to explore technology, develop practical skills, and grow through teamwork.",
      aboutTextTwo: "Since 2016, the club has created opportunities for workshops, talks, competitions, and collaboration that help members become confident and capable learners.",
      ctaTitle: "Join <span class=\"gradient-text\">BAF Shaheen College Kurmitola IT Club</span> Today",
      ctaText: "Applications are open. Be part of a community that learns, shares, and grows together.",
      footerSummary: "Building the next generation of tech leaders through learning, teamwork, and creativity."
    },
    contact: {
      email: "bafskitc@gmail.com",
      location: "BAF Shaheen College Kurmitola Campus",
      facebook: "https://www.facebook.com/bafskitc",
      instagram: "https://www.instagram.com/bafskitc_official/#"
    },
    panels: [],
    alumni: [],
    events: [],
    applicants: [],
    admins: []
  };

  let publicCache = null;
  let adminCache = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  const FETCH_TIMEOUT_MS = 10000; // 10 seconds
  const MAX_RETRIES = 2;

  async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    return response;
  }

  async function requestJson(url, options = {}, retries = MAX_RETRIES) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, {
          headers: { "Content-Type": "application/json", ...(options.headers || {}) },
          credentials: "same-origin",
          ...options
        });

        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (!response.ok) {
          const message = payload.error || `Request failed with status ${response.status}`;
          throw new Error(message);
        }

        return payload;
      } catch (error) {
        lastError = error;
        // Don't retry on abort/cancel or client errors
        if (attempt < retries && !error.message.includes("timed out") && !error.message.includes("Request failed with status 4")) {
          // Brief delay before retry
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        break;
      }
    }

    throw lastError;
  }

  async function getSiteData(force = false) {
    if (!force && publicCache) return clone(publicCache);
    try {
      const payload = await requestJson("/api/site-data");
      publicCache = { ...clone(defaultSiteData), ...payload };
      return clone(publicCache);
    } catch (error) {
      // Return cached data if available, otherwise default
      if (publicCache) return clone(publicCache);
      return clone(defaultSiteData);
    }
  }

  async function getAdminSiteData(force = false) {
    if (!force && adminCache) return clone(adminCache);
    try {
      const payload = await requestJson("/api/admin/site-data");
      adminCache = payload;
      publicCache = clone(payload);
      delete publicCache.admins;
      return clone(adminCache);
    } catch (error) {
      if (adminCache) return clone(adminCache);
      throw error;
    }
  }

  function getCsrfToken() {
    const match = document.cookie.match(/bafskitc_csrf=([^;]+)/);
    return match ? match[1] : "";
  }

  async function saveAdminSiteData(data) {
    await requestJson("/api/admin/site-data", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "X-CSRF-Token": getCsrfToken() }
    });
    adminCache = clone(data);
    publicCache = clone(data);
    delete publicCache.admins;
    return clone(adminCache);
  }

  async function submitApplication(applicant) {
    await requestJson("/api/applicants", {
      method: "POST",
      body: JSON.stringify(applicant)
    });
    publicCache = null;
    adminCache = null;
    return true;
  }

  async function loginAdmin(id, password) {
    const payload = await requestJson("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ id, password })
    });
    adminCache = null;
    return payload;
  }

  async function logoutAdmin() {
    try {
      await requestJson("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore logout errors
    }
    adminCache = null;
    return true;
  }

  async function checkAdminSession() {
    try {
      return await requestJson("/api/admin/session");
    } catch {
      return { authenticated: false };
    }
  }

  window.BAFSKITCStore = {
    defaultSiteData: clone(defaultSiteData),
    clone,
    getSiteData,
    getAdminSiteData,
    saveAdminSiteData,
    submitApplication,
    loginAdmin,
    logoutAdmin,
    checkAdminSession
  };
})();
