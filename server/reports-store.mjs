import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listSeedReportRecords } from "./reports-source.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_STORE_DIR = path.join(__dirname, "data");
const REPORTS_STORE_FILE = path.join(REPORTS_STORE_DIR, "reports-store.json");
let reportsStorePersistenceAvailable = true;

function clone(value) {
  return structuredClone(value);
}

function sanitizeString(value, maxLength = 240) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.slice(0, maxLength);
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function normalizeLimit(limit, fallback = 20, max = 50) {
  const numeric = Number(limit ?? fallback);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(1, Math.round(numeric)));
}

function buildInitialState(previousVersion = 0) {
  return {
    version: previousVersion + 1,
    hydratedAt: new Date().toISOString(),
    records: listSeedReportRecords(50),
  };
}

function slugifySegment(value, fallback = "semnal-local") {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function getNextReportId() {
  const maxId = reportsStoreState.records.reduce(
    (currentMax, record) => Math.max(currentMax, Math.round(Number(record.reportId) || 0)),
    0,
  );
  return maxId + 1;
}

function getRecordTemplate() {
  return clone(reportsStoreState.records[0] ?? listSeedReportRecords(1)[0]);
}

function syncRecordFromReport(record) {
  const nextRecord = clone(record);
  const signalId = buildSignalIdFromRecord(nextRecord);
  nextRecord.signal.title = nextRecord.report.title;
  nextRecord.signal.category = nextRecord.report.niche ?? "Oportunitate";
  nextRecord.signal.location = nextRecord.report.locality || nextRecord.report.city;
  nextRecord.signal.description = nextRecord.report.description;
  nextRecord.signal.score = Math.round(Number(nextRecord.report.profitabilityScore ?? 0));
  nextRecord.signal.interestedCount = Math.round(Number(nextRecord.report.interestCount ?? 0));
  nextRecord.signal.id = signalId;
  return nextRecord;
}

function buildSignalIdFromRecord(record) {
  const hrefSegment = String(record?.report?.href ?? "")
    .split("/")
    .filter(Boolean)
    .at(-1);
  return hrefSegment || `report-${record?.reportId ?? Date.now()}`;
}

function buildDerivedReasonCodes(report) {
  const reasonCodes = [];
  if (Number(report.profitabilityScore ?? 0) >= 75) reasonCodes.push("potential_profitabilitate");
  if (Number(report.trustPercentage ?? 0) >= 70) reasonCodes.push("incredere_peste_medie");
  if (Number(report.interestCount ?? 0) >= 10) reasonCodes.push("interes_local");
  return reasonCodes.length > 0 ? reasonCodes : ["semnal_nou_local"];
}

function buildRecordFromInput(input) {
  const nextId = getNextReportId();
  const template = getRecordTemplate();
  const now = new Date().toISOString();
  const slug = slugifySegment(input.title, `report-${nextId}`);
  const profitabilityScore = Math.round(Number(input.profitabilityScore ?? 60));
  const interestCount = Math.round(Number(input.interestCount ?? 3));
  const trustPercentage = Math.round(Number(input.trustPercentage ?? 55));
  const discussionReady = Boolean(input.opportunity?.discussionReady ?? false);
  const stage = input.opportunity?.stage ?? "idea";
  const report = {
    ...template.report,
    id: nextId,
    title: input.title,
    description: input.description,
    city: input.city,
    locality: input.locality,
    countyCode: null,
    niche: input.niche,
    reportType: "oportunitate_construita",
    profitabilityScore,
    updatedAt: now,
    interestCount,
    trustVoteCount: 0,
    trustPercentage,
    aiPriority: {
      score: profitabilityScore,
      evidenceScore: trustPercentage,
      opportunityScore: profitabilityScore,
      reasons: [
        "Raport creat in laboratorul local",
        `Nisa: ${input.niche}`,
        `Oras: ${input.locality || input.city}`,
      ],
    },
    evidence: {
      confidenceScore: trustPercentage,
      whitespaceScore: Math.max(35, profitabilityScore - 5),
    },
    aiInsight: {
      verdict: "Semnal nou creat in laboratorul local. Necesita validare cu date reale.",
      whyThisReport: "Este un raport introdus manual pentru iterare rapida asupra produsului.",
      signalPulse: {
        score: profitabilityScore,
      },
    },
    trustProfile: {
      confidenceScore: trustPercentage,
      signalClass: trustPercentage >= 70 ? "semnal_in_crestere" : "semnal_emerget",
      recommendedUse: discussionReady ? "Discutie controlata si validare rapida" : "Validare locala initiala",
    },
    freshness: {
      core: {
        state: "fresh",
        ageHours: 0,
      },
    },
    commercialStage: {
      bucket: stage === "pitch" ? "validated" : stage === "plan" ? "qualified" : "radar",
      feedKind: "opportunity",
      feedStage: stage === "pitch" ? "oportunitate_validata" : stage === "plan" ? "in_crestere" : "calificat",
      reasonCodes: buildDerivedReasonCodes({
        profitabilityScore,
        trustPercentage,
        interestCount,
      }),
    },
    href: `/semnale/${slug}`,
  };
  const nextRecord = syncRecordFromReport({
    ...template,
    reportId: nextId,
    report,
    opportunity: {
      stage,
      discussionReady,
    },
    signal: {
      ...template.signal,
      title: report.title,
      category: report.niche ?? "Oportunitate",
      location: report.locality || report.city,
      description: report.description,
      score: profitabilityScore,
      interestedCount: interestCount,
      tags: [
        "Creat in laborator",
        discussionReady ? "Pregatit pentru discutie" : "Necesita validare",
        input.niche,
      ],
    },
  });
  return nextRecord;
}

function extractImportIssueMeta(record) {
  if (!record || typeof record !== "object") {
    return {
      reportId: null,
      title: null,
    };
  }

  const reportIdValue = Number(record.reportId ?? record?.report?.id);
  return {
    reportId: Number.isFinite(reportIdValue) && reportIdValue > 0 ? Math.round(reportIdValue) : null,
    title: sanitizeString(record?.report?.title, 160) || null,
  };
}

function prepareImportedRecord(record, fallbackId) {
  if (!record || typeof record !== "object") {
    return { ok: false, reason: "invalid_record_shape" };
  }
  if (!record.report || typeof record.report !== "object") {
    return { ok: false, reason: "missing_report" };
  }

  const template = getRecordTemplate();
  const reportId = clampNumber(record.reportId ?? record.report.id ?? fallbackId, 1, 1_000_000, fallbackId);
  const title = sanitizeString(record.report.title, 160);
  const description = sanitizeString(record.report.description, 420);
  const city = sanitizeString(record.report.city, 120);
  const locality = sanitizeString(record.report.locality ?? record.report.city, 120);
  const niche = sanitizeString(record.report.niche, 120);
  if (!title) return { ok: false, reason: "missing_title" };
  if (!description) return { ok: false, reason: "missing_description" };
  if (!city || !locality) return { ok: false, reason: "missing_city" };
  if (!niche) return { ok: false, reason: "missing_niche" };

  const stage = ["idea", "validation", "plan", "pitch"].includes(record?.opportunity?.stage)
    ? record.opportunity.stage
    : "idea";
  const discussionReady = Boolean(record?.opportunity?.discussionReady);
  const profitabilityScore = clampNumber(record.report.profitabilityScore, 0, 100, 60);
  const interestCount = clampNumber(record.report.interestCount, 0, 10_000, 3);
  const trustPercentage = clampNumber(record.report.trustPercentage, 0, 100, 55);
  const href =
    sanitizeString(record.report.href, 200)
    || `/semnale/${slugifySegment(title, `report-${reportId}`)}`;

  const nextRecord = syncRecordFromReport({
    ...template,
    reportId,
    report: {
      ...template.report,
      ...clone(record.report),
      id: reportId,
      title,
      description,
      city,
      locality,
      niche,
      profitabilityScore,
      interestCount,
      trustPercentage,
      updatedAt: sanitizeString(record.report.updatedAt, 80) || new Date().toISOString(),
      href,
    },
    opportunity: {
      ...template.opportunity,
      stage,
      discussionReady,
    },
    signal: {
      ...template.signal,
      ...(record.signal && typeof record.signal === "object" ? clone(record.signal) : {}),
      title,
      category: niche,
      location: locality || city,
      description,
      score: profitabilityScore,
      interestedCount: interestCount,
    },
  });

  return {
    ok: true,
    record: nextRecord,
  };
}

function analyzeImportedRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const preparedEntries = [];
  const issues = [];
  const issueCounts = new Map();
  const frequencyByReportId = new Map();

  const pushIssue = (index, reason, record) => {
    issues.push({
      index,
      reason,
      ...extractImportIssueMeta(record),
    });
    issueCounts.set(reason, (issueCounts.get(reason) ?? 0) + 1);
  };

  records.forEach((record, index) => {
    const prepared = prepareImportedRecord(record, index + 1);
    if (!prepared.ok) {
      pushIssue(index + 1, prepared.reason, record);
      return;
    }

    preparedEntries.push({
      index: index + 1,
      rawRecord: record,
      normalizedRecord: prepared.record,
    });
    const reportId = prepared.record.reportId;
    frequencyByReportId.set(reportId, (frequencyByReportId.get(reportId) ?? 0) + 1);
  });

  const normalizedRecords = [];
  const acceptedIds = new Set();
  for (const entry of preparedEntries) {
    const reportId = entry.normalizedRecord.reportId;
    const appears = frequencyByReportId.get(reportId) ?? 0;
    if (appears > 1) {
      if (acceptedIds.has(reportId)) {
        pushIssue(entry.index, "duplicate_report_id", entry.rawRecord);
        continue;
      }
      acceptedIds.add(reportId);
    }
    normalizedRecords.push(entry.normalizedRecord);
  }

  const currentStoreRecords = reportsStoreState.records.map((record) => clone(record));
  const currentStoreById = new Map(currentStoreRecords.map((record) => [record.reportId, record]));
  const currentStoreIds = new Set(currentStoreRecords.map((record) => record.reportId));
  const importedIds = new Set(normalizedRecords.map((record) => record.reportId));
  const overlapCount = normalizedRecords.filter((record) => currentStoreIds.has(record.reportId)).length;
  const removedRecords = currentStoreRecords.filter((record) => !importedIds.has(record.reportId));
  const newRecords = normalizedRecords.filter((record) => !currentStoreIds.has(record.reportId));
  const changedEntries = normalizedRecords
    .filter((record) => currentStoreIds.has(record.reportId))
    .map((record) => {
      const currentRecord = currentStoreById.get(record.reportId);
      if (!currentRecord) return null;

      const changedFields = [];
      if (sanitizeString(currentRecord.report.title, 160) !== sanitizeString(record.report.title, 160)) {
        changedFields.push("title");
      }
      if (sanitizeString(currentRecord.report.description, 420) !== sanitizeString(record.report.description, 420)) {
        changedFields.push("description");
      }
      if (sanitizeString(currentRecord.report.city, 120) !== sanitizeString(record.report.city, 120)) {
        changedFields.push("city");
      }
      if (sanitizeString(currentRecord.report.locality, 120) !== sanitizeString(record.report.locality, 120)) {
        changedFields.push("locality");
      }
      if (sanitizeString(currentRecord.report.niche, 120) !== sanitizeString(record.report.niche, 120)) {
        changedFields.push("niche");
      }
      if (clampNumber(currentRecord.report.profitabilityScore, 0, 100, 0) !== clampNumber(record.report.profitabilityScore, 0, 100, 0)) {
        changedFields.push("profitabilityScore");
      }
      if (clampNumber(currentRecord.report.interestCount, 0, 10_000, 0) !== clampNumber(record.report.interestCount, 0, 10_000, 0)) {
        changedFields.push("interestCount");
      }
      if (clampNumber(currentRecord.report.trustPercentage, 0, 100, 0) !== clampNumber(record.report.trustPercentage, 0, 100, 0)) {
        changedFields.push("trustPercentage");
      }
      if (sanitizeString(currentRecord.opportunity.stage, 20) !== sanitizeString(record.opportunity.stage, 20)) {
        changedFields.push("opportunityStage");
      }
      if (Boolean(currentRecord.opportunity.discussionReady) !== Boolean(record.opportunity.discussionReady)) {
        changedFields.push("discussionReady");
      }

      if (changedFields.length === 0) {
        return null;
      }

      return {
        reportId: record.reportId,
        title: sanitizeString(record.report.title, 160),
        changedFields,
      };
    })
    .filter(Boolean);
  const changedOverlapCount = changedEntries.length;
  const unchangedOverlapCount = Math.max(0, overlapCount - changedOverlapCount);
  const duplicateIdsInsideFile = Array.from(frequencyByReportId.values()).reduce(
    (accumulator, count) => accumulator + Math.max(0, count - 1),
    0,
  );

  return {
    importedCount: records.length,
    currentStoreCount: currentStoreRecords.length,
    validCount: normalizedRecords.length,
    invalidCount: issues.length,
    overlapCount,
    unchangedOverlapCount,
    changedOverlapCount,
    newCount: Math.max(0, normalizedRecords.length - overlapCount),
    removedCount: removedRecords.length,
    duplicateIdsInsideFile,
    canImport: issues.length === 0,
    sampleTitles: normalizedRecords
      .map((record) => sanitizeString(record.report.title, 160))
      .filter(Boolean)
      .slice(0, 5),
    newSampleTitles: newRecords
      .map((record) => sanitizeString(record.report.title, 160))
      .filter(Boolean)
      .slice(0, 5),
    removedSampleTitles: removedRecords
      .map((record) => sanitizeString(record.report.title, 160))
      .filter(Boolean)
      .slice(0, 5),
    changedEntries: changedEntries.slice(0, 5),
    issues: issues.slice(0, 5),
    issueCounts: Array.from(issueCounts.entries()).map(([reason, count]) => ({
      reason,
      count,
    })),
    normalizedRecords,
  };
}

