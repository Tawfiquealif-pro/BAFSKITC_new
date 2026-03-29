"use strict";

(async function initContactPage() {
  const store = window.BAFSKITCStore;
  const container = document.getElementById("contactLinksList");
  const data = await store.getSiteData();

  const links = [
    {
      title: "Facebook Page",
      description: "Follow updates, announcements, and club activities on Facebook.",
      href: data.contact.facebook,
      icon: "fab fa-facebook-f",
      label: "Open Facebook"
    },
    {
      title: "Instagram Page",
      description: "See highlights, visuals, and snapshots from club events and activities.",
      href: data.contact.instagram,
      icon: "fab fa-instagram",
      label: "Open Instagram"
    },
    {
      title: "Email",
      description: "Send us your questions, collaboration ideas, or official communication by email.",
      href: `mailto:${data.contact.email}`,
      icon: "fas fa-envelope",
      label: data.contact.email
    }
  ];

  container.innerHTML = links.map((item) => `
    <article class="event-row">
      <div class="event-cover">
        <div class="event-cover-fallback"><i class="${item.icon}"></i></div>
      </div>
      <div class="event-copy">
        <span class="event-tag">Contact</span>
        <h2>${item.title}</h2>
        <p>${item.description}</p>
        <div class="event-actions">
          <a class="action-link primary" href="${item.href}" ${item.href.startsWith("mailto:") ? "" : 'target="_blank" rel="noopener noreferrer"'}>${item.label}</a>
        </div>
      </div>
    </article>
  `).join("");
})();
