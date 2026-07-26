import http from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { URL, pathToFileURL } from "node:url";
import {
  createReportInStore,
  deleteReportInStore,
  getReportsStoreExport,
  getReportsStoreMeta,
  getReportsStoreSnapshot,
  importReportsIntoStore,
  isReportsStorePersistenceAvailable,
  previewReportsImport,
  resetReportsStore,
  updateReportInStore,
} from "./reports-store.mjs";

const SERVER_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/, "$1"));
const PROJECT_ROOT_DIR = path.dirname(SERVER_DIR);

function parseEnvAssignment(rawLine) {
  const trimmedLine = rawLine.trim();
  if (!trimmedLine || trimmedLine.startsWith("#")) {
    return null;
  }

  const exportPrefix = trimmedLine.startsWith("export ") ? 7 : 0;
  const assignment = trimmedLine.slice(exportPrefix);
  const separatorIndex = assignment.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const key = assignment.slice(0, separatorIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return null;
  }

  let value = assignment.slice(separatorIndex + 1).trim();
  if (!value) {
    return { key, value: "" };
  }

  if (
    (value.startsWith("\"") && value.endsWith("\""))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  } else {
    const inlineCommentIndex = value.indexOf(" #");
    if (inlineCommentIndex >= 0) {
      value = value.slice(0, inlineCommentIndex).trimEnd();
    }
  }

  value = value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");

  return { key, value };
}

function loadLocalEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  try {
    const content = readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const assignment = parseEnvAssignment(line);
      if (!assignment) continue;
      if (typeof process.env[assignment.key] === "undefined") {
        process.env[assignment.key] = assignment.value;
      }
    }
  } catch {
    // Best effort only. Server-side environment injection still has priority.
  }
}

function loadLocalEnv() {
  loadLocalEnvFile(path.join(PROJECT_ROOT_DIR, ".env"));
  loadLocalEnvFile(path.join(PROJECT_ROOT_DIR, ".env.local"));
}

loadLocalEnv();

const PORT = Number(process.env.OPP_API_PORT ?? 8787);
const SERVER_DATA_DIR = path.join(SERVER_DIR, "data");
const LOCAL_PROFILE_FILE = path.join(SERVER_DATA_DIR, "local-profile.json");
const LOCAL_DIGEST_FILE = path.join(SERVER_DATA_DIR, "local-digest.json");
const LOCAL_ANALYTICS_FILE = path.join(SERVER_DATA_DIR, "analytics-events.json");
const LOCAL_DEBUG_EVENTS_FILE = path.join(SERVER_DATA_DIR, "trae-debug-log-frontend-stack-overflow.ndjson");

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const rateBuckets = new Map();
const responseCache = new Map();

const CACHE_TTLS_MS = {
  reports: 1000 * 60 * 5,
  placesTextSearch: 1000 * 60 * 30,
  placeDetails: 1000 * 60 * 60 * 6,
  reviewIntelligence: 1000 * 60 * 60 * 12,
};

const CACHE_MAX_ENTRIES = 250;

const DEFAULT_PROFILE = {
  name: "",
  email: "",
  phone: "",
  city: "",
  judet: "",
  industry: "",
  role: "",
  counties: [],
  setup: false,
  avatarUrl: "",
};

const DEFAULT_PROFILE_META = {
  roleLocked: false,
  advisor: {
    unlocked: false,
    label: "Membru în creștere",
    reputationScore: 0,
    interactions: 0,
    voteSignals: 0,
    commentSignals: 0,
    articleSignals: 0,
    unlockThreshold: {
      reputationScore: 120,
      interactions: 18,
      voteSignals: 8,
      commentSignals: 4,
    },
    progressPct: 0,
  },
};

function ensureServerDataDir() {
  if (!existsSync(SERVER_DATA_DIR)) {
    mkdirSync(SERVER_DATA_DIR, { recursive: true });
  }
}

