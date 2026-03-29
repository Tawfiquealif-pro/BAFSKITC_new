"use strict";

AOS.init({
  duration: 750,
  easing: "ease-out-cubic",
  once: true,
  offset: 70
});

const store = window.BAFSKITCStore;
const navbar = document.getElementById("navbar");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const cursorGlow = document.getElementById("cursorGlow");

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function maybeExternalLink(url) {
  return !url || url === "#" ? "#" : url;
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

function renderPanels(panels) {
  const panelGrid = document.getElementById("panelGrid");
  if (!panelGrid) return;

  panelGrid.innerHTML = panels.map((panel, index) => `
    <div class="team-card" data-aos="fade-up" data-aos-delay="${100 + (index * 50)}">
      <div class="team-avatar">
        <div class="avatar-placeholder">
          ${panel.image ? `<img src="${escapeHtml(panel.image)}" alt="${escapeHtml(panel.name)}" />` : `<i class="fas fa-user"></i>`}
        </div>
        <div class="team-overlay">
          <div class="team-social">
            <a href="${escapeHtml(maybeExternalLink(panel.fbLink))}" aria-label="Facebook" ${panel.fbLink && panel.fbLink !== "#" ? 'target="_blank" rel="noopener noreferrer"' : ""}>
              <i class="fab fa-facebook-f"></i>
            </a>
          </div>
        </div>
      </div>
      <div class="team-info">
        <h4>${escapeHtml(panel.name)}</h4>
        <span class="team-role">${escapeHtml(panel.position)}</span>
      </div>
    </div>
  `).join("");
}

function renderAlumni(alumni) {
  const alumniGrid = document.getElementById("alumniGrid");
  if (!alumniGrid) return;

  alumniGrid.innerHTML = alumni.map((item, index) => `
    <div class="alumni-card" data-aos="fade-up" data-aos-delay="${100 + (index * 80)}">
      <div class="alumni-icon">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />` : `<i class="fas fa-user-graduate"></i>`}
      </div>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.position)}</p>
      ${item.fbLink && item.fbLink !== "#" ? `<p><a class="event-video-link" href="${escapeHtml(item.fbLink)}" target="_blank" rel="noopener noreferrer">Facebook Profile</a></p>` : ""}
    </div>
  `).join("");
}

function renderEvents(events) {
  const eventsGrid = document.getElementById("eventsGrid");
  if (!eventsGrid) return;

  const sortedEvents = sortEvents(events).slice(0, 3);

  eventsGrid.innerHTML = sortedEvents.map((event, index) => `
    <div class="event-card ${event.featured ? "featured-event" : ""}" data-aos="fade-left" data-aos-delay="${100 + (index * 80)}">
      ${event.featured ? '<div class="featured-badge">Featured</div>' : ""}
      <div class="event-date">
        <span class="date-day">${escapeHtml(event.dateDay)}</span>
        <span class="date-month">${escapeHtml(event.dateMonth)}</span>
      </div>
      ${event.image ? `<div class="event-media"><img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}" /></div>` : '<div class="event-media"><div class="event-media-fallback"><i class="fas fa-calendar-star"></i></div></div>'}
      <div class="event-info">
        <span class="event-tag">${escapeHtml(event.type)}</span>
        <h3>${escapeHtml(event.title)}</h3>
        <p>${escapeHtml(event.description)}</p>
        <div class="event-meta">
          <span><i class="fas fa-clock"></i> ${escapeHtml(event.time)}</span>
          <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.location)}</span>
        </div>
        <div class="event-actions">
          <a href="event-details.html?id=${encodeURIComponent(event.id)}" class="event-register">Details <i class="fas fa-arrow-right"></i></a>
          ${event.video ? `<a class="event-video-link" href="${escapeHtml(event.video)}" target="_blank" rel="noopener noreferrer">Watch Video</a>` : ""}
        </div>
      </div>
    </div>
  `).join("");
}

async function renderSiteContent() {
  const data = await store.getSiteData();
  const textMap = {
    clubNameNav: data.siteText.clubName,
    clubNameFooter: data.siteText.clubName,
    heroEstablished: data.siteText.established,
    heroTitle: data.siteText.heroTitle,
    heroSubtitle: data.siteText.heroSubtitle,
    ctaText: data.siteText.ctaText,
    footerSummary: data.siteText.footerSummary,
    footerEmail: data.contact.email,
    footerLocation: data.contact.location
  };

  Object.entries(textMap).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  const ctaTitle = document.getElementById("ctaTitle");
  if (ctaTitle) ctaTitle.innerHTML = data.siteText.ctaTitle;

  const footerFacebook = document.getElementById("footerFacebook");
  if (footerFacebook) footerFacebook.href = data.contact.facebook;

  const footerInstagram = document.getElementById("footerInstagram");
  if (footerInstagram) footerInstagram.href = data.contact.instagram;

  renderPanels(data.panels);
  renderAlumni(data.alumni);
  renderEvents(data.events);

  if (window.AOS && typeof window.AOS.refreshHard === "function") {
    window.AOS.refreshHard();
  }
}

window.addEventListener("scroll", () => {
  if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 60);
});

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    hamburger.classList.toggle("active");

    const spans = hamburger.querySelectorAll("span");
    if (hamburger.classList.contains("active")) {
      spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
      spans[1].style.opacity = "0";
      spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
    } else {
      spans.forEach((span) => {
        span.style.transform = "";
        span.style.opacity = "";
      });
    }
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      hamburger.classList.remove("active");
      hamburger.querySelectorAll("span").forEach((span) => {
        span.style.transform = "";
        span.style.opacity = "";
      });
    });
  });
}

if (cursorGlow && window.matchMedia("(pointer:fine)").matches) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let glowX = mouseX;
  let glowY = mouseY;

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  function animateCursor() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    cursorGlow.style.left = `${glowX}px`;
    cursorGlow.style.top = `${glowY}px`;
    requestAnimationFrame(animateCursor);
  }

  animateCursor();
}

(function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  const particleCount = window.innerWidth < 768 ? 34 : 62;
  const colors = ["rgba(138,43,226,", "rgba(0,209,255,", "rgba(255,255,255,"];

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() {
      this.reset(true);
    }
    reset(initial) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.size = Math.random() * 1.6 + 0.4;
      this.speedX = (Math.random() - 0.5) * 0.32;
      this.speedY = -(Math.random() * 0.4 + 0.12);
      this.alpha = Math.random() * 0.4 + 0.08;
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
      this.phase = Math.random() * Math.PI * 2;
    }
    update() {
      this.phase += 0.012;
      this.x += this.speedX;
      this.y += this.speedY;
      this.alpha = 0.12 + Math.abs(Math.sin(this.phase)) * 0.28;
      if (this.y < -10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `${this.colorBase}${this.alpha})`;
      ctx.fill();
    }
  }

  function drawConnections() {
    const maxDistance = 105;
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(138,43,226,${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    drawConnections();
    particles.forEach((particle) => {
      particle.update();
      particle.draw();
    });
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  particles = Array.from({ length: particleCount }, () => new Particle());
  loop();
})();

function animateCounter(element, target, duration = 1800) {
  let start = 0;
  const step = target / (duration / 16);
  function update() {
    start += step;
    if (start >= target) {
      element.textContent = target;
      return;
    }
    element.textContent = Math.floor(start);
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const counterElements = document.querySelectorAll(".stat-num[data-target]");
const heroStats = document.querySelector(".hero-stats");
let countersStarted = false;
if (heroStats && counterElements.length) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        counterElements.forEach((element) => {
          animateCounter(element, Number.parseInt(element.dataset.target, 10));
        });
      }
    });
  }, { threshold: 0.45 });
  counterObserver.observe(heroStats);
}

const sections = document.querySelectorAll("section[id]");
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
function updateActiveNav() {
  let currentSection = "";
  sections.forEach((section) => {
    const top = section.offsetTop - 140;
    if (window.scrollY >= top) currentSection = section.id;
  });
  navAnchors.forEach((anchor) => {
    anchor.classList.toggle("active", anchor.getAttribute("href") === `#${currentSection}`);
  });
}
window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function addHoverTilt(selector, rotate = 4) {
  if (!window.matchMedia("(pointer:fine)").matches) return;
  document.querySelectorAll(selector).forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (event.clientX - centerX) / (rect.width / 2);
      const deltaY = (event.clientY - centerY) / (rect.height / 2);
      card.style.transform = `translateY(-6px) perspective(700px) rotateY(${deltaX * rotate}deg) rotateX(${-deltaY * rotate}deg)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function initApplyModal() {
  const modal = document.getElementById("applyModal");
  const openButton = document.getElementById("openApplyModal");
  const closeButton = document.getElementById("closeApplyModal");
  const backdrop = document.getElementById("applyModalBackdrop");
  const form = document.getElementById("applyForm");
  const status = document.getElementById("applyStatus");
  if (!modal || !openButton || !form) return;

  function openModal() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  openButton.addEventListener("click", openModal);
  if (closeButton) closeButton.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    try {
      await store.submitApplication({
        id: `applicant-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        name: formData.get("name"),
        roll: formData.get("roll"),
        dateOfBirth: formData.get("dateOfBirth"),
        className: formData.get("className"),
        section: formData.get("section"),
        whatsapp: formData.get("whatsapp"),
        email: formData.get("email"),
        address: formData.get("address"),
        facebookLink: formData.get("facebookLink"),
        skills: formData.get("skills"),
        message: formData.get("message")
      });
      form.reset();
      status.textContent = "Application submitted successfully.";
      setTimeout(() => {
        status.textContent = "";
        closeModal();
      }, 1800);
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

(async function initPage() {
  await renderSiteContent();
  addHoverTilt(".feature-card", 4);
  addHoverTilt(".glass-card", 3);
  addHoverTilt(".alumni-card", 3);
  initApplyModal();
  document.body.classList.add("page-ready");
})();
