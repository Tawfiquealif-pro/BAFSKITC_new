"use strict";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

(async function renderEventDetail() {
  const store = window.BAFSKITCStore;
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("id");
  const container = document.getElementById("eventDetail");
  const event = (await store.getSiteData()).events.find((item) => item.id === eventId);

  if (!event) {
    container.innerHTML = '<div class="detail-copy"><h1>Event Not Found</h1><p class="event-empty">The event you are looking for does not exist.</p></div>';
    return;
  }

  document.title = `${event.title} | BAFSKITC`;
  container.innerHTML = `
    <div class="detail-cover">
      ${event.image ? `<img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}" />` : '<div class="detail-cover-fallback"><i class="fas fa-calendar-star"></i></div>'}
    </div>
    <div class="detail-copy">
      <span class="event-tag">${escapeHtml(event.type)}</span>
      <h1>${escapeHtml(event.title)}</h1>
      <div class="detail-meta">
        <span><i class="fas fa-calendar"></i> ${escapeHtml(event.dateDay)} ${escapeHtml(event.dateMonth)} ${escapeHtml(event.year)}</span>
        <span><i class="fas fa-clock"></i> ${escapeHtml(event.time)}</span>
        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.location)}</span>
      </div>
      <div class="detail-block">
        <h3>Overview</h3>
        <p>${escapeHtml(event.description)}</p>
      </div>
      <div class="detail-block">
        <h3>Full Details</h3>
        <p>${escapeHtml(event.details || event.description)}</p>
      </div>
      <div class="detail-actions">
        <a class="action-link primary" href="events.html">Back to All Events</a>
        ${event.video ? `<a class="action-link" href="${escapeHtml(event.video)}" target="_blank" rel="noopener noreferrer">Watch Event Video</a>` : ""}
      </div>
    </div>
  `;
})();