function readJsonFile(filePath, fallback) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  try {
    ensureServerDataDir();
    writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

function normalizeProfileInput(input) {
  const counties = Array.isArray(input?.counties)
    ? input.counties.map((entry) => sanitizeText(entry, 120)).filter(Boolean).slice(0, 50)
    : [];

  return {
    ...DEFAULT_PROFILE,
    name: sanitizeText(input?.name, 120),
    email: sanitizeText(input?.email, 160),
    phone: sanitizeText(input?.phone, 40),
    city: sanitizeText(input?.city, 120),
    judet: sanitizeText(input?.judet, 120),
    industry: sanitizeText(input?.industry, 120),
    role: sanitizeText(input?.role, 40),
    counties,
    setup: Boolean(input?.setup),
    avatarUrl: sanitizeText(input?.avatarUrl, 300),
  };
}

function readStoredProfile() {
  const stored = readJsonFile(LOCAL_PROFILE_FILE, null);
  const profile = stored?.profile ? normalizeProfileInput(stored.profile) : DEFAULT_PROFILE;
  return {
    profile,
    meta: {
      ...DEFAULT_PROFILE_META,
      ...(stored?.meta && typeof stored.meta === "object" ? stored.meta : {}),
    },
  };
}

function writeStoredProfile(profile, meta = DEFAULT_PROFILE_META) {
  return writeJsonFile(LOCAL_PROFILE_FILE, {
    profile: normalizeProfileInput(profile),
    meta: {
      ...DEFAULT_PROFILE_META,
      ...(meta && typeof meta === "object" ? meta : {}),
    },
    updatedAt: new Date().toISOString(),
  });
}

function readStoredDigest() {
  return readJsonFile(LOCAL_DIGEST_FILE, {
    counties: "",
    industries: "",
    updatedAt: null,
  });
}

function writeStoredDigest(input) {
  return writeJsonFile(LOCAL_DIGEST_FILE, {
    counties: sanitizeText(input?.counties, 300),
    industries: sanitizeText(input?.industries, 300),
    updatedAt: new Date().toISOString(),
  });
}

function appendAnalyticsEvent(event) {
  const current = readJsonFile(LOCAL_ANALYTICS_FILE, []);
  const next = Array.isArray(current) ? current.slice(-199) : [];
  next.push({
    receivedAt: new Date().toISOString(),
    event,
  });
  return writeJsonFile(LOCAL_ANALYTICS_FILE, next);
}

function appendDebugEvent(event) {
  try {
    ensureServerDataDir();
    const serialized = JSON.stringify({
      receivedAt: new Date().toISOString(),
      event,
    });
    writeFileSync(
      LOCAL_DEBUG_EVENTS_FILE,
      `${serialized}\n`,
      { encoding: "utf8", flag: "a" },
    );
    return true;
  } catch {
    return false;
  }
}

function readDebugEvents(limit = 200) {
  try {
    if (!existsSync(LOCAL_DEBUG_EVENTS_FILE)) return [];
    const content = readFileSync(LOCAL_DEBUG_EVENTS_FILE, "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function clearDebugEvents() {
  try {
    ensureServerDataDir();
    writeFileSync(LOCAL_DEBUG_EVENTS_FILE, "", "utf8");
    return true;
  } catch {
    return false;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function send(res, statusCode, payload, headers = {}) {
  const body = payload == null ? "" : JSON.stringify(payload);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  res.end(body);
}

function buildCacheKey(parts) {
  return parts
    .map((part) => {
      if (part == null) return "";
      if (typeof part === "string") return part;
      return JSON.stringify(part);
    })
    .join("::");
}

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (entry.expiresAt <= now) {
      responseCache.delete(key);
    }
  }

  while (responseCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (!oldestKey) break;
    responseCache.delete(oldestKey);
  }
}

function getCachedPayload(cacheKey) {
  const entry = responseCache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }

  entry.lastAccessedAt = Date.now();
  return entry.payload;
}

function setCachedPayload(cacheKey, payload, ttlMs) {
  pruneCache();
  responseCache.set(cacheKey, {
    payload,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
}

async function resolveCachedPayload({
  cacheKey,
  ttlMs,
  producer,
}) {
  const cached = getCachedPayload(cacheKey);
  if (cached) {
    return {
      payload: cached,
      cacheState: "hit",
    };
  }

  const payload = await producer();
  setCachedPayload(cacheKey, payload, ttlMs);
  return {
    payload,
    cacheState: "miss",
  };
}

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(ip ?? req.socket.remoteAddress ?? "unknown").split(",")[0].trim();
}

function isRateLimited(req) {
  const key = getClientKey(req);
  const now = Date.now();
  const bucket = rateBuckets.get(key) ?? { count: 0, ts: now };
  const age = now - bucket.ts;
  if (age > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { count: 1, ts: now });
    return false;
  }
  const nextCount = bucket.count + 1;
  rateBuckets.set(key, { count: nextCount, ts: bucket.ts });
  return nextCount > RATE_LIMIT_MAX;
}

function validateQueryString(value, label) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { ok: false, error: `${label} lipseste.` };
  if (trimmed.length > 120) return { ok: false, error: `${label} este prea lung.` };
  return { ok: true, value: trimmed };
}

function validatePlaceId(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { ok: false, error: "placeId lipseste." };
  if (trimmed.length > 200) return { ok: false, error: "placeId este prea lung." };
  return { ok: true, value: trimmed };
}

function validateLimit(value, fallback = 20, max = 50) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(1, Math.round(numeric)));
}