function ensureStoreDirectory() {
  if (!existsSync(REPORTS_STORE_DIR)) {
    mkdirSync(REPORTS_STORE_DIR, { recursive: true });
  }
}

function persistReportsStoreState(state) {
  try {
    ensureStoreDirectory();
    writeFileSync(REPORTS_STORE_FILE, JSON.stringify(state, null, 2), "utf8");
    reportsStorePersistenceAvailable = true;
    return true;
  } catch {
    reportsStorePersistenceAvailable = false;
    return false;
  }
}

function readPersistedReportsStoreState() {
  if (!existsSync(REPORTS_STORE_FILE)) return null;
  try {
    const parsed = JSON.parse(readFileSync(REPORTS_STORE_FILE, "utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.records)) return null;
    return {
      version: Number.isFinite(Number(parsed.version)) ? Math.max(1, Math.round(Number(parsed.version))) : 1,
      hydratedAt:
        typeof parsed.hydratedAt === "string" && parsed.hydratedAt.trim()
          ? parsed.hydratedAt
          : new Date().toISOString(),
      records: parsed.records.map((record) => clone(record)),
    };
  } catch {
    return null;
  }
}

function hydrateReportsStoreState() {
  const persisted = readPersistedReportsStoreState();
  if (persisted) return persisted;
  const initialState = buildInitialState();
  persistReportsStoreState(initialState);
  return initialState;
}

let reportsStoreState = hydrateReportsStoreState();

export function getReportsStoreMeta() {
  return {
    version: reportsStoreState.version,
    hydratedAt: reportsStoreState.hydratedAt,
    source: "local_store_seed",
  };
}

export function isReportsStorePersistenceAvailable() {
  return reportsStorePersistenceAvailable;
}

export function listReportsFromStore(limit = 20) {
  const safeLimit = normalizeLimit(limit);
  return reportsStoreState.records.slice(0, safeLimit).map((record) => clone(record));
}

export function getReportsStoreSnapshot(limit = 20) {
  const records = listReportsFromStore(limit);
  const meta = getReportsStoreMeta();
  return {
    source: meta.source,
    fetchedAt: new Date().toISOString(),
    storeVersion: meta.version,
    storeHydratedAt: meta.hydratedAt,
    records,
    reports: records.map((record) => record.report),
  };
}

export function getReportsStoreExport() {
  const meta = getReportsStoreMeta();
  return {
    exportedAt: new Date().toISOString(),
    store: meta,
    records: reportsStoreState.records.map((record) => clone(record)),
  };
}

export function resetReportsStore() {
  reportsStoreState = buildInitialState(reportsStoreState.version);
  persistReportsStoreState(reportsStoreState);
  return getReportsStoreMeta();
}

export function updateReportInStore(reportId, input) {
  const normalizedId = Math.round(Number(reportId));
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return null;
  }

  const index = reportsStoreState.records.findIndex((record) => record.reportId === normalizedId);
  if (index < 0) {
    return null;
  }

  const currentRecord = clone(reportsStoreState.records[index]);
  const nextRecord = syncRecordFromReport({
    ...currentRecord,
    report: {
      ...currentRecord.report,
      ...input.report,
      updatedAt: new Date().toISOString(),
    },
    opportunity: {
      ...currentRecord.opportunity,
      ...input.opportunity,
    },
  });

  reportsStoreState = {
    ...reportsStoreState,
    version: reportsStoreState.version + 1,
    records: reportsStoreState.records.map((record, recordIndex) =>
      recordIndex === index ? nextRecord : record,
    ),
  };
  persistReportsStoreState(reportsStoreState);
  return clone(nextRecord);
}

export function createReportInStore(input) {
  const nextRecord = buildRecordFromInput(input);
  reportsStoreState = {
    ...reportsStoreState,
    version: reportsStoreState.version + 1,
    records: [nextRecord, ...reportsStoreState.records],
  };
  persistReportsStoreState(reportsStoreState);
  return clone(nextRecord);
}

export function deleteReportInStore(reportId) {
  const normalizedId = Math.round(Number(reportId));
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return false;
  }
  const nextRecords = reportsStoreState.records.filter((record) => record.reportId !== normalizedId);
  if (nextRecords.length === reportsStoreState.records.length) {
    return false;
  }
  reportsStoreState = {
    ...reportsStoreState,
    version: reportsStoreState.version + 1,
    records: nextRecords,
  };
  persistReportsStoreState(reportsStoreState);
  return true;
}

