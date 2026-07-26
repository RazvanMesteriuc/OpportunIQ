import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Download, Plus, RefreshCcw, RotateCcw, Save, Settings2, Trash2, Upload } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createDevReport,
  deleteDevReport,
  exportDevReports,
  fetchReports,
  importDevReports,
  previewDevReportsImport,
  resetDevReports,
  updateDevReport,
} from "@/lib/reports-api-client";
import { getOpportunityStageLabel } from "@/lib/opportunity-stage-label";
import type {
  DevReportsImportPreviewChangedField,
  DevReportsImportPreviewIssueReason,
  DevReportsImportPreviewSummary,
  ReportSeedOpportunitySummary,
  ReportSeedRecord,
  ReportsApiSource,
} from "@/lib/reports-api-contract";

type ReportDraft = {
  title: string;
  description: string;
  city: string;
  locality: string;
  niche: string;
  profitabilityScore: string;
  interestCount: string;
  trustPercentage: string;
  opportunityStage: ReportSeedOpportunitySummary["stage"];
  discussionReady: boolean;
};

type ReportSortOption =
  | "updated_desc"
  | "profit_desc"
  | "interest_desc"
  | "trust_desc"
  | "title_asc";

type PendingImportPreview = {
  fileName: string;
  records: unknown[];
} & DevReportsImportPreviewSummary;

const STAGE_OPTIONS: Array<{
  value: ReportSeedOpportunitySummary["stage"];
  label: string;
}> = [
  { value: "idea", label: "Idee" },
  { value: "validation", label: "Validare" },
  { value: "plan", label: "Plan" },
  { value: "pitch", label: "Pitch" },
];

function buildDraft(record: ReportSeedRecord): ReportDraft {
  return {
    title: record.report.title ?? "",
    description: record.report.description ?? "",
    city: record.report.city ?? "",
    locality: record.report.locality ?? "",
    niche: record.report.niche ?? "",
    profitabilityScore: String(record.report.profitabilityScore ?? 0),
    interestCount: String(record.report.interestCount ?? 0),
    trustPercentage: String(record.report.trustPercentage ?? 0),
    opportunityStage: record.opportunity.stage,
    discussionReady: record.opportunity.discussionReady,
  };
}

function buildEmptyDraft(): ReportDraft {
  return {
    title: "",
    description: "",
    city: "",
    locality: "",
    niche: "",
    profitabilityScore: "60",
    interestCount: "3",
    trustPercentage: "55",
    opportunityStage: "idea",
    discussionReady: false,
  };
}

function getSourceLabel(source?: ReportsApiSource) {
  if (source === "local_store_seed") return "Store local persistent";
  return "Seed local";
}

function getImportIssueReasonLabel(reason: DevReportsImportPreviewIssueReason) {
  switch (reason) {
    case "invalid_record_shape":
      return "Structură de înregistrare invalidă";
    case "missing_report":
      return "Obiectul report lipsește";
    case "missing_title":
      return "Titlul lipsește";
    case "missing_description":
      return "Descrierea lipsește";
    case "missing_city":
      return "Orașul lipsește";
    case "missing_niche":
      return "Nișa lipsește";
    case "duplicate_report_id":
      return "ID duplicat în fișier";
    default:
      return "Problemă necunoscută";
  }
}

function getChangedFieldLabel(field: DevReportsImportPreviewChangedField) {
  switch (field) {
    case "title":
      return "Titlu";
    case "description":
      return "Descriere";
    case "city":
      return "Oraș";
    case "locality":
      return "Localitate";
    case "niche":
      return "Nișă";
    case "profitabilityScore":
      return "Profitabilitate";
    case "interestCount":
      return "Interes";
    case "trustPercentage":
      return "Încredere";
    case "opportunityStage":
      return "Stadiu";
    case "discussionReady":
      return "Pregătit pentru discuție";
    default:
      return "Câmp necunoscut";
  }
}