function validateReportId(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return { ok: false, error: "reportId invalid." };
  const reportId = Math.round(numeric);
  if (reportId <= 0) return { ok: false, error: "reportId invalid." };
  return { ok: true, value: reportId };
}

function isLocalDevelopmentMutationAllowed(req) {
  if (process.env.NODE_ENV === "production") return false;
  const clientKey = getClientKey(req);
  return (
    clientKey === "127.0.0.1"
    || clientKey === "::1"
    || clientKey === "::ffff:127.0.0.1"
    || clientKey === "localhost"
  );
}

function normalizeOptionalStringField(value, maxLength) {
  if (value == null) return undefined;
  if (typeof value !== "string") return { error: "invalid_string_field" };
  const trimmed = sanitizeText(value, maxLength);
  if (!trimmed) return { error: "empty_string_field" };
  return trimmed;
}

function normalizeRequiredStringField(value, maxLength) {
  if (typeof value !== "string") return { error: "invalid_string_field" };
  const trimmed = sanitizeText(value, maxLength);
  if (!trimmed) return { error: "empty_string_field" };
  return trimmed;
}

function normalizeOptionalNumberField(value, min, max) {
  if (value == null) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return { error: "invalid_number_field" };
  return clamp(Math.round(numeric), min, max);
}

function normalizeOptionalBooleanField(value) {
  if (value == null) return undefined;
  if (typeof value !== "boolean") return { error: "invalid_boolean_field" };
  return value;
}

function normalizeOptionalOpportunityStage(value) {
  if (value == null) return undefined;
  const normalized = sanitizeText(value, 20).toLowerCase();
  if (normalized === "idea" || normalized === "validation" || normalized === "plan" || normalized === "pitch") {
    return normalized;
  }
  return { error: "invalid_opportunity_stage" };
}

function sanitizeText(value, maxLength = 240) {
  const trimmed = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return trimmed.slice(0, maxLength);
}

async function handleLocalProfile(req, res) {
  const authHeader = String(req.headers.authorization ?? "");
  if (!authHeader.startsWith("Bearer ")) {
    send(res, 401, { error: "unauthorized" });
    return;
  }

  if (req.method === "GET") {
    send(res, 200, readStoredProfile());
    return;
  }

  if (req.method === "PUT") {
    const payload = await readJson(req).catch(() => null);
    if (!payload || typeof payload !== "object") {
      send(res, 400, { error: "invalid_profile_payload" });
      return;
    }
    const current = readStoredProfile();
    const nextProfile = normalizeProfileInput(payload);
    writeStoredProfile(nextProfile, current.meta);
    send(res, 200, {
      profile: nextProfile,
      meta: current.meta,
    });
    return;
  }

  send(res, 405, { error: "method_not_allowed" });
}

async function handleLocalDigest(req, res) {
  const authHeader = String(req.headers.authorization ?? "");
  if (!authHeader.startsWith("Bearer ")) {
    send(res, 401, { error: "unauthorized" });
    return;
  }

  if (req.method !== "PUT") {
    send(res, 405, { error: "method_not_allowed" });
    return;
  }

  const payload = await readJson(req).catch(() => null);
  writeStoredDigest(payload && typeof payload === "object" ? payload : {});
  send(res, 200, {
    ok: true,
    digest: readStoredDigest(),
  });
}

async function handleAnalyticsTrack(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { error: "method_not_allowed" });
    return;
  }

  const payload = await readJson(req).catch(() => null);
  appendAnalyticsEvent(payload ?? {});
  send(res, 204, null);
}

