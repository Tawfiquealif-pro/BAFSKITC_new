"use strict";

const store = window.BAFSKITCStore;

const state = {
  data: null,
  saving: false
};

const ui = {
  loginScreen: document.getElementById("loginScreen"),
  dashboard: document.getElementById("dashboard"),
  loginForm: document.getElementById("loginForm"),
  loginStatus: document.getElementById("loginStatus"),
  siteTextForm: document.getElementById("siteTextForm"),
  panelForm: document.getElementById("panelForm"),
  alumniForm: document.getElementById("alumniForm"),
  eventForm: document.getElementById("eventForm"),
  adminCredentialForm: document.getElementById("adminCredentialForm"),
  panelList: document.getElementById("panelList"),
  alumniList: document.getElementById("alumniList"),
  eventsList: document.getElementById("eventsList"),
  applicantsList: document.getElementById("applicantsList"),
  adminsList: document.getElementById("adminsList"),
  databaseOutput: document.getElementById("databaseOutput"),
  refreshDatabaseView: document.getElementById("refreshDatabaseView"),
  syncPublicView: document.getElementById("syncPublicView"),
  logoutButton: document.getElementById("logoutButton"),
  panelReset: document.getElementById("panelReset"),
  alumniReset: document.getElementById("alumniReset"),
  eventReset: document.getElementById("eventReset")
};

const statusIds = [
  "loginStatus",
  "siteTextStatus",
  "panelStatus",
  "alumniStatus",
  "eventStatus",
  "adminsStatus"
];

