"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
let bcrypt = null;
try {
  bcrypt = require("bcryptjs");
} catch {
  bcrypt = null;
}

const HOST = process.env.DB_HOST || "127.0.0.1";
const PORT = Number(process.env.DB_PORT) || 3000;
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, "data", "database.json");
const sessions = new Map();

const DEFAULT_DATA = {
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
  admins: [
    { id: "bafskitc001", password: "010116" },
    { id: "bafskitc002", password: "290326" }
  ]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDatabase() {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function loadDatabase() {
  ensureDatabase();
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    return sanitizeDatabaseShape(parsed, DEFAULT_DATA);
  } catch {
    return clone(DEFAULT_DATA);
  }
}

function saveDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(sanitizeDatabaseShape(data, DEFAULT_DATA), null, 2));
}

function sanitizeText(value, maxLength = 4000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizeMember(item, prefix) {
  return {
    id: sanitizeText(item.id, 120) || `${prefix}-${Date.now()}`,
    name: sanitizeText(item.name, 200),
    position: sanitizeText(item.position, 200),
    fbLink: sanitizeText(item.fbLink, 500) || "#",
    image: sanitizeText(item.image, 2_000_000)
  };
}

function sanitizeEvent(item) {
  return {
    id: sanitizeText(item.id, 120) || `event-${Date.now()}`,
    dateDay: sanitizeText(item.dateDay, 20),
    dateMonth: sanitizeText(item.dateMonth, 20),
    year: sanitizeText(item.year, 10),
    type: sanitizeText(item.type, 100),
    title: sanitizeText(item.title, 200),
    description: sanitizeText(item.description, 1500),
    details: sanitizeText(item.details, 4000),
    time: sanitizeText(item.time, 120),
    location: sanitizeText(item.location, 200),
    image: sanitizeText(item.image, 2_000_000),
    video: sanitizeText(item.video, 1000),
    featured: Boolean(item.featured)
  };
}

function sanitizeApplicant(item) {
  return {
    id: sanitizeText(item.id, 120) || `applicant-${Date.now()}`,
    name: sanitizeText(item.name, 200),
    roll: sanitizeText(item.roll, 100),
    dateOfBirth: sanitizeText(item.dateOfBirth, 50),
    className: sanitizeText(item.className, 50),
    section: sanitizeText(item.section, 50),
    whatsapp: sanitizeText(item.whatsapp, 100),
    email: sanitizeText(item.email, 200),
    address: sanitizeText(item.address, 500),
    facebookLink: sanitizeText(item.facebookLink, 500),
    skills: sanitizeText(item.skills, 1000),
    message: sanitizeText(item.message, 2000),
    submittedAt: sanitizeText(item.submittedAt, 100) || new Date().toISOString()
  };
}

function sanitizeAdmin(item) {
  return {
    id: sanitizeText(item.id, 120),
    password: sanitizeText(item.password, 200),
    passwordHash: sanitizeText(item.passwordHash, 500)
  };
}

function sanitizeDatabaseShape(input, fallback) {
  const source = input && typeof input === "object" ? input : {};
  return {
    siteText: {
      clubName: sanitizeText(source.siteText?.clubName ?? fallback.siteText.clubName, 300),
      established: sanitizeText(source.siteText?.established ?? fallback.siteText.established, 100),
      heroTitle: sanitizeText(source.siteText?.heroTitle ?? fallback.siteText.heroTitle, 500),
      heroSubtitle: sanitizeText(source.siteText?.heroSubtitle ?? fallback.siteText.heroSubtitle, 1000),
      aboutHeading: sanitizeText(source.siteText?.aboutHeading ?? fallback.siteText.aboutHeading, 1000),
      aboutTextOne: sanitizeText(source.siteText?.aboutTextOne ?? fallback.siteText.aboutTextOne, 2000),
      aboutTextTwo: sanitizeText(source.siteText?.aboutTextTwo ?? fallback.siteText.aboutTextTwo, 2000),
      ctaTitle: sanitizeText(source.siteText?.ctaTitle ?? fallback.siteText.ctaTitle, 1000),
      ctaText: sanitizeText(source.siteText?.ctaText ?? fallback.siteText.ctaText, 2000),
      footerSummary: sanitizeText(source.siteText?.footerSummary ?? fallback.siteText.footerSummary, 2000)
    },
    contact: {
      email: sanitizeText(source.contact?.email ?? fallback.contact.email, 300),
      location: sanitizeText(source.contact?.location ?? fallback.contact.location, 300),
      facebook: sanitizeText(source.contact?.facebook ?? fallback.contact.facebook, 1000),
      instagram: sanitizeText(source.contact?.instagram ?? fallback.contact.instagram, 1000)
    },
    panels: Array.isArray(source.panels) ? source.panels.map((item) => sanitizeMember(item, "panel")) : clone(fallback.panels),
    alumni: Array.isArray(source.alumni) ? source.alumni.map((item) => sanitizeMember(item, "alumni")) : clone(fallback.alumni),
    events: Array.isArray(source.events) ? source.events.map(sanitizeEvent) : clone(fallback.events),
    applicants: Array.isArray(source.applicants) ? source.applicants.map(sanitizeApplicant) : clone(fallback.applicants),
    admins: Array.isArray(source.admins) && source.admins.length ? source.admins.map(sanitizeAdmin).filter((item) => item.id && (item.password || item.passwordHash)) : clone(fallback.admins)
  };
}

function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    ...headers
  });
  response.end(text);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 5 * 1024 * 1024) {
        reject(new Error("Request too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function getSession(request) {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies.bafskitc_session;
  return token ? sessions.get(token) || null : null;
}

function requireAdmin(request, response) {
  const session = getSession(request);
  if (!session) {
    sendJson(response, 401, { error: "Authentication required" });
    return null;
  }
  return session;
}

function publicData(data) {
  const copy = clone(data);
  delete copy.admins;
  return copy;
}

function verifyAdminPassword(admin, password) {
  const plain = typeof admin.password === "string" && admin.password === password;
  const hashed = Boolean(admin.passwordHash && bcrypt && bcrypt.compareSync(password, admin.passwordHash));
  return plain || hashed;
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/site-data") {
    sendJson(response, 200, publicData(loadDatabase()));
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/applicants") {
    const payload = await readBody(request);
    const data = loadDatabase();
    data.applicants.unshift(sanitizeApplicant(payload));
    saveDatabase(data);
    sendJson(response, 201, { ok: true });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/admin/login") {
    const payload = await readBody(request);
    const id = sanitizeText(payload.id, 120);
    const password = typeof payload.password === "string" ? payload.password : "";
    const data = loadDatabase();
    const admin = data.admins.find((item) => item.id === id);

    if (!admin || !verifyAdminPassword(admin, password)) {
      sendJson(response, 401, { error: "Invalid credentials" });
      return true;
    }

    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, { id: admin.id, createdAt: Date.now() });
    sendJson(response, 200, { ok: true, adminId: admin.id }, {
      "Set-Cookie": `bafskitc_session=${token}; HttpOnly; Path=/; SameSite=Lax`
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/admin/logout") {
    const cookies = parseCookies(request.headers.cookie);
    if (cookies.bafskitc_session) sessions.delete(cookies.bafskitc_session);
    sendJson(response, 200, { ok: true }, {
      "Set-Cookie": "bafskitc_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/session") {
    const session = getSession(request);
    if (!session) {
      sendJson(response, 200, { authenticated: false });
      return true;
    }
    sendJson(response, 200, { authenticated: true, adminId: session.id });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/site-data") {
    if (!requireAdmin(request, response)) return true;
    sendJson(response, 200, loadDatabase());
    return true;
  }

  if (request.method === "PUT" && url.pathname === "/api/admin/site-data") {
    if (!requireAdmin(request, response)) return true;
    const payload = await readBody(request);
    const fallback = loadDatabase();
    const nextData = sanitizeDatabaseShape(payload, fallback);
    saveDatabase(nextData);
    sendJson(response, 200, { ok: true });
    return true;
  }

  return false;
}

function safeFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const normalized = path.normalize(decoded).replace(/^([.][.][\\/])+/, "");
  const finalPath = path.join(ROOT, normalized);
  if (!finalPath.startsWith(ROOT)) return null;
  return finalPath;
}

function serveStatic(response, url) {
  const filePath = safeFilePath(url.pathname);
  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon"
    };

    response.writeHead(200, {
      "Content-Type": typeMap[ext] || "application/octet-stream"
    });

    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);

  try {
    if (await handleApi(request, response, url)) return;
    serveStatic(response, url);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`BAFSKITC restored server running at http://${HOST}:${PORT}`);
});