async function handleDebugEvents(req, res, requestUrl) {
  if (req.method === "GET") {
    const limit = Math.max(1, Math.min(500, Math.round(Number(requestUrl.searchParams.get("limit") ?? 200))));
    send(res, 200, { events: readDebugEvents(limit) });
    return;
  }

  if (req.method === "DELETE") {
    clearDebugEvents();
    send(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST") {
    const payload = await readJson(req).catch(() => null);
    appendDebugEvent(payload ?? {});
    send(res, 204, null);
    return;
  }

  send(res, 405, { error: "method_not_allowed" });
}

function toFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizePlacesResponse(rawPayload, meta) {
  const places = Array.isArray(rawPayload?.places) ? rawPayload.places : [];
  return {
    provider: "google_places",
    fetchedAt: new Date().toISOString(),
    query: meta.query,
    region: meta.region,
    language: meta.language,
    maxResults: meta.maxResults,
    places: places.map((place) => ({
      id: sanitizeText(place?.id, 120),
      name: sanitizeText(place?.displayName?.text ?? place?.name, 160),
      formattedAddress: sanitizeText(place?.formattedAddress, 220) || null,
      lat: toFiniteNumber(place?.location?.latitude),
      lng: toFiniteNumber(place?.location?.longitude),
      rating: toFiniteNumber(place?.rating),
      userRatingCount: Math.max(0, Math.round(toFiniteNumber(place?.userRatingCount) ?? 0)),
      primaryType: sanitizeText(place?.primaryType, 80) || null,
      types: Array.isArray(place?.types)
        ? place.types
            .map((entry) => sanitizeText(entry, 80))
            .filter(Boolean)
        : [],
    })),
  };
}

function normalizePlaceDetailsResponse(rawPayload, meta) {
  const reviews = Array.isArray(rawPayload?.reviews) ? rawPayload.reviews : [];
  return {
    provider: "google_places",
    fetchedAt: new Date().toISOString(),
    place: {
      id: sanitizeText(rawPayload?.id ?? meta.placeId, 160),
      name: sanitizeText(rawPayload?.displayName?.text ?? rawPayload?.name, 160),
      formattedAddress: sanitizeText(rawPayload?.formattedAddress, 220) || null,
      rating: toFiniteNumber(rawPayload?.rating),
      userRatingCount: Math.max(0, Math.round(toFiniteNumber(rawPayload?.userRatingCount) ?? 0)),
      primaryType: sanitizeText(rawPayload?.primaryType, 80) || null,
      nationalPhoneNumber: sanitizeText(rawPayload?.nationalPhoneNumber, 60) || null,
      websiteUri: sanitizeText(rawPayload?.websiteUri, 240) || null,
      reviews: reviews
        .map((review, index) => {
          const text = sanitizeText(review?.text?.text, 800);
          const originalText = sanitizeText(review?.originalText?.text, 800) || null;
          if (!text && !originalText) return null;
          return {
            reviewId: sanitizeText(review?.name, 160) || `${meta.placeId}:review:${index + 1}`,
            authorLabel: sanitizeText(review?.authorAttribution?.displayName, 80) || null,
            rating: toFiniteNumber(review?.rating),
            publishTime: sanitizeText(review?.publishTime, 60) || null,
            relativePublishTime: sanitizeText(review?.relativePublishTimeDescription, 60) || null,
            text: text || originalText || "",
            originalText,
          };
        })
        .filter(Boolean),
    },
  };
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload?.output)) return "";

  const fragments = [];
  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) continue;
    for (const content of item.content) {
      if (typeof content?.text === "string" && content.text.trim()) {
        fragments.push(content.text.trim());
      }
    }
  }

  return fragments.join("\n").trim();
}

function tryParseLooseJson(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {}

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {}
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }

  return null;
}

function normalizeTopicFrequency(value) {
  const normalized = sanitizeText(value, 32).toLowerCase();
  if (normalized === "dominant") return "dominant";
  if (normalized === "recurring") return "recurring";
  return "isolated";
}

function normalizeTopicSeverity(value) {
  const normalized = sanitizeText(value, 32).toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function normalizeSentiment(value) {
  const normalized = sanitizeText(value, 40).toLowerCase();
  if (normalized === "negative") return "negative";
  if (normalized === "mixed_negative") return "mixed_negative";
  if (normalized === "mixed_positive") return "mixed_positive";
  if (normalized === "positive") return "positive";
  return "mixed";
}

function normalizeReviewIntelligencePayload(providerPayload) {
  const rawText = extractResponseText(providerPayload);
  const parsed = tryParseLooseJson(rawText);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("openai_invalid_json");
  }

  const topics = Array.isArray(parsed.topics)
    ? parsed.topics
        .map((topic) => {
          const label = sanitizeText(topic?.label ?? topic?.topic, 90);
          if (!label) return null;
          return {
            label,
            frequency: normalizeTopicFrequency(topic?.frequency),
            severity: normalizeTopicSeverity(topic?.severity),
            evidenceQuote: sanitizeText(topic?.evidenceQuote ?? topic?.evidence_quote, 180) || null,
          };
        })
        .filter(Boolean)
    : [];

  return {
    provider: "openai",
    fetchedAt: new Date().toISOString(),
    model: sanitizeText(providerPayload?.model, 80) || sanitizeText(process.env.OPENAI_MODEL, 80) || "unknown",
    sentiment: normalizeSentiment(parsed.sentiment),
    issueFrequencyScore: clamp(Math.round(toFiniteNumber(parsed.issue_frequency_score ?? parsed.issueFrequencyScore) ?? 0), 0, 100),
    issueSeverityScore: clamp(Math.round(toFiniteNumber(parsed.issue_severity_score ?? parsed.issueSeverityScore) ?? 0), 0, 100),
    recencyScore: clamp(Math.round(toFiniteNumber(parsed.recency_score ?? parsed.recencyScore) ?? 0), 0, 100),
    manipulationRiskScore: clamp(
      Math.round(toFiniteNumber(parsed.manipulation_risk_score ?? parsed.manipulationRiskScore) ?? 0),
      0,
      100,
    ),
    summary: sanitizeText(parsed.summary, 420),
    topics,
  };
}