const collectionConfig = {
  panel: {
    key: "panels",
    list: ui.panelList,
    form: ui.panelForm,
    statusId: "panelStatus",
    emptyTitle: "No panel members yet",
    emptyText: "Add the first panel member using the form on the right.",
    saveMessage: "Panel member saved.",
    deleteMessage: "Panel member removed."
  },
  alumni: {
    key: "alumni",
    list: ui.alumniList,
    form: ui.alumniForm,
    statusId: "alumniStatus",
    emptyTitle: "No alumni yet",
    emptyText: "Add the first alumni profile using the form on the right.",
    saveMessage: "Alumni member saved.",
    deleteMessage: "Alumni member removed."
  },
  event: {
    key: "events",
    list: ui.eventsList,
    form: ui.eventForm,
    statusId: "eventStatus",
    emptyTitle: "No events yet",
    emptyText: "Create the first event using the form on the right.",
    saveMessage: "Event saved.",
    deleteMessage: "Event removed."
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatus(id, message, isError = false) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message || "";
  element.style.color = isError ? "#ff8f8f" : "";
}

function clearStatuses() {
  statusIds.forEach((id) => setStatus(id, ""));
}

function toggleDashboard(isLoggedIn) {
  ui.loginScreen.classList.toggle("hidden", isLoggedIn);
  ui.dashboard.classList.toggle("hidden", !isLoggedIn);
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatMetaLine(item) {
  if (item.time && item.location) return `${item.time} | ${item.location}`;
  if (item.position) return item.position;
  if (item.type) return item.type;
  return "";
}

function renderItemCard(type, item) {
  const title = escapeHtml(item.name || item.title || item.id);
  const subtitle = escapeHtml(formatMetaLine(item));
  const linkLine = item.fbLink
    ? `<a href="${escapeHtml(item.fbLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.fbLink)}</a>`
    : "";

  return `
    <article class="item-card">
      <h4>${title}</h4>
      ${subtitle ? `<p>${subtitle}</p>` : ""}
      ${linkLine}
      <div class="item-actions">
        <button type="button" data-action="edit" data-type="${type}" data-id="${escapeHtml(item.id)}">Edit</button>
        <button type="button" class="danger" data-action="delete" data-type="${type}" data-id="${escapeHtml(item.id)}">Delete</button>
      </div>
    </article>
  `;
}

function renderCollection(type) {
  const config = collectionConfig[type];
  const items = state.data?.[config.key] || [];

  if (!items.length) {
    config.list.innerHTML = `
      <article class="item-card">
        <h4>${config.emptyTitle}</h4>
        <p>${config.emptyText}</p>
      </article>
    `;
    return;
  }

  config.list.innerHTML = items.map((item) => renderItemCard(type, item)).join("");
}

function renderApplicants() {
  const applicants = state.data?.applicants || [];

  if (!applicants.length) {
    ui.applicantsList.innerHTML = `
      <article class="applicant-card">
        <h4>No applications yet</h4>
        <p>New member applications will appear here after submission from the public site.</p>
      </article>
    `;
    return;
  }

  ui.applicantsList.innerHTML = applicants.map((applicant) => `
    <article class="applicant-card">
      <h4>${escapeHtml(applicant.name)}</h4>
      <p>Roll: ${escapeHtml(applicant.roll || "-")}</p>
      <p>Date of Birth: ${escapeHtml(applicant.dateOfBirth || "-")}</p>
      <p>Class: ${escapeHtml(applicant.className || "-")}</p>
      <p>Section: ${escapeHtml(applicant.section || "-")}</p>
      <p>WhatsApp: ${escapeHtml(applicant.whatsapp || "-")}</p>
      <p>Email: ${escapeHtml(applicant.email || "-")}</p>
      <p>Address: ${escapeHtml(applicant.address || "-")}</p>
      <p>Facebook: ${escapeHtml(applicant.facebookLink || "-")}</p>
      <p>Skills: ${escapeHtml(applicant.skills || "-")}</p>
      <p>Why join: ${escapeHtml(applicant.message || "-")}</p>
      <p class="meta-line">Submitted: ${escapeHtml(applicant.submittedAt ? new Date(applicant.submittedAt).toLocaleString() : "-")}</p>
    </article>
  `).join("");
}

function renderAdmins() {
  const admins = state.data?.admins || [];

  if (!admins.length) {
    ui.adminsList.innerHTML = `
      <article class="item-card">
        <h4>No admins found</h4>
        <p>Add a new admin account from the form on the right.</p>
      </article>
    `;
    return;
  }

  ui.adminsList.innerHTML = admins.map((admin) => `
    <article class="item-card">
      <h4>${escapeHtml(admin.id)}</h4>
      <p>Server-backed admin credential</p>
      <div class="item-actions">
        <button type="button" class="danger" data-action="delete-admin" data-id="${escapeHtml(admin.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

function renderDatabase() {
  ui.databaseOutput.value = state.data ? JSON.stringify(state.data, null, 2) : "";
}

function fillSiteTextForm() {
  const siteText = state.data.siteText;
  const contact = state.data.contact;

  ui.siteTextForm.elements.clubName.value = siteText.clubName || "";
  ui.siteTextForm.elements.established.value = siteText.established || "";
  ui.siteTextForm.elements.heroTitle.value = siteText.heroTitle || "";
  ui.siteTextForm.elements.heroSubtitle.value = siteText.heroSubtitle || "";
  ui.siteTextForm.elements.aboutHeading.value = siteText.aboutHeading || "";
  ui.siteTextForm.elements.aboutTextOne.value = siteText.aboutTextOne || "";
  ui.siteTextForm.elements.aboutTextTwo.value = siteText.aboutTextTwo || "";
  ui.siteTextForm.elements.ctaTitle.value = siteText.ctaTitle || "";
  ui.siteTextForm.elements.ctaText.value = siteText.ctaText || "";
  ui.siteTextForm.elements.footerSummary.value = siteText.footerSummary || "";
  ui.siteTextForm.elements.email.value = contact.email || "";
  ui.siteTextForm.elements.location.value = contact.location || "";
  ui.siteTextForm.elements.facebook.value = contact.facebook || "";
  ui.siteTextForm.elements.instagram.value = contact.instagram || "";
}

function fillMemberForm(form, item) {
  form.elements.id.value = item.id || "";
  form.elements.name.value = item.name || "";
  form.elements.position.value = item.position || "";
  form.elements.fbLink.value = item.fbLink && item.fbLink !== "#" ? item.fbLink : "";
  form.elements.image.value = item.image || "";
  form.elements.imageFile.value = "";
}

function fillEventForm(item) {
  ui.eventForm.elements.id.value = item.id || "";
  ui.eventForm.elements.dateDay.value = item.dateDay || "";
  ui.eventForm.elements.dateMonth.value = item.dateMonth || "";
  ui.eventForm.elements.year.value = item.year || "";
  ui.eventForm.elements.type.value = item.type || "";
  ui.eventForm.elements.featured.value = String(Boolean(item.featured));
  ui.eventForm.elements.title.value = item.title || "";
  ui.eventForm.elements.description.value = item.description || "";
  ui.eventForm.elements.details.value = item.details || "";
  ui.eventForm.elements.time.value = item.time || "";
  ui.eventForm.elements.location.value = item.location || "";
  ui.eventForm.elements.image.value = item.image || "";
  ui.eventForm.elements.video.value = item.video || "";
  ui.eventForm.elements.imageFile.value = "";
}

function resetManagedForm(form) {
  form.reset();
  if (form.elements.id) form.elements.id.value = "";
}

function renderAll() {
  if (!state.data) return;
  fillSiteTextForm();
  renderCollection("panel");
  renderCollection("alumni");
  renderCollection("event");
  renderApplicants();
  renderAdmins();
  renderDatabase();
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

async function getImageValue(form) {
  const fileInput = form.elements.imageFile;
  const file = fileInput?.files?.[0];
  if (!file) return (form.elements.image.value || "").trim();

  const maxFileSize = 500 * 1024;
  if (file.size > maxFileSize) {
    throw new Error("Image file must be smaller than 500KB.");
  }

  return readFileAsDataUrl(file);
}

function normalizeMemberEntry(form, prefix) {
  return {
    id: form.elements.id.value.trim() || createId(prefix),
    name: form.elements.name.value.trim(),
    position: form.elements.position.value.trim(),
    fbLink: form.elements.fbLink.value.trim() || "#"
  };
}

function normalizeEventEntry(form) {
  return {
    id: form.elements.id.value.trim() || createId("event"),
    dateDay: form.elements.dateDay.value.trim(),
    dateMonth: form.elements.dateMonth.value.trim(),
    year: form.elements.year.value.trim(),
    type: form.elements.type.value.trim(),
    title: form.elements.title.value.trim(),
    description: form.elements.description.value.trim(),
    details: form.elements.details.value.trim(),
    time: form.elements.time.value.trim(),
    location: form.elements.location.value.trim(),
    video: form.elements.video.value.trim(),
    featured: form.elements.featured.value === "true"
  };
}

function replaceById(items, entry) {
  const nextItems = items.slice();
  const index = nextItems.findIndex((item) => item.id === entry.id);
  if (index >= 0) nextItems[index] = entry;
  else nextItems.push(entry);
  return nextItems;
}

async function saveData(statusId, successMessage) {
  if (!state.data || state.saving) return;
  state.saving = true;
  try {
    const cleanData = clone(state.data);
    const saved = await store.saveAdminSiteData(cleanData);
    state.data = saved;
    renderAll();
    setStatus(statusId, successMessage);
  } catch (error) {
    setStatus(statusId, error.message || "Save failed.", true);
  } finally {
    state.saving = false;
  }
}

async function refreshData(statusId, successMessage) {
  try {
    state.data = await store.getAdminSiteData(true);
    renderAll();
    if (statusId && successMessage) setStatus(statusId, successMessage);
  } catch (error) {
    const message = error.message || "Unable to load admin data.";
    setStatus(statusId || "loginStatus", message, true);
  }
}

function updateSiteTextFromForm() {
  const values = formToObject(ui.siteTextForm);
  state.data.siteText = {
    clubName: values.clubName.trim(),
    established: values.established.trim(),
    heroTitle: values.heroTitle.trim(),
    heroSubtitle: values.heroSubtitle.trim(),
    aboutHeading: values.aboutHeading.trim(),
    aboutTextOne: values.aboutTextOne.trim(),
    aboutTextTwo: values.aboutTextTwo.trim(),
    ctaTitle: values.ctaTitle.trim(),
    ctaText: values.ctaText.trim(),
    footerSummary: values.footerSummary.trim()
  };
  state.data.contact = {
    email: values.email.trim(),
    location: values.location.trim(),
    facebook: values.facebook.trim(),
    instagram: values.instagram.trim()
  };
}

function handleEditAction(type, id) {
  if (!state.data) return;

  if (type === "panel") {
    const item = state.data.panels.find((panel) => panel.id === id);
    if (item) fillMemberForm(ui.panelForm, item);
    return;
  }

  if (type === "alumni") {
    const item = state.data.alumni.find((alumni) => alumni.id === id);
    if (item) fillMemberForm(ui.alumniForm, item);
    return;
  }

  if (type === "event") {
    const item = state.data.events.find((event) => event.id === id);
    if (item) fillEventForm(item);
  }
}

async function handleDeleteAction(type, id) {
  const config = collectionConfig[type];
  if (!config || !state.data) return;

  state.data[config.key] = state.data[config.key].filter((item) => item.id !== id);
  await saveData(config.statusId, config.deleteMessage);
}

async function handleDeleteAdmin(id) {
  if (!state.data) return;
  if (state.data.admins.length <= 1) {
    setStatus("adminsStatus", "At least one admin account must remain.", true);
    return;
  }

  state.data.admins = state.data.admins.filter((admin) => admin.id !== id);
  await saveData("adminsStatus", "Admin removed.");
}

async function submitLogin(event) {
  event.preventDefault();
  clearStatuses();

  if (window.location.protocol === "file:") {
    setStatus("loginStatus", "Run the site with node server.js and open http://127.0.0.1:3000/admin.html.", true);
    return;
  }

  const values = formToObject(ui.loginForm);

  try {
    await store.loginAdmin(values.adminId.trim(), values.password);
    toggleDashboard(true);
    await refreshData();
  } catch (error) {
    const message = error.message && error.message.includes("Failed to fetch")
      ? "Admin login could not reach the server. Start it with node server.js and use http://127.0.0.1:3000/admin.html."
      : (error.message || "Login failed.");
    setStatus("loginStatus", message, true);
  }
}

async function submitSiteText(event) {
  event.preventDefault();
  clearStatuses();
  updateSiteTextFromForm();
  await saveData("siteTextStatus", "Site text updated.");
}

async function submitPanel(event) {
  event.preventDefault();
  clearStatuses();

  try {
    const entry = normalizeMemberEntry(ui.panelForm, "panel");
    entry.image = await getImageValue(ui.panelForm);
    state.data.panels = replaceById(state.data.panels, entry);
    await saveData("panelStatus", "Panel member saved.");
    resetManagedForm(ui.panelForm);
  } catch (error) {
    setStatus("panelStatus", error.message || "Panel member could not be saved.", true);
  }
}

async function submitAlumni(event) {
  event.preventDefault();
  clearStatuses();

  try {
    const entry = normalizeMemberEntry(ui.alumniForm, "alumni");
    entry.image = await getImageValue(ui.alumniForm);
    state.data.alumni = replaceById(state.data.alumni, entry);
    await saveData("alumniStatus", "Alumni member saved.");
    resetManagedForm(ui.alumniForm);
  } catch (error) {
    setStatus("alumniStatus", error.message || "Alumni member could not be saved.", true);
  }
}

async function submitEvent(event) {
  event.preventDefault();
  clearStatuses();

  try {
    const entry = normalizeEventEntry(ui.eventForm);
    entry.image = await getImageValue(ui.eventForm);
    state.data.events = replaceById(state.data.events, entry);
    await saveData("eventStatus", "Event saved.");
    resetManagedForm(ui.eventForm);
  } catch (error) {
    setStatus("eventStatus", error.message || "Event could not be saved.", true);
  }
}

async function submitAdminCredential(event) {
  event.preventDefault();
  clearStatuses();

  const values = formToObject(ui.adminCredentialForm);
  const id = values.id.trim();
  const password = values.password.trim();

  if (!id || !password) {
    setStatus("adminsStatus", "Admin ID and password are required.", true);
    return;
  }

  if (state.data.admins.some((admin) => admin.id === id)) {
    setStatus("adminsStatus", "Admin ID already exists.", true);
    return;
  }

  try {
    const passwordHash = await window.bafskitc_bcrypt.hash(password, 10);
    state.data.admins = state.data.admins.concat({ id, passwordHash });
    await saveData("adminsStatus", "New admin added.");
    resetManagedForm(ui.adminCredentialForm);
  } catch (error) {
    setStatus("adminsStatus", error.message || "Could not create admin.", true);
  }
}

async function logout() {
  try {
    await store.logoutAdmin();
  } finally {
    state.data = null;
    toggleDashboard(false);
    clearStatuses();
    ui.loginForm.reset();
  }
}

function bindEvents() {
  ui.loginForm.addEventListener("submit", submitLogin);
  ui.siteTextForm.addEventListener("submit", submitSiteText);
  ui.panelForm.addEventListener("submit", submitPanel);
  ui.alumniForm.addEventListener("submit", submitAlumni);
  ui.eventForm.addEventListener("submit", submitEvent);
  ui.adminCredentialForm.addEventListener("submit", submitAdminCredential);

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const type = button.dataset.type;
    const id = button.dataset.id;

    if (action === "edit") {
      handleEditAction(type, id);
      return;
    }

    if (action === "delete") {
      await handleDeleteAction(type, id);
      return;
    }

    if (action === "delete-admin") {
      await handleDeleteAdmin(id);
    }
  });

  ui.panelReset.addEventListener("click", () => resetManagedForm(ui.panelForm));
  ui.alumniReset.addEventListener("click", () => resetManagedForm(ui.alumniForm));
  ui.eventReset.addEventListener("click", () => resetManagedForm(ui.eventForm));
  ui.refreshDatabaseView.addEventListener("click", renderDatabase);
  ui.syncPublicView.addEventListener("click", () => refreshData("siteTextStatus", "Public data refreshed."));
  ui.logoutButton.addEventListener("click", logout);
}

async function init() {
  bindEvents();

  if (window.location.protocol === "file:") {
    setStatus("loginStatus", "Run the site with node server.js and open http://127.0.0.1:3000/admin.html.", true);
    return;
  }

  const session = await store.checkAdminSession();
  if (!session.authenticated) {
    toggleDashboard(false);
    return;
  }

  toggleDashboard(true);
  await refreshData();
}

init();
