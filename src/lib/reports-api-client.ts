import type {
  DevReportCreateInput,
  DevReportCreateResponse,
  DevReportDeleteResponse,
  DevReportsExportResponse,
  DevReportsImportPreviewResponse,
  DevReportsImportResponse,
  DevReportUpdateInput,
  DevReportUpdateResponse,
  DevReportsResetResponse,
  ReportsApiErrorResponse,
  ReportsApiResponse,
} from "@/lib/reports-api-contract";

type ReportsApiResultStatus =
  | "ok"
  | "network_error"
  | "request_error"
  | "invalid_response";

export type ReportsApiResult<T> = {
  status: ReportsApiResultStatus;
  data: T | null;
  errorCode?: string;
  message?: string;
};

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchReports(input?: {
  limit?: number;
}): Promise<ReportsApiResult<ReportsApiResponse>> {
  const params = new URLSearchParams();
  if (Number.isFinite(Number(input?.limit))) {
    params.set("limit", String(input?.limit));
  }

  const path = params.toString() ? `/api/reports?${params.toString()}` : "/api/reports";

  try {
    const response = await fetch(`${BASE()}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await parseJsonResponse<ReportsApiResponse | ReportsApiErrorResponse>(response);

    if (!response.ok) {
      const errorPayload = (payload ?? null) as ReportsApiErrorResponse | null;
      return {
        status: "request_error",
        data: null,
        errorCode: errorPayload?.error ?? `http_${response.status}`,
        message: errorPayload?.message,
      };
    }

    if (!payload || !Array.isArray((payload as ReportsApiResponse).reports)) {
      return {
        status: "invalid_response",
        data: null,
        errorCode: "invalid_reports_payload",
      };
    }

    return {
      status: "ok",
      data: payload as ReportsApiResponse,
    };
  } catch (error) {
    return {
      status: "network_error",
      data: null,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : "unknown_network_error",
    };
  }
}

export async function resetDevReports(): Promise<ReportsApiResult<DevReportsResetResponse>> {
  try {
    const response = await fetch(`${BASE()}/api/dev/reports/reset`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await parseJsonResponse<DevReportsResetResponse | ReportsApiErrorResponse>(response);

    if (!response.ok) {
      const errorPayload = (payload ?? null) as ReportsApiErrorResponse | null;
      return {
        status: "request_error",
        data: null,
        errorCode: errorPayload?.error ?? `http_${response.status}`,
        message: errorPayload?.message,
      };
    }

    if (!payload || !(payload as DevReportsResetResponse).ok) {
      return {
        status: "invalid_response",
        data: null,
        errorCode: "invalid_reports_reset_payload",
      };
    }

    return {
      status: "ok",
      data: payload as DevReportsResetResponse,
    };
  } catch (error) {
    return {
      status: "network_error",
      data: null,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : "unknown_network_error",
    };
  }
}

export async function updateDevReport(
  reportId: number,
  input: DevReportUpdateInput,
): Promise<ReportsApiResult<DevReportUpdateResponse>> {
  try {
    const response = await fetch(`${BASE()}/api/dev/reports/${reportId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const payload = await parseJsonResponse<DevReportUpdateResponse | ReportsApiErrorResponse>(response);

    if (!response.ok) {
      const errorPayload = (payload ?? null) as ReportsApiErrorResponse | null;
      return {
        status: "request_error",
        data: null,
        errorCode: errorPayload?.error ?? `http_${response.status}`,
        message: errorPayload?.message,
      };
    }

    if (!payload || !(payload as DevReportUpdateResponse).ok) {
      return {
        status: "invalid_response",
        data: null,
        errorCode: "invalid_report_update_payload",
      };
    }

    return {
      status: "ok",
      data: payload as DevReportUpdateResponse,
    };
  } catch (error) {
    return {
      status: "network_error",
      data: null,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : "unknown_network_error",
    };
  }
}

export async function createDevReport(
  input: DevReportCreateInput,
): Promise<ReportsApiResult<DevReportCreateResponse>> {
  try {
    const response = await fetch(`${BASE()}/api/dev/reports`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const payload = await parseJsonResponse<DevReportCreateResponse | ReportsApiErrorResponse>(response);

    if (!response.ok) {
      const errorPayload = (payload ?? null) as ReportsApiErrorResponse | null;
      return {
        status: "request_error",
        data: null,
        errorCode: errorPayload?.error ?? `http_${response.status}`,
        message: errorPayload?.message,
      };
    }

    if (!payload || !(payload as DevReportCreateResponse).ok) {
      return {
        status: "invalid_response",
        data: null,
        errorCode: "invalid_report_create_payload",
      };
    }

    return {
      status: "ok",
      data: payload as DevReportCreateResponse,
    };
  } catch (error) {
    return {
      status: "network_error",
      data: null,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : "unknown_network_error",
    };
  }
}

export async function deleteDevReport(
  reportId: number,
): Promise<ReportsApiResult<DevReportDeleteResponse>> {
  try {
    const response = await fetch(`${BASE()}/api/dev/reports/${reportId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await parseJsonResponse<DevReportDeleteResponse | ReportsApiErrorResponse>(response);

    if (!response.ok) {
      const errorPayload = (payload ?? null) as ReportsApiErrorResponse | null;
      return {
        status: "request_error",
        data: null,
        errorCode: errorPayload?.error ?? `http_${response.status}`,
        message: errorPayload?.message,
      };
    }

    if (!payload || !(payload as DevReportDeleteResponse).ok) {
      return {
        status: "invalid_response",
        data: null,
        errorCode: "invalid_report_delete_payload",
      };
    }

    return {
      status: "ok",
      data: payload as DevReportDeleteResponse,
    };
  } catch (error) {
    return {
      status: "network_error",
      data: null,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : "unknown_network_error",
    };
  }
}

export async function exportDevReports(): Promise<ReportsApiResult<DevReportsExportResponse>> {
  try {
    const response = await fetch(`${BASE()}/api/dev/reports/export`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await parseJsonResponse<DevReportsExportResponse | ReportsApiErrorResponse>(response);

    if (!response.ok) {
      const errorPayload = (payload ?? null) as ReportsApiErrorResponse | null;
      return {
        status: "request_error",
        data: null,
        errorCode: errorPayload?.error ?? `http_${response.status}`,
        message: errorPayload?.message,
      };
    }

    if (!payload || !Array.isArray((payload as DevReportsExportResponse).records)) {
      return {
        status: "invalid_response",
        data: null,
        errorCode: "invalid_reports_export_payload",
      };
    }

    return {
      status: "ok",
      data: payload as DevReportsExportResponse,
    };
  } catch (error) {
    return {
      status: "network_error",
      data: null,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : "unknown_network_error",
    };
  }
}

export async function importDevReports(
  payload: { records: unknown[] },
): Promise<ReportsApiResult<DevReportsImportResponse>> {
  try {
    const response = await fetch(`${BASE()}/api/dev/reports/import`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const parsed = await parseJsonResponse<DevReportsImportResponse | ReportsApiErrorResponse>(response);

    if (!response.ok) {
      const errorPayload = (parsed ?? null) as ReportsApiErrorResponse | null;
      return {
        status: "request_error",
        data: null,
        errorCode: errorPayload?.error ?? `http_${response.status}`,
        message: errorPayload?.message,
      };
    }

    if (!parsed || !(parsed as DevReportsImportResponse).ok) {
      return {
        status: "invalid_response",
        data: null,
        errorCode: "invalid_reports_import_payload",
      };
    }

    return {
      status: "ok",
      data: parsed as DevReportsImportResponse,
    };
  } catch (error) {
    return {
      status: "network_error",
      data: null,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : "unknown_network_error",
    };
  }
}

export async function previewDevReportsImport(
  payload: { records: unknown[] },
): Promise<ReportsApiResult<DevReportsImportPreviewResponse>> {
  try {
    const response = await fetch(`${BASE()}/api/dev/reports/import/preview`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const parsed = await parseJsonResponse<DevReportsImportPreviewResponse | ReportsApiErrorResponse>(response);

    if (!response.ok) {
      const errorPayload = (parsed ?? null) as ReportsApiErrorResponse | null;
      return {
        status: "request_error",
        data: null,
        errorCode: errorPayload?.error ?? `http_${response.status}`,
        message: errorPayload?.message,
      };
    }

    if (!parsed || !(parsed as DevReportsImportPreviewResponse).ok) {
      return {
        status: "invalid_response",
        data: null,
        errorCode: "invalid_reports_import_preview_payload",
      };
    }

    return {
      status: "ok",
      data: parsed as DevReportsImportPreviewResponse,
    };
  } catch (error) {
    return {
      status: "network_error",
      data: null,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : "unknown_network_error",
    };
  }
}