async function handleReportsList(req, res, requestUrl) {
  void req;
  const limit = validateLimit(requestUrl.searchParams.get("limit"), 20, 50);
  const reportsStoreMeta = getReportsStoreMeta();
  const cacheKey = buildCacheKey(["reports_list", limit, reportsStoreMeta.version]);
  const { payload, cacheState } = await resolveCachedPayload({
    cacheKey,
    ttlMs: CACHE_TTLS_MS.reports,
    producer: async () => getReportsStoreSnapshot(limit),
  });

  send(res, 200, payload, {
    "x-opportuniq-cache": cacheState,
  });
}

async function handleDevReportsReset(req, res) {
  if (!isLocalDevelopmentMutationAllowed(req)) {
    send(res, 403, { error: "forbidden_dev_mutation" });
    return;
  }

  const meta = resetReportsStore();
  send(res, 200, {
    ok: true,
    store: meta,
  });
}

async function handleDevReportUpdate(req, res, requestUrl) {
  if (!isLocalDevelopmentMutationAllowed(req)) {
    send(res, 403, { error: "forbidden_dev_mutation" });
    return;
  }

  const reportId = validateReportId(requestUrl.pathname.split("/").filter(Boolean).at(-1));
  if (!reportId.ok) {
    send(res, 400, { error: "invalid_report_id", message: reportId.error });
    return;
  }

  const body = await readJson(req).catch(() => null);
  if (!body || typeof body !== "object") {
    send(res, 400, { error: "invalid_body", message: "body invalid." });
    return;
  }

  const title = normalizeOptionalStringField(body.title, 160);
  const description = normalizeOptionalStringField(body.description, 420);
  const city = normalizeOptionalStringField(body.city, 120);
  const locality = normalizeOptionalStringField(body.locality, 120);
  const niche = normalizeOptionalStringField(body.niche, 120);
  const profitabilityScore = normalizeOptionalNumberField(body.profitabilityScore, 0, 100);
  const interestCount = normalizeOptionalNumberField(body.interestCount, 0, 10_000);
  const trustPercentage = normalizeOptionalNumberField(body.trustPercentage, 0, 100);
  const opportunityStage = normalizeOptionalOpportunityStage(body.opportunityStage);
  const discussionReady = normalizeOptionalBooleanField(body.discussionReady);

  const normalizedFields = [
    title,
    description,
    city,
    locality,
    niche,
    profitabilityScore,
    interestCount,
    trustPercentage,
    opportunityStage,
    discussionReady,
  ];

  if (normalizedFields.some((field) => field && typeof field === "object" && "error" in field)) {
    send(res, 400, { error: "invalid_patch_payload" });
    return;
  }

  const updatedRecord = updateReportInStore(reportId.value, {
    report: {
      ...(typeof title === "string" ? { title } : {}),
      ...(typeof description === "string" ? { description } : {}),
      ...(typeof city === "string" ? { city } : {}),
      ...(typeof locality === "string" ? { locality } : {}),
      ...(typeof niche === "string" ? { niche } : {}),
      ...(typeof profitabilityScore === "number" ? { profitabilityScore } : {}),
      ...(typeof interestCount === "number" ? { interestCount } : {}),
      ...(typeof trustPercentage === "number" ? { trustPercentage } : {}),
    },
    opportunity: {
      ...(typeof opportunityStage === "string" ? { stage: opportunityStage } : {}),
      ...(typeof discussionReady === "boolean" ? { discussionReady } : {}),
    },
  });

  if (!updatedRecord) {
    send(res, 404, { error: "report_not_found" });
    return;
  }

  send(res, 200, {
    ok: true,
    record: updatedRecord,
    store: getReportsStoreMeta(),
  });
}