export default function DevReportsPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<ReportSeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [storeVersion, setStoreVersion] = useState<number | null>(null);
  const [storeHydratedAt, setStoreHydratedAt] = useState<string | null>(null);
  const [source, setSource] = useState<ReportsApiSource | undefined>(undefined);
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [createDraft, setCreateDraft] = useState<ReportDraft>(() => buildEmptyDraft());
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<"toate" | ReportSeedOpportunitySummary["stage"]>("toate");
  const [cityFilter, setCityFilter] = useState("toate");
  const [nicheFilter, setNicheFilter] = useState("toate");
  const [sortBy, setSortBy] = useState<ReportSortOption>("updated_desc");
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const loadReports = useCallback(async (showBusyState = true) => {
    if (showBusyState) setLoading(true);
    setRefreshing(!showBusyState);
    setError(null);

    const result = await fetchReports({ limit: 50 });
    if (result.status !== "ok" || !result.data) {
      setError(result.message ?? "Nu am putut încărca lista de rapoarte.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setRecords(result.data.records);
    setStoreVersion(result.data.storeVersion ?? null);
    setStoreHydratedAt(result.data.storeHydratedAt ?? null);
    setSource(result.data.source);
    setSelectedReportId((current) => {
      if (current && result.data?.records.some((record) => record.reportId === current)) {
        return current;
      }
      return result.data?.records[0]?.reportId ?? null;
    });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadReports(true);
  }, [loadReports]);

  const cityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .map((record) => record.report.city?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right, "ro")),
    [records],
  );

  const nicheOptions = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .map((record) => record.report.niche?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right, "ro")),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        !normalizedSearch
        || [
          record.report.title,
          record.report.description,
          record.report.city,
          record.report.locality,
          record.report.niche,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesStage = stageFilter === "toate" || record.opportunity.stage === stageFilter;
      const matchesCity = cityFilter === "toate" || record.report.city === cityFilter;
      const matchesNiche = nicheFilter === "toate" || record.report.niche === nicheFilter;
      return matchesSearch && matchesStage && matchesCity && matchesNiche;
    });
  }, [cityFilter, nicheFilter, records, searchTerm, stageFilter]);

  const sortedFilteredRecords = useMemo(() => {
    const nextRecords = [...filteredRecords];
    nextRecords.sort((left, right) => {
      if (sortBy === "profit_desc") {
        return Number(right.report.profitabilityScore ?? 0) - Number(left.report.profitabilityScore ?? 0);
      }
      if (sortBy === "interest_desc") {
        return Number(right.report.interestCount ?? 0) - Number(left.report.interestCount ?? 0);
      }
      if (sortBy === "trust_desc") {
        return Number(right.report.trustPercentage ?? 0) - Number(left.report.trustPercentage ?? 0);
      }
      if (sortBy === "title_asc") {
        return String(left.report.title ?? "").localeCompare(String(right.report.title ?? ""), "ro");
      }
      const leftTs = new Date(left.report.updatedAt ?? 0).getTime();
      const rightTs = new Date(right.report.updatedAt ?? 0).getTime();
      return rightTs - leftTs;
    });
    return nextRecords;
  }, [filteredRecords, sortBy]);

  const filteredKpis = useMemo(() => {
    if (sortedFilteredRecords.length === 0) {
      return {
        averageProfitability: 0,
        averageTrust: 0,
        totalInterest: 0,
        discussionReadyCount: 0,
      };
    }

    const totals = sortedFilteredRecords.reduce(
      (accumulator, record) => {
        accumulator.profitability += Number(record.report.profitabilityScore ?? 0);
        accumulator.trust += Number(record.report.trustPercentage ?? 0);
        accumulator.interest += Number(record.report.interestCount ?? 0);
        accumulator.discussionReady += record.opportunity.discussionReady ? 1 : 0;
        return accumulator;
      },
      { profitability: 0, trust: 0, interest: 0, discussionReady: 0 },
    );

    return {
      averageProfitability: Math.round(totals.profitability / sortedFilteredRecords.length),
      averageTrust: Math.round(totals.trust / sortedFilteredRecords.length),
      totalInterest: totals.interest,
      discussionReadyCount: totals.discussionReady,
    };
  }, [sortedFilteredRecords]);

  useEffect(() => {
    if (sortedFilteredRecords.length === 0) {
      setSelectedReportId(null);
      return;
    }
    if (!selectedReportId || !sortedFilteredRecords.some((record) => record.reportId === selectedReportId)) {
      setSelectedReportId(sortedFilteredRecords[0].reportId);
    }
  }, [selectedReportId, sortedFilteredRecords]);

  const selectedRecord = useMemo(
    () => sortedFilteredRecords.find((record) => record.reportId === selectedReportId) ?? null,
    [selectedReportId, sortedFilteredRecords],
  );

  useEffect(() => {
    if (!selectedRecord) {
      setDraft(null);
      return;
    }
    setDraft(buildDraft(selectedRecord));
  }, [selectedRecord]);

  const handleSave = async () => {
    if (!selectedRecord || !draft) return;

    setSaving(true);
    const result = await updateDevReport(selectedRecord.reportId, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      city: draft.city.trim(),
      locality: draft.locality.trim(),
      niche: draft.niche.trim(),
      profitabilityScore: Number(draft.profitabilityScore),
      interestCount: Number(draft.interestCount),
      trustPercentage: Number(draft.trustPercentage),
      opportunityStage: draft.opportunityStage,
      discussionReady: draft.discussionReady,
    });
    setSaving(false);

    if (result.status !== "ok" || !result.data) {
      toast({
        title: "Salvarea a eșuat",
        description: result.message ?? "Serverul local a respins actualizarea.",
        variant: "destructive",
      });
      return;
    }

    const updatedRecord = result.data.record;
    setRecords((current) =>
      current.map((record) => (record.reportId === updatedRecord.reportId ? updatedRecord : record)),
    );
    setStoreVersion(result.data.store.version);
    setStoreHydratedAt(result.data.store.hydratedAt);
    setSource(result.data.store.source);
    setDraft(buildDraft(updatedRecord));
    toast({
      title: "Raport actualizat",
      description: "Modificările au fost salvate în store-ul local persistent.",
    });
  };

  const handleReset = async () => {
    if (!window.confirm("Resetezi store-ul local de rapoarte la seed-ul curent?")) {
      return;
    }

    setResetting(true);
    const result = await resetDevReports();
    setResetting(false);

    if (result.status !== "ok" || !result.data) {
      toast({
        title: "Resetarea a eșuat",
        description: result.message ?? "Store-ul local nu a putut fi resetat.",
        variant: "destructive",
      });
      return;
    }

    await loadReports(false);
    toast({
      title: "Store resetat",
      description: "Rapoartele locale au fost reîncărcate din seed.",
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    const result = await createDevReport({
      title: createDraft.title.trim(),
      description: createDraft.description.trim(),
      city: createDraft.city.trim(),
      locality: createDraft.locality.trim(),
      niche: createDraft.niche.trim(),
      profitabilityScore: Number(createDraft.profitabilityScore),
      interestCount: Number(createDraft.interestCount),
      trustPercentage: Number(createDraft.trustPercentage),
      opportunityStage: createDraft.opportunityStage,
      discussionReady: createDraft.discussionReady,
    });
    setCreating(false);

    if (result.status !== "ok" || !result.data) {
      toast({
        title: "Crearea a eșuat",
        description: result.message ?? "Serverul local a respins raportul nou.",
        variant: "destructive",
      });
      return;
    }

    const createdRecord = result.data.record;
    setRecords((current) => [createdRecord, ...current]);
    setSelectedReportId(createdRecord.reportId);
    setStoreVersion(result.data.store.version);
    setStoreHydratedAt(result.data.store.hydratedAt);
    setSource(result.data.store.source);
    setCreateDraft(buildEmptyDraft());
    toast({
      title: "Raport creat",
      description: "Raportul nou a fost salvat în store-ul local persistent.",
    });
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    if (!window.confirm(`Ștergi raportul "${selectedRecord.report.title}" din store-ul local?`)) {
      return;
    }

    setDeleting(true);
    const result = await deleteDevReport(selectedRecord.reportId);
    setDeleting(false);

    if (result.status !== "ok" || !result.data) {
      toast({
        title: "Ștergerea a eșuat",
        description: result.message ?? "Raportul nu a putut fi șters.",
        variant: "destructive",
      });
      return;
    }

    const deletedReportId = result.data.deletedReportId;
    setRecords((current) => {
      const nextRecords = current.filter((record) => record.reportId !== deletedReportId);
      setSelectedReportId(nextRecords[0]?.reportId ?? null);
      return nextRecords;
    });
    setStoreVersion(result.data.store.version);
    setStoreHydratedAt(result.data.store.hydratedAt);
    setSource(result.data.store.source);
    toast({
      title: "Raport șters",
      description: "Înregistrarea a fost eliminată din store-ul local.",
    });
  };

  const handleExport = async () => {
    setExporting(true);
    const result = await exportDevReports();
    setExporting(false);

    if (result.status !== "ok" || !result.data) {
      toast({
        title: "Exportul a eșuat",
        description: result.message ?? "Nu am putut genera exportul JSON.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `opportuniq-reports-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export generat",
      description: `Au fost exportate ${result.data.records.length} rapoarte din store-ul local.`,
    });
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) return;
    if (!pendingImport.canImport) {
      toast({
        title: "Import blocat",
        description:
          pendingImport.duplicateIdsInsideFile > 0
            ? "Fișierul conține ID-uri duplicate. Curăță exportul înainte de confirmare."
            : "Fișierul conține intrări invalide. Corectează problemele semnalate în preview.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    const result = await importDevReports({ records: pendingImport.records });
    if (result.status !== "ok" || !result.data) {
      setImporting(false);
      toast({
        title: "Importul a eșuat",
        description: result.message ?? "Serverul local a respins fișierul importat.",
        variant: "destructive",
      });
      return;
    }

    await loadReports(false);
    setPendingImport(null);
    setImporting(false);
    toast({
      title: "Import reușit",
      description: `Au fost importate ${result.data.importedCount} rapoarte în store-ul local.`,
    });
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const rawText = await file.text();
      const parsed: unknown = JSON.parse(rawText);
      const parsedObject = parsed && typeof parsed === "object" ? parsed : null;
      const importedRecords = Array.isArray((parsedObject as { records?: unknown })?.records)
        ? ((parsedObject as { records: unknown[] }).records ?? null)
        : Array.isArray(parsed)
          ? parsed
          : null;
      if (!importedRecords) {
        throw new Error("Fișierul nu conține un câmp records valid.");
      }

      const previewResult = await previewDevReportsImport({ records: importedRecords });
      if (previewResult.status !== "ok" || !previewResult.data) {
        throw new Error(previewResult.message ?? "Preview-ul server-side nu a putut valida fișierul.");
      }

      setPendingImport({
        fileName: file.name,
        records: importedRecords,
        ...previewResult.data.preview,
      });
    } catch (error) {
      toast({
        title: "Import invalid",
        description: error instanceof Error ? error.message : "Fișierul JSON nu a putut fi citit.",
        variant: "destructive",
      });
    }
  };

  return (
    <PublicLayout>
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-6 md:px-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge className="bg-amber-100 text-amber-900 border-amber-200">Laborator local</Badge>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">Administrare rapoarte</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  Panou local pentru editarea seed-ului server-side care alimentează Home și Semnale.
                  Nu este backoffice de producție și nu trebuie confundat cu un modul multi-tenant real.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge variant="outline">{getSourceLabel(source)}</Badge>
                <Badge variant="outline">Versiune store: {storeVersion ?? "-"}</Badge>
                <Badge variant="outline">
                  Hidratare: {storeHydratedAt ? new Date(storeHydratedAt).toLocaleString("ro-RO") : "-"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => void handleImportFile(event)}
              />
              <Button variant="outline" onClick={handleExport} disabled={exporting || loading}>
                <Download className={exporting ? "animate-pulse" : ""} />
                Exportă JSON
              </Button>
              <Button variant="outline" onClick={handleImportClick} disabled={importing || loading}>
                <Upload className={importing ? "animate-pulse" : ""} />
                Importă JSON
              </Button>
              <Button variant="outline" onClick={() => void loadReports(false)} disabled={loading || refreshing}>
                <RefreshCcw className={refreshing ? "animate-spin" : ""} />
                Reîncarcă
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={resetting || loading}>
                <RotateCcw className={resetting ? "animate-spin" : ""} />
                Resetează store-ul
              </Button>
              <Button asChild>
                <Link href="/semnale">Vezi semnalele</Link>
              </Button>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </section>
        ) : null}

        {pendingImport ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Preview import</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{pendingImport.fileName}</h2>
                <p className="mt-2 text-sm text-slate-700">
                  Importul va înlocui complet store-ul local curent. Verifică sumarul înainte să confirmi.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setPendingImport(null)} disabled={importing}>
                  Anulează preview-ul
                </Button>
                <Button
                  onClick={() => void handleConfirmImport()}
                  disabled={importing || !pendingImport.canImport}
                >
                  <Upload className={importing ? "animate-pulse" : ""} />
                  Confirmă importul
                </Button>
              </div>
            </div>

            {!pendingImport.canImport ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                Importul este blocat deoarece preview-ul server-side a găsit date invalide sau ambigue.
                Store-ul local nu trebuie înlocuit cu un export inconsistent.
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rapoarte în fișier</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{pendingImport.importedCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rapoarte în store</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{pendingImport.currentStoreCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Intrări valide</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{pendingImport.validCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Intrări invalide</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{pendingImport.invalidCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">ID-uri deja existente</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{pendingImport.overlapCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">ID-uri duplicate în fișier</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{pendingImport.duplicateIdsInsideFile}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Tipuri de probleme detectate
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendingImport.issueCounts.length > 0 ? (
                    pendingImport.issueCounts.map((entry) => (
                      <Badge key={`${entry.reason}-${entry.count}`} variant="outline">
                        {getImportIssueReasonLabel(entry.reason)}: {entry.count}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-emerald-700">Preview curat. Nu au fost detectate probleme structurale.</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Intrări potențial noi după validare: <strong>{pendingImport.newCount}</strong>
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Impact asupra store-ului curent
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">ID-uri păstrate</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{pendingImport.overlapCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Neschimbate</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{pendingImport.unchangedOverlapCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Suprascrise</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{pendingImport.changedOverlapCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Intrări noi</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{pendingImport.newCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Vor dispărea</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{pendingImport.removedCount}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Preview-ul compară store-ul local curent cu setul valid rezultat după normalizare. Pentru ID-urile
                  păstrate, separă intrările neschimbate de cele care vor rescrie conținut relevant.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Exemple de intrări cu probleme
                </p>
                <div className="mt-3 space-y-2">
                  {pendingImport.issues.length > 0 ? (
                    pendingImport.issues.map((issue) => (
                      <div key={`${issue.index}-${issue.reason}-${issue.reportId ?? "none"}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                        #{issue.index} · {getImportIssueReasonLabel(issue.reason)}
                        {issue.title ? ` · ${issue.title}` : ""}
                        {issue.reportId ? ` · ID ${issue.reportId}` : ""}
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-emerald-700">Nu există exemple de erori. Fișierul a trecut validarea structurală.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Exemple de intrări suprascrise
                </p>
                <div className="mt-3 space-y-2">
                  {pendingImport.changedEntries.length > 0 ? (
                    pendingImport.changedEntries.map((entry) => (
                      <div
                        key={`changed-${entry.reportId}`}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      >
                        ID {entry.reportId} · {entry.title}
                        {" · "}
                        {entry.changedFields.map((field) => getChangedFieldLabel(field)).join(", ")}
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-emerald-700">Nu există exemple de intrări suprascrise cu diferențe relevante.</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Exemple de intrări noi
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendingImport.newSampleTitles.length > 0 ? (
                    pendingImport.newSampleTitles.map((title) => (
                      <Badge key={`new-${title}`} variant="outline">
                        {title}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Nu există exemple noi. Fișierul reutilizează doar ID-uri deja prezente.</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Exemple de intrări care dispar
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendingImport.removedSampleTitles.length > 0 ? (
                    pendingImport.removedSampleTitles.map((title) => (
                      <Badge key={`removed-${title}`} variant="outline">
                        {title}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Nicio intrare existentă nu dispare complet din store la acest import.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Exemple din import</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingImport.sampleTitles.length > 0 ? (
                  pendingImport.sampleTitles.map((title) => (
                    <Badge key={title} variant="outline">
                      {title}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">Fișierul nu conține titluri lizibile pentru preview.</span>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Profit mediu</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{loading ? "..." : filteredKpis.averageProfitability}</p>
            <p className="mt-1 text-xs text-slate-500">
              {loading ? "Calculăm după încărcarea rapoartelor locale" : "Calculat pe lista filtrată curentă"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Încredere medie</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {loading ? "..." : `${filteredKpis.averageTrust}%`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {loading ? "Calculăm după încărcarea rapoartelor locale" : "Semnale suficient de solide pentru triere"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Interes cumulat</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{loading ? "..." : filteredKpis.totalInterest}</p>
            <p className="mt-1 text-xs text-slate-500">
              {loading ? "Calculăm după încărcarea rapoartelor locale" : "Volum total din subsetul vizibil"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pregătite pentru discuție</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {loading ? "..." : filteredKpis.discussionReadyCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {loading ? "Calculăm după încărcarea rapoartelor locale" : "Intrări cu potențial mai acționabil"}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Lista rapoartelor</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  {loading ? "Încărcăm înregistrările..." : `${filteredRecords.length} din ${records.length} înregistrări`}
                </h2>
              </div>
              <Settings2 className="text-slate-400" size={18} />
            </div>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3">
                <Input
                  placeholder="Caută după titlu, descriere, oraș sau nișă"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  disabled={loading}
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <select
                    value={stageFilter}
                    onChange={(event) =>
                      setStageFilter(event.target.value as "toate" | ReportSeedOpportunitySummary["stage"])
                    }
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="toate">Toate stadiile</option>
                    {STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={cityFilter}
                    onChange={(event) => setCityFilter(event.target.value)}
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="toate">Toate orașele</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>

                  <select
                    value={nicheFilter}
                    onChange={(event) => setNicheFilter(event.target.value)}
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="toate">Toate nișele</option>
                    {nicheOptions.map((niche) => (
                      <option key={niche} value={niche}>
                        {niche}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as ReportSortOption)}
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="updated_desc">Sortare: cele mai recente</option>
                    <option value="profit_desc">Sortare: profitabilitate desc</option>
                    <option value="interest_desc">Sortare: interes desc</option>
                    <option value="trust_desc">Sortare: încredere desc</option>
                    <option value="title_asc">Sortare: titlu A-Z</option>
                  </select>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setStageFilter("toate");
                        setCityFilter("toate");
                        setNicheFilter("toate");
                        setSortBy("updated_desc");
                      }}
                      disabled={
                        loading || (
                        !searchTerm.trim()
                        && stageFilter === "toate"
                        && cityFilter === "toate"
                        && nicheFilter === "toate"
                        && sortBy === "updated_desc")
                      }
                    >
                      Resetează filtrele
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Raport nou
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Creezi rapid o intrare nouă în store-ul local.</p>
                </div>
                <Button size="sm" onClick={handleCreate} disabled={creating}>
                  <Plus className={creating ? "animate-pulse" : ""} />
                  Creează
                </Button>
              </div>

              <div className="grid gap-3">
                <Input
                  placeholder="Titlu raport"
                  value={createDraft.title}
                  onChange={(event) => setCreateDraft((current) => ({ ...current, title: event.target.value }))}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Oraș"
                    value={createDraft.city}
                    onChange={(event) => setCreateDraft((current) => ({ ...current, city: event.target.value }))}
                  />
                  <Input
                    placeholder="Localitate"
                    value={createDraft.locality}
                    onChange={(event) => setCreateDraft((current) => ({ ...current, locality: event.target.value }))}
                  />
                </div>
                <Input
                  placeholder="Nișă"
                  value={createDraft.niche}
                  onChange={(event) => setCreateDraft((current) => ({ ...current, niche: event.target.value }))}
                />
                <Textarea
                  className="min-h-[90px]"
                  placeholder="Descriere scurtă a semnalului"
                  value={createDraft.description}
                  onChange={(event) => setCreateDraft((current) => ({ ...current, description: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Încărcăm rapoartele locale...
                </div>
              ) : null}

              {!loading && records.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Nu există rapoarte în store-ul local.
                </div>
              ) : null}

              {!loading && records.length > 0 && filteredRecords.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Niciun raport nu corespunde filtrelor curente.
                </div>
              ) : null}

              {sortedFilteredRecords.map((record) => {
                const isActive = record.reportId === selectedReportId;
                return (
                  <button
                    key={record.reportId}
                    type="button"
                    onClick={() => setSelectedReportId(record.reportId)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-[#0b5c66] bg-[#0b5c66]/5 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Raport #{record.reportId}
                        </p>
                        <h3 className="mt-1 text-sm font-bold text-slate-950">{record.report.title}</h3>
                      </div>
                      <Badge variant="outline">{getOpportunityStageLabel(record.opportunity.stage)}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {record.report.locality || record.report.city} · {record.report.niche}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Profit: {record.report.profitabilityScore}</span>
                      <span>Interes: {record.report.interestCount}</span>
                      <span>Încredere: {record.report.trustPercentage}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            {!selectedRecord || !draft ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-500">
                Selectează un raport din listă pentru editare.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Editor local
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedRecord.report.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">
                      Modificările se salvează în store-ul persistent și se reflectă în payload-ul folosit de UI.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleDelete} disabled={deleting}>
                      <Trash2 className={deleting ? "animate-pulse" : ""} />
                      Șterge
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className={saving ? "animate-pulse" : ""} />
                      Salvează
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Titlu</span>
                    <Input
                      value={draft.title}
                      onChange={(event) => setDraft((current) => current ? { ...current, title: event.target.value } : current)}
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Nișă</span>
                    <Input
                      value={draft.niche}
                      onChange={(event) => setDraft((current) => current ? { ...current, niche: event.target.value } : current)}
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Oraș</span>
                    <Input
                      value={draft.city}
                      onChange={(event) => setDraft((current) => current ? { ...current, city: event.target.value } : current)}
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Localitate</span>
                    <Input
                      value={draft.locality}
                      onChange={(event) => setDraft((current) => current ? { ...current, locality: event.target.value } : current)}
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Scor profitabilitate</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.profitabilityScore}
                      onChange={(event) =>
                        setDraft((current) => current ? { ...current, profitabilityScore: event.target.value } : current)
                      }
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Interes</span>
                    <Input
                      type="number"
                      min={0}
                      max={10000}
                      value={draft.interestCount}
                      onChange={(event) =>
                        setDraft((current) => current ? { ...current, interestCount: event.target.value } : current)
                      }
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Încredere</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.trustPercentage}
                      onChange={(event) =>
                        setDraft((current) => current ? { ...current, trustPercentage: event.target.value } : current)
                      }
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-700">Stadiu oportunitate</span>
                    <select
                      value={draft.opportunityStage}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                opportunityStage: event.target.value as ReportSeedOpportunitySummary["stage"],
                              }
                            : current,
                        )
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {STAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Descriere</span>
                  <Textarea
                    className="min-h-[140px]"
                    value={draft.description}
                    onChange={(event) =>
                      setDraft((current) => current ? { ...current, description: event.target.value } : current)
                    }
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.discussionReady}
                    onChange={(event) =>
                      setDraft((current) => current ? { ...current, discussionReady: event.target.checked } : current)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Pregătit pentru discuție
                </label>
              </div>
            )}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
