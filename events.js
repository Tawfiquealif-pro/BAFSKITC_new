"use strict";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getEventDateValue(event) {
  const monthMap = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
  };
  const year = Number.parseInt(event.year, 10) || new Date().getFullYear();
  const month = monthMap[String(event.dateMonth || "").slice(0, 3).toUpperCase()] ?? 0;
  const day = Number.parseInt(event.dateDay, 10) || 1;
  return new Date(year, month, day);
}

function sortEvents(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = [];
  const past = [];
  events.forEach((event) => {
    const date = getEventDateValue(event);
    if (date >= today) upcoming.push({ ...event, _date: date });
    else past.push({ ...event, _date: date });
  });
  upcoming.sort((a, b) => a._date - b._date);
  past.sort((a, b) => b._date - a._date);
  return [...upcoming, ...past].map(({ _date, ...event }) => event);
}

(async function renderEventsPage() {
  const store = window.BAFSKITCStore;
  const container = document.getElementById("allEventsList");
  const events = sortEvents((await store.getSiteData()).events);

  if (!events.length) {
    container.innerHTML = '<div class="event-empty">No events are available yet.</div>';
    return;
  }

  container.innerHTML = events.map((event) => `
    <article class="event-row">
      <div class="event-cover">
        ${event.image ? `<img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}" />` : '<div class="event-cover-fallback"><i class="fas fa-calendar-star"></i></div>'}
      </div>
      <div class="event-copy">
        <span class="event-tag">${escapeHtml(event.type)}</span>
        <h2>${escapeHtml(event.title)}</h2>
        <p>${escapeHtml(event.description)}</p>
        <div class="event-meta">
          <span><i class="fas fa-calendar"></i> ${escapeHtml(event.dateDay)} ${escapeHtml(event.dateMonth)} ${escapeHtml(event.year)}</span>
          <span><i class="fas fa-clock"></i> ${escapeHtml(event.time)}</span>
          <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.location)}</span>
        </div>
        <div class="event-actions">
          <a class="action-link primary" href="event-details.html?id=${encodeURIComponent(event.id)}">View Details</a>
          ${event.video ? `<a class="action-link" href="${escapeHtml(event.video)}" target="_blank" rel="noopener noreferrer">Watch Video</a>` : ""}
        </div>
      </div>
    </article>
  `).join("");
})();