async function handleDevReportCreate(req, res) {
  if (!isLocalDevelopmentMutationAllowed(req)) {
    send(res, 403, { error: "forbidden_dev_mutation" });
    return;
  }

  const body = await readJson(req).catch(() => null);
  if (!body || typeof body !== "object") {
    send(res, 400, { error: "invalid_body", message: "body invalid." });
    return;
  }

  const title = normalizeRequiredStringField(body.title, 160);
  const description = normalizeRequiredStringField(body.description, 420);
  const city = normalizeRequiredStringField(body.city, 120);
  const locality = normalizeRequiredStringField(body.locality, 120);
  const niche = normalizeRequiredStringField(body.niche, 120);
  const profitabilityScore = normalizeOptionalNumberField(body.profitabilityScore, 0, 100);
  const interestCount = normalizeOptionalNumberField(body.interestCount, 0, 10_000);
  const trustPercentage = normalizeOptionalNumberField(body.trustPercentage, 0, 100);
  const opportunityStage = normalizeOptionalOpportunityStage(body.opportunityStage);
  const discussionReady = normalizeOptionalBooleanField(body.discussionReady);

  const requiredFields = [title, description, city, locality, niche];
  const optionalFields = [profitabilityScore, interestCount, trustPercentage, opportunityStage, discussionReady];
  if (
    requiredFields.some((field) => typeof field !== "string")
    || optionalFields.some((field) => field && typeof field === "object" && "error" in field)
  ) {
    send(res, 400, { error: "invalid_create_payload" });
    return;
  }

  const createdRecord = createReportInStore({
    title,
    description,
    city,
    locality,
    niche,
    profitabilityScore: typeof profitabilityScore === "number" ? profitabilityScore : 60,
    interestCount: typeof interestCount === "number" ? interestCount : 3,
    trustPercentage: typeof trustPercentage === "number" ? trustPercentage : 55,
    opportunity: {
      stage: typeof opportunityStage === "string" ? opportunityStage : "idea",
      discussionReady: typeof discussionReady === "boolean" ? discussionReady : false,
    },
  });

  send(res, 201, {
    ok: true,
    record: createdRecord,
    store: getReportsStoreMeta(),
  });
}

async function handleDevReportDelete(req, res, requestUrl) {
  if (!isLocalDevelopmentMutationAllowed(req)) {
    send(res, 403, { error: "forbidden_dev_mutation" });
    return;
  }

  const reportId = validateReportId(requestUrl.pathname.split("/").filter(Boolean).at(-1));
  if (!reportId.ok) {
    send(res, 400, { error: "invalid_report_id", message: reportId.error });
    return;
  }

  const deleted = deleteReportInStore(reportId.value);
  if (!deleted) {
    send(res, 404, { error: "report_not_found" });
    return;
  }

  send(res, 200, {
    ok: true,
    deletedReportId: reportId.value,
    store: getReportsStoreMeta(),
  });
}

async function handleDevReportsExport(req, res) {
  if (!isLocalDevelopmentMutationAllowed(req)) {
    send(res, 403, { error: "forbidden_dev_mutation" });
    return;
  }

  send(res, 200, getReportsStoreExport());
}

async function handleDevReportsImport(req, res) {
  if (!isLocalDevelopmentMutationAllowed(req)) {
    send(res, 403, { error: "forbidden_dev_mutation" });
    return;
  }

  const body = await readJson(req).catch(() => null);
  if (!body || typeof body !== "object") {
    send(res, 400, { error: "invalid_body", message: "body invalid." });
    return;
  }

  const records = Array.isArray(body.records)
    ? body.records
    : Array.isArray(body)
      ? body
      : null;

  const storeMeta = importReportsIntoStore(records);
  if (!storeMeta) {
    send(res, 400, { error: "invalid_import_payload" });
    return;
  }

  send(res, 200, {
    ok: true,
    importedCount: records.length,
    store: storeMeta,
  });
}

async function handleDevReportsImportPreview(req, res) {
  if (!isLocalDevelopmentMutationAllowed(req)) {
    send(res, 403, { error: "forbidden_dev_mutation" });
    return;
  }

  const body = await readJson(req).catch(() => null);
  if (!body || typeof body !== "object") {
    send(res, 400, { error: "invalid_body", message: "body invalid." });
    return;
  }

  const records = Array.isArray(body.records)
    ? body.records
    : Array.isArray(body)
      ? body
      : null;

  const preview = previewReportsImport(records);
  if (!preview) {
    send(res, 400, { error: "invalid_import_payload" });
    return;
  }

  send(res, 200, {
    ok: true,
    preview,
  });
}

