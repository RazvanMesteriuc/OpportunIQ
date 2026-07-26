import type { FeedReportInput } from "@/lib/feed-items";

export type ReportSeedSignalView = {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  score: number;
  interestedCount: number;
  imageUrl: string;
  badgeClassName: string;
  badgeTextClassName: string;
  accentClassName: string;
  tags: string[];
};

export type ReportSeedOpportunitySummary = {
  stage: "idea" | "validation" | "plan" | "pitch";
  discussionReady: boolean;
};

export type ReportSeedRecord = {
  reportId: number;
  signal: ReportSeedSignalView;
  opportunity: ReportSeedOpportunitySummary;
  report: FeedReportInput;
};

export type ReportsApiSource = "local_seed" | "local_store_seed";

export type ReportsStoreMeta = {
  version: number;
  hydratedAt: string;
  source: ReportsApiSource;
};

export type ReportsApiResponse = {
  source: ReportsApiSource;
  fetchedAt: string;
  storeVersion?: number;
  storeHydratedAt?: string;
  records: ReportSeedRecord[];
  reports: FeedReportInput[];
};

export type ReportsApiErrorResponse = {
  error: string;
  message?: string;
};

export type DevReportUpdateInput = {
  title?: string;
  description?: string;
  city?: string;
  locality?: string;
  niche?: string;
  profitabilityScore?: number;
  interestCount?: number;
  trustPercentage?: number;
  opportunityStage?: ReportSeedOpportunitySummary["stage"];
  discussionReady?: boolean;
};

export type DevReportCreateInput = {
  title: string;
  description: string;
  city: string;
  locality: string;
  niche: string;
  profitabilityScore?: number;
  interestCount?: number;
  trustPercentage?: number;
  opportunityStage?: ReportSeedOpportunitySummary["stage"];
  discussionReady?: boolean;
};

export type DevReportsResetResponse = {
  ok: true;
  store: ReportsStoreMeta;
};

export type DevReportCreateResponse = {
  ok: true;
  record: ReportSeedRecord;
  store: ReportsStoreMeta;
};

export type DevReportUpdateResponse = {
  ok: true;
  record: ReportSeedRecord;
  store: ReportsStoreMeta;
};

export type DevReportDeleteResponse = {
  ok: true;
  deletedReportId: number;
  store: ReportsStoreMeta;
};

export type DevReportsExportResponse = {
  exportedAt: string;
  store: ReportsStoreMeta;
  records: ReportSeedRecord[];
};

export type DevReportsImportResponse = {
  ok: true;
  importedCount: number;
  store: ReportsStoreMeta;
};

export type DevReportsImportPreviewIssueReason =
  | "invalid_record_shape"
  | "missing_report"
  | "missing_title"
  | "missing_description"
  | "missing_city"
  | "missing_niche"
  | "duplicate_report_id";

export type DevReportsImportPreviewIssue = {
  index: number;
  reason: DevReportsImportPreviewIssueReason;
  reportId: number | null;
  title: string | null;
};

export type DevReportsImportPreviewChangedField =
  | "title"
  | "description"
  | "city"
  | "locality"
  | "niche"
  | "profitabilityScore"
  | "interestCount"
  | "trustPercentage"
  | "opportunityStage"
  | "discussionReady";

export type DevReportsImportPreviewChangedEntry = {
  reportId: number;
  title: string;
  changedFields: DevReportsImportPreviewChangedField[];
};

export type DevReportsImportPreviewReasonCount = {
  reason: DevReportsImportPreviewIssueReason;
  count: number;
};

export type DevReportsImportPreviewSummary = {
  importedCount: number;
  currentStoreCount: number;
  validCount: number;
  invalidCount: number;
  overlapCount: number;
  unchangedOverlapCount: number;
  changedOverlapCount: number;
  newCount: number;
  removedCount: number;
  duplicateIdsInsideFile: number;
  canImport: boolean;
  sampleTitles: string[];
  newSampleTitles: string[];
  removedSampleTitles: string[];
  changedEntries: DevReportsImportPreviewChangedEntry[];
  issues: DevReportsImportPreviewIssue[];
  issueCounts: DevReportsImportPreviewReasonCount[];
};

export type DevReportsImportPreviewResponse = {
  ok: true;
  preview: DevReportsImportPreviewSummary;
};