export function importReportsIntoStore(records) {
  const analysis = analyzeImportedRecords(records);
  if (!analysis || !analysis.canImport) {
    return null;
  }

  reportsStoreState = {
    version: reportsStoreState.version + 1,
    hydratedAt: new Date().toISOString(),
    records: analysis.normalizedRecords,
  };
  persistReportsStoreState(reportsStoreState);
  return getReportsStoreMeta();
}

export function previewReportsImport(records) {
  const analysis = analyzeImportedRecords(records);
  if (!analysis) {
    return null;
  }

  return {
    importedCount: analysis.importedCount,
    currentStoreCount: analysis.currentStoreCount,
    validCount: analysis.validCount,
    invalidCount: analysis.invalidCount,
    overlapCount: analysis.overlapCount,
    unchangedOverlapCount: analysis.unchangedOverlapCount,
    changedOverlapCount: analysis.changedOverlapCount,
    newCount: analysis.newCount,
    removedCount: analysis.removedCount,
    duplicateIdsInsideFile: analysis.duplicateIdsInsideFile,
    canImport: analysis.canImport,
    sampleTitles: analysis.sampleTitles,
    newSampleTitles: analysis.newSampleTitles,
    removedSampleTitles: analysis.removedSampleTitles,
    changedEntries: analysis.changedEntries,
    issues: analysis.issues,
    issueCounts: analysis.issueCounts,
  };
}