async function handlePlacesTextSearch(req, res, requestUrl) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    send(res, 501, { error: "google_places_not_configured" });
    return;
  }

  const query = validateQueryString(requestUrl.searchParams.get("query"), "query");
  if (!query.ok) {
    send(res, 400, { error: "invalid_query", message: query.error });
    return;
  }

  const region = requestUrl.searchParams.get("region")?.trim() || "ro";
  const language = requestUrl.searchParams.get("language")?.trim() || "ro";

  const maxResultsRaw = Number(requestUrl.searchParams.get("maxResults") ?? 5);
  const maxResults = Number.isFinite(maxResultsRaw) ? Math.min(10, Math.max(1, Math.round(maxResultsRaw))) : 5;

  const payload = {
    textQuery: query.value,
    maxResultCount: maxResults,
    languageCode: language,
    regionCode: region,
  };
  const cacheKey = buildCacheKey([
    "google_places_text_search",
    query.value.toLowerCase(),
    region.toLowerCase(),
    language.toLowerCase(),
    maxResults,
  ]);

  const { payload: normalizedPayload, cacheState } = await resolveCachedPayload({
    cacheKey,
    ttlMs: CACHE_TTLS_MS.placesTextSearch,
    producer: async () => {
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
          "x-goog-fieldmask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.rating",
            "places.userRatingCount",
            "places.primaryType",
            "places.types",
          ].join(","),
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      if (!response.ok) {
        const error = new Error("google_places_error");
        error.statusCode = response.status;
        error.details = raw.slice(0, 1200);
        throw error;
      }

      return normalizePlacesResponse(JSON.parse(raw), {
        query: query.value,
        region,
        language,
        maxResults,
      });
    },
  }).catch((error) => {
    send(res, error?.statusCode ?? 500, {
      error: "google_places_error",
      details: typeof error?.details === "string" ? error.details : String(error?.message ?? "unknown_error"),
    });
    return null;
  });

  if (!normalizedPayload) return;
  send(res, 200, normalizedPayload, {
    "x-opportuniq-cache": cacheState,
  });
}

async function handlePlaceDetails(req, res, requestUrl) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    send(res, 501, { error: "google_places_not_configured" });
    return;
  }

  const placeId = validatePlaceId(requestUrl.searchParams.get("placeId"));
  if (!placeId.ok) {
    send(res, 400, { error: "invalid_place_id", message: placeId.error });
    return;
  }

  const cacheKey = buildCacheKey([
    "google_place_details",
    placeId.value,
  ]);

  const { payload: normalizedPayload, cacheState } = await resolveCachedPayload({
    cacheKey,
    ttlMs: CACHE_TTLS_MS.placeDetails,
    producer: async () => {
      const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId.value)}`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
          "x-goog-fieldmask": [
            "id",
            "displayName",
            "formattedAddress",
            "rating",
            "userRatingCount",
            "primaryType",
            "nationalPhoneNumber",
            "websiteUri",
            "reviews",
          ].join(","),
        },
      });

      const raw = await response.text();
      if (!response.ok) {
        const error = new Error("google_places_error");
        error.statusCode = response.status;
        error.details = raw.slice(0, 1200);
        throw error;
      }

      return normalizePlaceDetailsResponse(JSON.parse(raw), {
        placeId: placeId.value,
      });
    },
  }).catch((error) => {
    send(res, error?.statusCode ?? 500, {
      error: "google_places_error",
      details: typeof error?.details === "string" ? error.details : String(error?.message ?? "unknown_error"),
    });
    return null;
  });

  if (!normalizedPayload) return;
  send(res, 200, normalizedPayload, {
    "x-opportuniq-cache": cacheState,
  });
}

async function handleAiReviewIntelligence(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    send(res, 501, { error: "openai_not_configured" });
    return;
  }

  const body = await readJson(req).catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const niche = sanitizeText(body?.niche, 120);
  const locality = sanitizeText(body?.locality, 120);
  const county = sanitizeText(body?.county, 120);
  const sourceLabel = sanitizeText(body?.sourceLabel, 120);
  const reviewCount = clamp(Math.round(toFiniteNumber(body?.reviewCount) ?? 0), 0, 10_000);

  if (!text) {
    send(res, 400, { error: "invalid_text", message: "text lipseste." });
    return;
  }
  if (text.length > 25_000) {
    send(res, 400, { error: "invalid_text", message: "text este prea lung." });
    return;
  }

  const system = [
    "Esti un analist de piata pentru Romania.",
    "Extrage teme concrete din reviews (probleme, frecventa, severitate, recenta).",
    "Nu inventa fapte. Nu mentiona date personale. Intoarce JSON strict.",
    "OpenAI nu este sursa de adevar; doar structureaza dovezile textuale primite.",
  ].join(" ");

  const user = [
    "Analizeaza urmatorul text (reviews).",
    "Context optional:",
    `- sursa: ${sourceLabel || "nespecificata"}`,
    `- nisa: ${niche || "nespecificata"}`,
    `- localitate: ${locality || "nespecificata"}`,
    `- judet: ${county || "nespecificat"}`,
    `- numar_reviews: ${reviewCount || 0}`,
    "Returneaza JSON cu chei:",
    "topics[] unde fiecare element are label, frequency(isolated|recurring|dominant), severity(low|medium|high), evidenceQuote;",
    "sentiment (negative|mixed_negative|mixed|mixed_positive|positive);",
    "issue_frequency_score(0-100), issue_severity_score(0-100), recency_score(0-100), manipulation_risk_score(0-100), summary.",
    "",
    text,
  ].join("\n");
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const cacheKey = buildCacheKey([
    "review_intelligence",
    model,
    sourceLabel,
    niche,
    locality,
    county,
    reviewCount,
    text,
  ]);

  const { payload: normalizedPayload, cacheState } = await resolveCachedPayload({
    cacheKey,
    ttlMs: CACHE_TTLS_MS.reviewIntelligence,
    producer: async () => {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_output_tokens: 900,
        }),
      });

      const raw = await response.text();
      if (!response.ok) {
        const error = new Error("openai_error");
        error.statusCode = response.status;
        error.details = raw.slice(0, 1200);
        throw error;
      }

      return normalizeReviewIntelligencePayload(JSON.parse(raw));
    },
  }).catch((error) => {
    send(res, error?.statusCode ?? 500, {
      error: "openai_error",
      details: typeof error?.details === "string" ? error.details : String(error?.message ?? "unknown_error"),
    });
    return null;
  });

  if (!normalizedPayload) return;
  send(res, 200, normalizedPayload, {
    "x-opportuniq-cache": cacheState,
  });
}

export async function handleApiRequest(req, res) {
  try {
    if (isRateLimited(req)) {
      send(res, 429, { error: "rate_limited" });
      return;
    }

    const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (requestUrl.pathname === "/api/health") {
      send(res, 200, {
        ok: true,
        runtime: process.env.VERCEL ? "vercel" : "node_local",
        reportsStorePersistence: isReportsStorePersistenceAvailable() ? "available" : "read_only_fallback",
        externalProviders: {
          googlePlaces: process.env.GOOGLE_MAPS_API_KEY ? "configured" : "missing",
          openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
        },
      });
      return;
    }

    if ((req.method === "GET" || req.method === "PUT") && requestUrl.pathname === "/api/me/profile") {
      await handleLocalProfile(req, res);
      return;
    }

    if (req.method === "PUT" && requestUrl.pathname === "/api/me/digest") {
      await handleLocalDigest(req, res);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/analytics/track") {
      await handleAnalyticsTrack(req, res);
      return;
    }

    if (
      (req.method === "GET" || req.method === "POST" || req.method === "DELETE")
      && requestUrl.pathname === "/api/debug/events"
    ) {
      await handleDebugEvents(req, res, requestUrl);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/reports") {
      await handleReportsList(req, res, requestUrl);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/dev/reports/reset") {
      await handleDevReportsReset(req, res);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/dev/reports/export") {
      await handleDevReportsExport(req, res);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/dev/reports/import") {
      await handleDevReportsImport(req, res);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/dev/reports/import/preview") {
      await handleDevReportsImportPreview(req, res);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/dev/reports") {
      await handleDevReportCreate(req, res);
      return;
    }

    if (req.method === "PUT" && /^\/api\/dev\/reports\/\d+$/.test(requestUrl.pathname)) {
      await handleDevReportUpdate(req, res, requestUrl);
      return;
    }

    if (req.method === "DELETE" && /^\/api\/dev\/reports\/\d+$/.test(requestUrl.pathname)) {
      await handleDevReportDelete(req, res, requestUrl);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/external/places/text-search") {
      await handlePlacesTextSearch(req, res, requestUrl);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/external/places/details") {
      await handlePlaceDetails(req, res, requestUrl);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/external/ai/review-intelligence") {
      await handleAiReviewIntelligence(req, res);
      return;
    }

    send(res, 404, { error: "not_found" });
  } catch (error) {
    send(res, 500, {
      error: "internal_error",
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export const server = http.createServer(handleApiRequest);

const isDirectExecution = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isDirectExecution) {
  server.listen(PORT, () => {
    process.stdout.write(`OpportunIQ API server listening on http://localhost:${PORT}\n`);
  });
}
